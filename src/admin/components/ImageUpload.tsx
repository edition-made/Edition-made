import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImage, deleteImage } from '../../lib/imageUtils';

interface ImageUploadProps {
  bucket: 'product-images' | 'blog-images';
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  prefix?: string;
  label?: string;
}

export default function ImageUpload({
  bucket,
  value,
  onChange,
  maxFiles = 10,
  prefix = '',
  label = 'Images',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!fileArray.length) return;

    const remaining = maxFiles - value.length;
    const toUpload = fileArray.slice(0, remaining);
    if (!toUpload.length) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      setProgress(`Conversion & upload ${i + 1}/${toUpload.length}...`);
      try {
        const url = await uploadImage(file, bucket, prefix);
        newUrls.push(url);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    onChange([...value, ...newUrls]);
    setUploading(false);
    setProgress('');
  }, [bucket, prefix, value, onChange, maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleRemove = async (url: string) => {
    try { await deleteImage(url, bucket); } catch (_) {}
    onChange(value.filter(u => u !== url));
  };

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">{label}</label>

      {value.length < maxFiles && (
        <div
          className={`border-2 border-dashed rounded-none p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-[#fff500] bg-[#fff500]/5' : 'border-white/20 hover:border-white/40'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-[#fff500] animate-spin" />
              <p className="text-xs text-gray-400">{progress}</p>
              <p className="text-[10px] text-gray-500">Conversion en WebP + upload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-gray-500" />
              <p className="text-xs text-gray-300 font-medium">Glisser-déposer ou cliquer</p>
              <p className="text-[10px] text-gray-500">JPG, PNG, WEBP, GIF — Conversion auto en WebP optimisé</p>
              <p className="text-[10px] text-gray-600">{value.length}/{maxFiles} image{maxFiles > 1 ? 's' : ''}</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={maxFiles > 1}
            className="hidden"
            onChange={e => e.target.files && processFiles(e.target.files)}
          />
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
          {value.map((url, i) => (
            <div key={url} className="relative group aspect-square bg-gray-800 overflow-hidden">
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <div className="absolute top-1 left-1 bg-[#fff500] text-black text-[9px] font-black px-1.5 py-0.5">
                  Principale
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !uploading && (
        <div className="mt-2 flex items-center gap-2 text-gray-600 text-xs">
          <ImageIcon size={14} />
          <span>Aucune image</span>
        </div>
      )}
    </div>
  );
}
