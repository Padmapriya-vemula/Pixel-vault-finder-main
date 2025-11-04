import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Image } from "./ImageGrid";
import { cn } from "@/lib/utils";

interface ImageCarouselProps {
  images: Image[];
  onSelect: (image: Image) => void;
}

export const ImageCarousel = ({ images, onSelect }: ImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
      <div
        className="flex transition-transform duration-500 ease-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="min-w-full h-full relative group cursor-pointer"
            onClick={() => onSelect(image)}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-full h-full bg-gray-100 animate-pulse relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <img
                src={image.s3_url || ''}
                alt={image.file_name}
                className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.classList.replace('opacity-0', 'opacity-100');
                  img.parentElement?.classList.remove('animate-pulse');
                }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.classList.add('opacity-0');
                  img.parentElement?.classList.remove('animate-pulse');
                  img.parentElement?.classList.add('bg-red-100');
                  console.error('Failed to load image:', image.s3_url);
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <h3 className="text-xl font-semibold">{image.file_name}</h3>
              <p className="text-sm">
                {new Date(image.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
        onClick={nextSlide}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentIndex === index ? "bg-white" : "bg-white/50"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};