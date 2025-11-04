import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { User, Session } from "@supabase/supabase-js";
import { Images } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
  username: z.string().trim().min(2, { message: "Username must be at least 2 characters" }).max(50).optional(),
});

interface AuthState {
  isLogin: boolean;
  email: string;
  password: string;
  username: string;
  loading: boolean;
}

export default function Auth() {
  const [state, setState] = useState<AuthState>({
    isLogin: true,
    email: "",
    password: "",
    username: "",
    loading: false,
  });
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Auth check:', { hasSession: !!session, error });
      if (error) {
        console.error('Auth error:', error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      if (session) {
        console.log('Session found, redirecting to dashboard');
        setSession(session);
        setUser(session.user);
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        navigate("/dashboard");
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState(prev => ({ ...prev, loading: true }));

    try {
      const data = state.isLogin
        ? authSchema.omit({ username: true }).parse({ 
            email: state.email, 
            password: state.password 
          })
        : authSchema.parse({ 
            email: state.email, 
            password: state.password, 
            username: state.username 
          });

      if (state.isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              variant: "destructive",
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          navigate("/dashboard");
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: state.username,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to PhotoVault. You can now start uploading images.",
          });
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: error.errors[0].message,
        });
      }
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value }));
  };

  const toggleAuthMode = () => {
    setState(prev => ({ 
      ...prev, 
      isLogin: !prev.isLogin,
      username: "", // Clear username when switching modes
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Images className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {state.isLogin ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {state.isLogin
              ? "Sign in to access your photos"
              : "Sign up to start organizing your images"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!state.isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  value={state.username}
                  onChange={handleInputChange}
                  required={!state.isLogin}
                  maxLength={50}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={state.email}
                onChange={handleInputChange}
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={state.password}
                onChange={handleInputChange}
                required
                minLength={6}
                maxLength={100}
              />
            </div>
            <Button type="submit" className="w-full" disabled={state.loading}>
              {state.loading ? "Loading..." : state.isLogin ? "Sign in" : "Sign up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={toggleAuthMode}
              className="text-primary hover:underline"
            >
              {state.isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
