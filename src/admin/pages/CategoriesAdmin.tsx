import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Loader2, CheckCircle2, Image as ImageIcon, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { deleteImage, uploadImage } from '../../lib/imageUtils';
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
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setErrorMessage('');
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Choisissez un fichier image.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('L’image ne doit pas dépasser 12 Mo.');
      return;
    }

    setUploading(true);
    try {
      const url = await uploadImage(file, 'category-images', `categorie-${category.slug}`);
      const { error } = await supabase.from('category_images').upsert(
        { category_id: category.id, category_name: category.name, image_url: url, updated_at: new Date().toISOString() },
        { onConflict: 'category_id' }
      );
      if (error) {
        await deleteImage(url, 'category-images');
        throw error;
      }

      onSave(category.id, url);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      if (imageUrl) void deleteImage(imageUrl, 'category-images');
    } catch (err) {
      console.error('Upload catégorie:', err);
      setErrorMessage('Envoi impossible. Vérifiez la configuration Supabase puis réessayez.');
    } finally {
      setUploading(false);
    }
  }, [category, imageUrl, onSave]);

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
    <div className={`bg-black/40 border overflow-hidden group/card transition-colors ${errorMessage ? 'border-red-500/50' : 'border-white/10 hover:border-white/25'}`}>

      {/* Zone image + drag-drop */}
      <div
        className={`relative aspect-[4/3] overflow-hidden cursor-pointer ${dragOver ? 'ring-2 ring-inset ring-[#fff500]' : ''}`}
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

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
          dragOver ? 'bg-[#fff500]/20' : 'bg-black/55 opacity-0 group-hover/card:opacity-100'
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
              <p className="text-white text-xs font-semibold">Déposez votre photo ici</p>
              <p className="text-gray-300 text-[10px]">ou cliquez pour parcourir</p>
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
      <div className="p-3">
        <p className="text-white text-sm font-bold truncate mb-2">{category.name}</p>
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          className="w-full min-h-10 flex items-center justify-center gap-2 border border-white/15 bg-white/5 text-gray-200 hover:border-[#fff500] hover:text-[#fff500] transition-colors disabled:opacity-40 text-xs font-bold"
        >
          {uploading
            ? <><Loader2 size={14} className="animate-spin text-[#fff500]" /> Envoi en cours…</>
            : <><Upload size={14} /> {hasCustomImage ? 'Remplacer la photo' : 'Ajouter une photo'}</>
          }
        </button>
        {errorMessage && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-red-400" role="alert">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" /> {errorMessage}
          </p>
        )}
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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    supabase.from('category_images').select('category_id, image_url').then(({ data, error }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(row => { if (row.image_url) map[row.category_id] = row.image_url; });
        setImages(map);
      }
      setLoadError(!!error);
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
          <h1 className="font-display font-bold text-2xl text-white">Images de « Nos univers »</h1>
          <p className="text-gray-500 text-sm mt-1">
            {customCount > 0
              ? `${customCount} / ${categories.length} catégorie${customCount > 1 ? 's' : ''} avec photo personnalisée`
              : 'Glissez une image sur une catégorie ou cliquez sur son bouton'
            }
          </p>
        </div>
        {customCount > 0 && (
          <span className="bg-[#fff500]/10 border border-[#fff500]/30 text-[#fff500] text-xs font-bold px-3 py-1.5">
            {customCount} personnalisée{customCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 bg-white/5 border border-white/10 px-4 py-3 mb-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p><strong className="text-white">Conseil :</strong> utilisez une photo horizontale, idéalement en 1200 × 900 px. Elle sera optimisée automatiquement.</p>
        <a href="/" target="_blank" rel="noreferrer" className="inline-flex flex-shrink-0 items-center gap-1.5 font-bold text-[#fff500] hover:underline">
          Voir « Nos univers » <ExternalLink size={13} />
        </a>
      </div>

      {loadError && (
        <div className="mb-6 flex items-start gap-2 border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <p>Le stockage des images de catégories n’est pas encore configuré. Appliquez les migrations Supabase puis rechargez cette page.</p>
        </div>
      )}

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
