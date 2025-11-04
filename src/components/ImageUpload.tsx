import { useState, useCallback, useEffect } from "react";
import { Upload, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { IMAGE_BUCKET } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface ImageUploadProps {
  onUploadComplete: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export const ImageUpload = ({ onUploadComplete }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Sanitize file names to avoid spaces and problematic characters when storing
  const sanitizeFileName = (name: string) => {
    // remove path separators, trim, replace spaces with underscores, and encodeURI components
    const base = name.replace(/\\/g, '').replace(/\//g, '').trim();
    // replace spaces and multiple dots
    const replaced = base.replace(/\s+/g, '_').replace(/\.+/g, '.');
    // remove any characters that are awkward in object keys
    const cleaned = replaced.replace(/[^a-zA-Z0-9._-]/g, '');
    return encodeURIComponent(cleaned);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const uploadSingleFile = async (file: File, index: number) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Invalid file type. Please upload an image file.');
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Please upload an image smaller than 10MB.');
      }

      if (!userId) throw new Error('User not authenticated');

      // Update progress to 20%
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 20 } : f
      ));

      // Get presigned URL for upload
      const response = await fetch('/api/presign-put', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          userId: userId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, key } = await response.json();

      // Update progress to 40%
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 40 } : f
      ));

      // Create XHR request for better control and progress monitoring
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            setUploadingFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, progress: Math.min(40 + (percentComplete * 0.2), 60) } : f
            ));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        };

        xhr.onerror = (error) => {
          console.error('XHR Error details:', {
            error,
            status: xhr.status,
            statusText: xhr.statusText,
            responseType: xhr.responseType,
            responseText: xhr.responseText,
            readyState: xhr.readyState
          });
          reject(new Error('Network error during upload'));
        };

        // Configure XHR for S3 upload
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', file.type);
        
        // Important: Don't set any AWS-specific headers manually
        // They should come from the presigned URL
        xhr.withCredentials = false;
        
        // Log request details for debugging
        console.log('Sending upload request:', {
          url,
          method: 'PUT',
          contentType: file.type,
          fileSize: file.size
        });
        
        xhr.send(file);
      });

      // Update progress to 60%
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 60 } : f
      ));

      // Get a temporary URL for the uploaded file
      const getUrlResponse = await fetch('/api/presign-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (!getUrlResponse.ok) {
        throw new Error('Failed to get file URL');
      }

      const { url: imageUrl } = await getUrlResponse.json();

      // Save metadata to database
      const { data: imageData, error: dbError } = await supabase
        .from('images')
        .insert({
          s3_key: key,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          user_id: userId,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error('Failed to save image metadata');
      }

      // Update progress to 80%
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 80 } : f
      ));

      // Trigger AI analysis
      try {
        const { error: functionError } = await supabase.functions.invoke('analyze-image', {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: {
            imageUrl,
            imageId: imageData.id
          }
        });

        if (functionError) {
          console.error('AI analysis invocation error:', functionError);
        }
      } catch (invokeErr) {
        console.error('Failed to invoke analyze-image function:', invokeErr);
      }

      // Mark as complete and show processing message
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, progress: 100, status: 'success' } : f
      ));

      // First toast - Upload successful, processing starting
      toast({
        title: "Upload successful",
        description: "Your image is being processed. Please wait...",
        variant: "default",
        duration: 3000
      });

      // Wait for processing to complete (adjust time if needed)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Remove the upload entry
      setUploadingFiles(prev => prev.filter((_, i) => i !== index));
      
      // Second toast - Processing complete
      toast({
        title: "Processing complete",
        description: "Your image is ready to view!",
        variant: "default"
      });

      // Trigger a single refresh after processing
      onUploadComplete();

    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ));
    }
  };

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to upload images",
        variant: "destructive",
      });
      return;
    }

    // Initialize uploading files
    const newFiles: UploadingFile[] = Array.from(files).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(newFiles);

    // Upload all files
    await Promise.all(
      newFiles.map((_, index) => uploadSingleFile(files[index], index))
    );

    // Check if all succeeded
    const hasErrors = newFiles.some(f => f.status === 'error');
    const successCount = newFiles.filter(f => f.status === 'success').length;

    if (successCount > 0) {
      // Show processing message for batch upload
      toast({
        title: "Uploads complete",
        description: `${successCount} image${successCount > 1 ? 's are' : ' is'} being processed...`,
        variant: "default",
        duration: 3000
      });

      // Wait for processing to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Show completion message
      toast({
        title: "Processing complete",
        description: `${successCount} image${successCount > 1 ? 's are' : ' is'} ready to view!${hasErrors ? ' (some uploads failed)' : ''}`,
        variant: "default"
      });

      // Clear the upload list
      setUploadingFiles([]);
      
      // Trigger a single refresh after all processing is complete
      onUploadComplete();
    }
  }, [toast, onUploadComplete, userId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-border bg-card'}
          ${uploadingFiles.length > 0 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:border-primary hover:bg-card/80'}
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploadingFiles.length > 0}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload images</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to browse • Multiple files supported
            </p>
            <Button variant="outline" disabled={uploadingFiles.length > 0}>
              Choose Files
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Supports: JPG, PNG, GIF, WebP • Max size: 10MB per file
          </p>
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          {uploadingFiles.map((uploadFile, index) => (
            <div key={index} className="bg-card border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {uploadFile.status === 'success' && (
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  )}
                  {uploadFile.status === 'uploading' && (
                    <Upload className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-2">
                  {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              
              {uploadFile.status === 'uploading' && (
                <Progress value={uploadFile.progress} className="h-1.5" />
              )}
              
              {uploadFile.status === 'error' && (
                <p className="text-xs text-destructive mt-1">{uploadFile.error}</p>
              )}
              
              {uploadFile.status === 'success' && (
                <p className="text-xs text-green-600 mt-1">Upload complete</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};