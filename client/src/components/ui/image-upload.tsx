import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url?: string) => void;
  onUploadBegin?: () => void;
  onUploadEnd?: (url?: string, error?: string) => void;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onUploadBegin,
  onUploadEnd,
  className,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);

  // Update preview when value prop changes (e.g., when editing a page)
  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result as string);
    };

    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('thumbnail', file);

    setIsUploading(true);
    onUploadBegin?.();

    try {
      // Assuming your server is running on the same host and port as the client's API base
      const response = await fetch('/api/uploads/pages/thumbnail', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      onChange(result.url); // Pass the uploaded file URL to react-hook-form
      onUploadEnd?.(result.url);
    } catch (error: any) {
      console.error('Upload error:', error);
      setPreview(null); // Clear preview on error
      onChange(undefined); // Clear form value on error
      onUploadEnd?.(undefined, error.message);
    } finally {
      setIsUploading(false);
    }
  }, [onChange, onUploadBegin, onUploadEnd]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering file selection
    setPreview(null);
    onChange(undefined);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition-colors',
        isDragActive && 'border-primary bg-primary/10',
        className
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : preview ? (
        <div className="relative w-full h-40 rounded-md overflow-hidden">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 bg-background rounded-full shadow-md hover:bg-accent"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Drag 'n' drop an image here, or click to select one</p>
        </div>
      )}
    </div>
  );
} 