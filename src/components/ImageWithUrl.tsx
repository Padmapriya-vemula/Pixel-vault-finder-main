import { useState, useEffect } from 'react';
import { APP_CONFIG } from '@/config/constants';

interface ImageWithUrlProps {
  imageKey: string;
  alt: string;
  className?: string;
}

export const ImageWithUrl = ({ imageKey, alt, className }: ImageWithUrlProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const getImageUrl = async () => {
      try {
        console.log('Requesting presigned URL for key:', imageKey);
        console.log('API_BASE_URL:', APP_CONFIG.API_BASE_URL);
        
        const res = await fetch(`${APP_CONFIG.API_BASE_URL}/api/presign-get`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ key: imageKey }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          console.error('Server response error:', {
            status: res.status,
            statusText: res.statusText,
            data: data
          });
          throw new Error(data.error || 'Failed to get image URL');
        }
        
        console.log('Received presigned URL:', data);
        const proxied = `${APP_CONFIG.API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(data.url)}`;
        console.log('Setting proxied URL:', proxied);
        setImageUrl(proxied);
      } catch (error) {
        console.error('Error getting image URL:', error);
      }
    };

    if (imageKey) {
      getImageUrl();
    }
  }, [imageKey]);

  return imageUrl ? (
    <img src={imageUrl} alt={alt} className={className} />
  ) : (
    <div className={`bg-muted animate-pulse ${className}`} />
  );
};