import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from './ui/dialog';
import { Upload, Image as ImageIcon, Link, X, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const ImagePicker = ({ 
  value, 
  onChange, 
  label = "Image", 
  apiUrl,
  authToken,
  mediaLibrary = [],
  onMediaLibraryRefresh
}) => {
  const [showBrowser, setShowBrowser] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'upload'
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt_text', file.name);

    try {
      setUploading(true);
      const response = await fetch(`${apiUrl}/webmaster/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Use relative URL - it will be resolved by the browser
        onChange(data.url);
        toast.success('Image uploaded successfully');
        if (onMediaLibraryRefresh) onMediaLibraryRefresh();
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload error');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFromLibrary = (media) => {
    // Use relative URL - it will be resolved by the browser
    onChange(media.url);
    setShowBrowser(false);
    toast.success('Image selected');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Preview */}
      {value && (
        <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden mb-2">
          <img 
            src={value} 
            alt="Preview" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Options */}
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={inputMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('url')}
        >
          <Link className="w-3 h-3 mr-1" /> URL
        </Button>
        <Button
          type="button"
          variant={inputMode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('upload')}
        >
          <Upload className="w-3 h-3 mr-1" /> Upload
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowBrowser(true)}
        >
          <ImageIcon className="w-3 h-3 mr-1" /> Browse
        </Button>
      </div>

      {/* URL Input */}
      {inputMode === 'url' && (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      )}

      {/* Upload Input */}
      {inputMode === 'upload' && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </>
            )}
          </Button>
        </div>
      )}

      {/* Media Library Browser Dialog */}
      <Dialog open={showBrowser} onOpenChange={setShowBrowser}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select from Media Library</DialogTitle>
            <DialogDescription>Choose an image from your uploaded media</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
            {mediaLibrary.filter(m => m.type === 'image').map(media => {
              // Ensure URL has /api prefix for proper routing
              const imageUrl = media.url.startsWith('/api') ? media.url : 
                              media.url.startsWith('/uploads') ? `/api${media.url}` : media.url;
              return (
                <div
                  key={media.media_id}
                  className={`relative border-2 rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors ${
                    value === media.url || value === imageUrl ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                  }`}
                  onClick={() => {
                    // Save with correct /api prefix
                    onChange(imageUrl);
                    setShowBrowser(false);
                    toast.success('Image selected');
                  }}
                >
                  <img 
                    src={imageUrl} 
                    alt={media.alt_text || media.filename}
                    className="w-full h-24 object-cover"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="12">No preview</text></svg>'; }}
                  />
                  {(value === media.url || value === imageUrl) && (
                    <div className="absolute top-1 right-1 bg-primary text-white rounded-full p-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  <div className="p-1 text-xs truncate bg-white">{media.filename}</div>
                </div>
              );
            })}
            {mediaLibrary.filter(m => m.type === 'image').length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No images in media library. Upload some first!
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImagePicker;
