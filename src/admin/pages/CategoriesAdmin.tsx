import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { uploadImage } from '../../lib/imageUtils';
import { categories } from '../../data/categories';
import { Category } from '../../types';

// ── Card (défini hors du composant parent pour éviter le re-mount) ─────────

type CardProps = {
  category: Category;
  imageUrl: string | null;
  onSave: (categoryId: string, url: string) => void;
};

const CategoryImageCard = ({ category, imageUrl, onSave }: CardProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'category-images', `categorie-${category.slug}`);
      await supabase.from('category_images').upsert(
        { category_id: category.id, category_name: category.name, image_url: url, updated_at: new Date().toISOString() },
        { onConflict: 'category_id' }
      );
      onSave(category.id, url);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('Upload catégorie:', err);
    }
    setUploading(false);
  }, [category, onSave]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const displayImage = imageUrl || category.image;
  const hasCustomImage = !!imageUrl;

  return (
    <div className="bg-black/40 border border-white/10 overflow-hidden group/card">

      {/* Zone image + drag-drop */}
      <div
        className={`relative aspect-[4/3] overflow-hidden cursor-pointer ${dragOver ? 'ring-2 ring-[#fff500]' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <ImageIcon size={32} className="text-gray-700" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Hover overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
          dragOver ? 'bg-[#fff500]/20' : 'bg-black/50 opacity-0 group-hover/card:opacity-100'
        }`}>
          {uploading ? (
            <>
              <Loader2 size={24} className="text-[#fff500] animate-spin" />
              <p className="text-[#fff500] text-xs font-bold">Conversion WebP…</p>
            </>
          ) : dragOver ? (
            <>
              <Upload size={24} className="text-[#fff500]" />
              <p className="text-[#fff500] text-xs font-bold">Déposer ici</p>
            </>
          ) : (
            <>
              <RefreshCw size={20} className="text-white" />
              <p className="text-white text-xs font-semibold">Glisser ou cliquer</p>
              <p className="text-gray-400 text-[10px]">Auto WebP · Nom SEO</p>
            </>
          )}
        </div>

        {/* Badges */}
        {dragOver && (
          <div className="absolute inset-0 border-2 border-dashed border-[#fff500] pointer-events-none" />
        )}
        {hasCustomImage && !uploading && !dragOver && (
          <div className="absolute top-2 right-2 bg-[#fff500] text-black text-[9px] font-black px-1.5 py-0.5 uppercase">
            Personnalisée
          </div>
        )}
        {justSaved && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1">
            <CheckCircle2 size={11} /> Sauvegardée
          </div>
        )}
      </div>

      {/* Infos catégorie */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-white text-xs font-bold truncate">{category.name}</p>
          <p className="text-gray-600 text-[10px] font-mono">{category.slug}</p>
        </div>
        <button
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          title="Changer la photo"
          className="ml-2 p-1.5 text-gray-500 hover:text-[#fff500] hover:bg-white/10 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          {uploading
            ? <Loader2 size={13} className="animate-spin text-[#fff500]" />
            : <Upload size={13} />
          }
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
};

// ── Page principale ────────────────────────────────────────────────────────

export default function CategoriesAdmin() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('category_images').select('category_id, image_url').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(row => { if (row.image_url) map[row.category_id] = row.image_url; });
        setImages(map);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback((categoryId: string, url: string) => {
    setImages(prev => ({ ...prev, [categoryId]: url }));
  }, []);

  const customCount = Object.keys(images).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Photos des catégories</h1>
          <p className="text-gray-500 text-sm mt-1">
            {customCount > 0
              ? `${customCount} / ${categories.length} catégorie${customCount > 1 ? 's' : ''} avec photo personnalisée`
              : 'Glissez-déposez une photo sur chaque catégorie pour la personnaliser'
            }
          </p>
        </div>
        {customCount > 0 && (
          <span className="bg-[#fff500]/10 border border-[#fff500]/30 text-[#fff500] text-xs font-bold px-3 py-1.5">
            {customCount} personnalisée{customCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Info bucket */}
      <div className="bg-white/5 border border-white/10 px-4 py-3 mb-6 text-xs text-gray-400 leading-relaxed">
        <strong className="text-white">Bucket Supabase requis :</strong> Crée un bucket public nommé <code className="bg-white/10 px-1 text-[#fff500]">category-images</code> dans Storage → New bucket → <em>Public bucket</em> activé.
        Les images sont converties en <strong className="text-white">WebP</strong> et renommées automatiquement (<code className="bg-white/10 px-1">categorie-[slug]-[nom]-[timestamp].webp</code>).
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map(cat => (
            <CategoryImageCard
              key={cat.id}
              category={cat}
              imageUrl={images[cat.id] ?? null}
              onSave={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
