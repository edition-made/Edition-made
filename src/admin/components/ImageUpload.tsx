import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, GripVertical } from 'lucide-react';
import { uploadImage, deleteImage } from '../../lib/imageUtils';

interface ImageUploadProps {
  bucket: 'product-images' | 'blog-images' | 'category-images';
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

  // Image drag-and-drop reorder state
  const [dragImgIdx, setDragImgIdx] = useState<number | null>(null);
  const [dragOverImgIdx, setDragOverImgIdx] = useState<number | null>(null);

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

  // ── Image reorder handlers ──────────────────────────────────
  const handleImgDragStart = (e: React.DragEvent, idx: number) => {
    e.stopPropagation();
    setDragImgIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImgDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverImgIdx !== idx) setDragOverImgIdx(idx);
  };

  const handleImgDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragImgIdx === null || dragImgIdx === idx) {
      setDragImgIdx(null);
      setDragOverImgIdx(null);
      return;
    }
    const reordered = [...value];
    const [moved] = reordered.splice(dragImgIdx, 1);
    reordered.splice(idx, 0, moved);
    onChange(reordered);
    setDragImgIdx(null);
    setDragOverImgIdx(null);
  };

  const handleImgDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDragImgIdx(null);
    setDragOverImgIdx(null);
  };
  // ────────────────────────────────────────────────────────────

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
        <>
          {value.length > 1 && (
            <p className="text-[10px] text-gray-600 mt-2 mb-1 flex items-center gap-1">
              <GripVertical size={10} /> Glisser pour réorganiser · La 1ʳᵉ image est la photo principale
            </p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
            {value.map((url, i) => {
              const isDragging = dragImgIdx === i;
              const isDragOver = dragOverImgIdx === i && dragImgIdx !== i;
              return (
                <div
                  key={url}
                  draggable
                  onDragStart={e => handleImgDragStart(e, i)}
                  onDragOver={e => handleImgDragOver(e, i)}
                  onDrop={e => handleImgDrop(e, i)}
                  onDragEnd={handleImgDragEnd}
                  className={`relative group aspect-square bg-gray-800 overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                    isDragging ? 'opacity-40 scale-95' : isDragOver ? 'ring-2 ring-[#fff500]' : ''
                  }`}
                >
                  <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                  {i === 0 && (
                    <div className="absolute top-1 left-1 bg-[#fff500] text-black text-[9px] font-black px-1.5 py-0.5">
                      Principale
                    </div>
                  )}
                  {/* Drag handle overlay */}
                  <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical size={14} className="text-white drop-shadow" />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(url)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
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
