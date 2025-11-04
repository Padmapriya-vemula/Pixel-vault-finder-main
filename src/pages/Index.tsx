import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageGrid } from "@/components/ImageGrid";
import { SearchBar } from "@/components/SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Camera, LogOut } from "lucide-react";
import { Session } from "@supabase/supabase-js";

interface DatabaseImage {
  id: string;
  s3_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  tags: string[] | null;
  ai_description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_featured?: boolean;
  s3_url?: string | null;
}

interface Image {
  id: string;
  s3_key: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  ai_description: string | null;
  created_at: string;
  is_featured: boolean;
  s3_url: string | null;
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    initAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchImages = async (showToast = false) => {
    if (!session?.user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch images from Supabase
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our Image interface
      const transformedImages = (data || []).map((img: DatabaseImage): Image => ({
        id: img.id,
        s3_key: img.s3_key,
        file_name: img.file_name,
        file_size: img.file_size,
        mime_type: img.mime_type,
        tags: img.tags || [],
        ai_description: img.ai_description,
        created_at: img.created_at,
        is_featured: img.is_featured || false,
        s3_url: img.s3_url || null
      }));

      setImages(transformedImages);
      setFilteredImages(transformedImages);
      
      if (showToast) {
        toast({
          title: "Images refreshed",
          description: "Your gallery has been updated with the latest images.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error refreshing images",
        description: "Failed to fetch your latest images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscription for images
  useEffect(() => {
    if (!session?.user?.id) return;

    // Initial fetch
    fetchImages();

    // Subscribe to changes
    const subscription = supabase
      .channel('images_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'images',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Database change received:', payload);
          // Only fetch all images if really needed (delete/update operations)
          if (payload.eventType === 'DELETE' || payload.eventType === 'UPDATE') {
            fetchImages();
          } else if (payload.eventType === 'INSERT') {
            // For new images, just add to the list without full refresh
            const newImage = payload.new as DatabaseImage;
            const transformedImage: Image = {
              id: newImage.id,
              s3_key: newImage.s3_key,
              file_name: newImage.file_name,
              file_size: newImage.file_size,
              mime_type: newImage.mime_type,
              tags: newImage.tags || [],
              ai_description: newImage.ai_description,
              created_at: newImage.created_at,
              is_featured: newImage.is_featured || false,
              s3_url: newImage.s3_url || null
            };
            setImages(prev => [transformedImage, ...prev]);
            setFilteredImages(prev => [transformedImage, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.id) return;
      if (!searchQuery.trim()) {
        setFilteredImages(images);
        return;
      }
      try {
        const params = new URLSearchParams({
          query: searchQuery,
          userId: session.user.id
        });
        const res = await fetch(`/api/search-images?${params.toString()}`);
        if (!res.ok) throw new Error('Search failed');
        const json = await res.json();
        setFilteredImages(json.images || []);
      } catch (_e) {
        // Fallback to client-side filter if server search fails
        const q = searchQuery.toLowerCase();
        const filtered = images.filter(image => {
          const nameMatch = image.file_name.toLowerCase().includes(q);
          const tagsMatch = image.tags?.some(tag => tag.toLowerCase().includes(q));
          const descriptionMatch = image.ai_description?.toLowerCase().includes(q);
          return nameMatch || tagsMatch || descriptionMatch;
        });
        setFilteredImages(filtered);
      }
    };
    run();
  }, [searchQuery, images, session]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="w-8 h-8 text-primary animate-in zoom-in-50 duration-500" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PhotoVault
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <ImageUpload onUploadComplete={() => fetchImages(true)} />
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {searchQuery ? `Search Results (${filteredImages.length})` : `All Images (${images.length})`}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          ) : (
            <ImageGrid images={filteredImages} onImageDeleted={fetchImages} />
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;