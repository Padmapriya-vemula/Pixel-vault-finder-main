import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Search,
  Star,
  Zap,
  Shield,
  CloudUpload,
  ArrowRight,
} from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Search className="w-6 h-6 text-primary" />,
      title: "Smart Search",
      description:
        "Find your images instantly with AI-powered search. Search by content, colors, or descriptions.",
    },
    {
      icon: <Star className="w-6 h-6 text-primary" />,
      title: "Feature Images",
      description:
        "Mark your favorite images and keep them easily accessible in the featured section.",
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Fast Upload",
      description:
        "Quick and efficient image uploads with automatic tagging and organization.",
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Secure Storage",
      description:
        "Your images are securely stored and accessible only to you.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="w-8 h-8 text-primary animate-in zoom-in-50 duration-500" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PhotoVault
              </h1>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Sign In
              </Button>
              <Button onClick={() => navigate("/auth")}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Personal Image Vault
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload, organize, and find your images with ease. Powered by AI for
            smart search and automatic tagging.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
          
          {/* Preview Image */}
          <div className="mt-16 rounded-lg border bg-card p-2 shadow-2xl">
            <div className="aspect-video rounded-lg bg-muted overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <CloudUpload className="w-20 h-20 text-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your images
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg bg-background border shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who trust PhotoVault for their image management needs.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")}>
            Create Your Account <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <span className="font-semibold">PhotoVault</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PhotoVault. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};