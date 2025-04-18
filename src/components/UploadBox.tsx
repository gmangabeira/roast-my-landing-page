
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Upload, Link as LinkIcon, Image, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UploadBoxProps {
  onFileChange: (file: File | null) => void;
  onImageUploaded?: (url: string) => void;
  onUrlChange?: (url: string) => void;
}

const UploadBox: React.FC<UploadBoxProps> = ({ onFileChange, onImageUploaded, onUrlChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Only accept image files
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    setFile(file);
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
    
    // Upload to Supabase storage immediately
    if (onImageUploaded) {
      try {
        setIsUploading(true);
        
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id || 'anonymous'}/${timestamp}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('screenshots')
          .upload(filePath, file);
          
        if (error) throw error;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('screenshots')
          .getPublicUrl(filePath);
          
        console.log("Image uploaded to:", publicUrl);
        onImageUploaded(publicUrl);
        
        toast({
          title: "Image uploaded",
          description: "Your screenshot has been uploaded successfully",
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload image",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (onUrlChange) {
      onUrlChange(newUrl);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    onFileChange(null);
    setUrl('');
    if (onUrlChange) {
      onUrlChange('');
    }
  };

  return (
    <div className="w-full mt-6">
      <div className="flex gap-4 mb-4">
        <button
          className={`flex-1 py-2 border-b-2 font-medium text-sm transition-all ${
            uploadMode === 'file' 
              ? 'border-brand-green text-brand-green' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setUploadMode('file')}
        >
          <span className="flex items-center justify-center gap-2">
            <Image size={18} />
            Upload Screenshot
          </span>
        </button>
        <button
          className={`flex-1 py-2 border-b-2 font-medium text-sm transition-all ${
            uploadMode === 'url' 
              ? 'border-brand-green text-brand-green' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setUploadMode('url')}
        >
          <span className="flex items-center justify-center gap-2">
            <LinkIcon size={18} />
            Enter URL
          </span>
        </button>
      </div>

      {uploadMode === 'file' ? (
        <div className="w-full">
          {!preview ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                dragActive 
                  ? 'border-brand-green bg-brand-green/5' 
                  : 'border-gray-300 hover:border-brand-green/50 hover:bg-gray-50'
              } ${isUploading ? 'opacity-75 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Upload size={24} className="text-brand-green" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {isUploading 
                      ? "Uploading your screenshot..." 
                      : "Drag and drop your landing page screenshot here"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: PNG, JPG, JPEG (max 10MB)
                  </p>
                </div>
                <div className="relative">
                  <Input
                    type="file"
                    className="absolute inset-0 opacity-0 w-full cursor-pointer"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <div className={`px-4 py-2 text-sm font-medium text-brand-green bg-brand-green/10 rounded-md cursor-pointer hover:bg-brand-green/20 transition-colors ${isUploading ? 'opacity-50' : ''}`}>
                    Browse Files
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative border rounded-lg overflow-hidden">
              <img src={preview} alt="Preview" className="w-full object-contain max-h-[300px]" />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                disabled={isUploading}
              >
                <X size={16} className="text-gray-700" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm font-medium">Uploading...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Landing page URL
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon size={16} className="text-gray-400" />
            </div>
            <Input
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://yourdomain.com/landing-page"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            We'll automatically capture a screenshot of the page for analysis
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
