import React, { useState, useEffect } from "react";
import { APP_CONFIG } from "@/config/constants";
import { X, Download, Tag, Brain, Star, Calendar, Clock, FileText, Star as StarFilled } from "lucide-react";
import { ImageWithUrl } from "./ImageWithUrl";
import { ImageCarousel } from "./ImageCarousel";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export interface Image {
  id: string;
  s3_key: string;
  s3_url?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  tags: string[];
  ai_description: string | null;
  created_at: string;
  is_featured: boolean;
}

interface ImageGridProps {
  images: Image[];
  onImageDeleted: () => void;
}

type GroupedImages = {
  [date: string]: Image[];
};

interface FeaturedImagesContentProps {
  images: Image[];
  onSelect: (image: Image) => void;
  onEnsureUrls: (images: Image[]) => Promise<Image[]>;
}

const FeaturedImagesContent = ({ images, onSelect, onEnsureUrls }: FeaturedImagesContentProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    onEnsureUrls(images)
      .then(() => setIsLoading(false))
      .catch(() => setIsLoading(false));
  }, [images, onEnsureUrls]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ImageCarousel images={images} onSelect={onSelect} />;
};

export const ImageGrid = React.memo(({ images, onImageDeleted }: ImageGridProps) => {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [analyzingImages, setAnalyzingImages] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState<string>("");
  const { toast } = useToast();

  
  const groupedImages = images.reduce<GroupedImages>((groups, image) => {
    const date = new Date(image.created_at).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(image);
    return groups;
  }, {});

  
  const sortedDates = Object.keys(groupedImages).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const filteredDates = dateFilter
    ? sortedDates.filter(date => date.includes(dateFilter))
    : sortedDates;

  const getImageUrl = async (s3Key: string) => {
    try {
      if (!s3Key) return '';
      
      const res = await fetch(`${APP_CONFIG.API_BASE_URL}/api/presign-get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: s3Key }),
      });

      if (!res.ok) throw new Error('Failed to get image URL');
      const { url } = await res.json();
      return `${APP_CONFIG.API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
    } catch (error) {
      console.error('Error getting image URL:', error);
      toast({
        title: "Failed to load image",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
      return '';
    }
  };

  
  const ensureFeaturedImageUrls = async (images: Image[]) => {
    const featuredImages = images.filter(img => img.is_featured);
    for (const image of featuredImages) {
      if (!image.s3_url && image.s3_key) {
        image.s3_url = await getImageUrl(image.s3_key);
      }
    }
    return featuredImages;
  };

  const handleDelete = async (image: Image) => {
    try {
      const deleteRes = await fetch('/api/delete-s3-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: image.s3_key }),
      });

      if (!deleteRes.ok) {
        const error = await deleteRes.json();
        throw new Error(`Failed to delete from S3: ${error.message}`);
      }

    
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', image.id);

      if (dbError) throw dbError;

      toast({
        title: "Image deleted",
        description: "The image has been removed successfully",
      });

      setSelectedImage(null);
      onImageDeleted();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const handleAnalyze = async (image: Image) => {
    setAnalyzingImages(prev => new Set(prev).add(image.id));
    
    try {
      const urlResponse = await fetch(`${APP_CONFIG.API_BASE_URL}/api/presign-get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: image.s3_key }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get image URL for analysis');
      }

      const { url: s3Url } = await urlResponse.json();

      const response = await fetch(`${APP_CONFIG.API_BASE_URL}/api/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3Url, imageId: image.id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Analysis failed');
      }

      toast({
        title: "Analysis complete",
        description: "Image has been analyzed and tagged",
      });

      
      onImageDeleted(); 
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze image",
        variant: "destructive"
      });
    } finally {
      setAnalyzingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.id);
        return newSet;
      });
    }
  };

  const handleDownload = async (image: Image) => {
    try {
      const url = await getImageUrl(image.s3_key);
      if (!url) throw new Error('Failed to get download URL');

      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = image.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download image",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (image: Image, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const starButton = event?.currentTarget as HTMLButtonElement;
      if (starButton) {
        starButton.classList.add('scale-125', 'transition-transform', 'duration-200');
        setTimeout(() => starButton.classList.remove('scale-125'), 200);
      }

      const { data, error } = await supabase
        .from('images')
        .update({
          is_featured: !image.is_featured
        })
        .match({ id: image.id })
        .select();

      if (error) throw error;

      const updatedImage = data?.[0];
      if (!updatedImage) throw new Error('Failed to update image');

      toast({
        title: updatedImage.is_featured ? "⭐ Added to featured" : "Removed from featured",
        description: updatedImage.is_featured 
          ? "Image added to featured section" 
          : "Image removed from featured section",
        className: 'animate-in slide-in-from-right duration-300'
      });

      onImageDeleted(); 
    } catch (error) {
      console.error('Toggle featured error:', error);
      toast({
        title: "Action failed",
        description: "Failed to update featured status",
        variant: "destructive"
      });
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No images yet. Upload your first image to get started!</p>
      </div>
    );
  }

  return (
    <>
      {/* Featured Images Carousel */}
      <div className="mb-8 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <StarFilled className="w-6 h-6 text-yellow-400" />
          Featured Images
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({images.filter(img => img.is_featured).length} images)
          </span>
        </h2>
        
        <div className="relative">
          {images.filter(img => img.is_featured).length > 0 ? (
            <div className="animate-in zoom-in-95 duration-300">
              <FeaturedImagesContent 
                images={images.filter(img => img.is_featured)} 
                onSelect={setSelectedImage}
                onEnsureUrls={ensureFeaturedImageUrls}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
              <StarFilled className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground max-w-md mx-auto">
                No featured images yet. Click the star icon on any image to add it to your featured collection.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20"
        />
        {dateFilter && (
          <Button
            variant="ghost"
            onClick={() => setDateFilter("")}
            className="text-sm"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Images by Date */}
      <div className="space-y-8">
        {filteredDates.map((date) => (
          <div key={date} className="space-y-4">
            <h3 className="text-xl font-semibold sticky top-0 bg-white/80 backdrop-blur-sm p-2 z-10">
              {date}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedImages[date].map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer transition-all hover:scale-105 shadow-md hover:shadow-xl"
                  onClick={() => setSelectedImage(image)}
                >
                  <ImageWithUrl
                    imageKey={image.s3_key}
                    alt={image.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-sm font-medium truncate">
                        {image.file_name}
                      </p>
                      {image.tags && image.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {image.tags.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {image.tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{image.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-6xl p-0 overflow-hidden" aria-describedby="image-dialog-description">
          {selectedImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 h-[80vh]">
              {/* Left side - Image */}
              <div className="relative h-full bg-black flex items-center">
                <ImageWithUrl
                  imageKey={selectedImage.s3_key}
                  alt={selectedImage.file_name}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={(e) => toggleFeatured(selectedImage, e)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  {selectedImage.is_featured ? (
                    <StarFilled className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Star className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Right side - Details */}
              <div className="p-6 overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center justify-between">
                    {selectedImage.file_name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                  {/* File Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(selectedImage.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(selectedImage.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedImage.mime_type}</span>
                    </div>
                  </div>

                  {/* AI Description */}
                  {selectedImage.ai_description && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Description
                      </h4>
                      <p className="text-sm text-muted-foreground">{selectedImage.ai_description}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedImage.tags && selectedImage.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Tags
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        {selectedImage.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => handleDownload(selectedImage)}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleAnalyze(selectedImage)}
                      disabled={analyzingImages.has(selectedImage.id)}
                      className="flex-1"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {analyzingImages.has(selectedImage.id) ? 'Analyzing...' : 'Analyze'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(selectedImage)}
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});