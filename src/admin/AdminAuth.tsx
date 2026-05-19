import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;
const STORAGE_KEY = 'em_admin_auth';

export function isAdminAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function adminLogout(): void {
  localStorage.removeItem(STORAGE_KEY);
}

interface AdminAuthProps {
  onSuccess: () => void;
}

export default function AdminAuth({ onSuccess }: AdminAuthProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        localStorage.setItem(STORAGE_KEY, 'true');
        onSuccess();
      } else {
        setError('Mot de passe incorrect');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#fff500] mb-4">
            <Lock size={28} className="text-black" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">
            EDITION<span className="text-[#fff500] bg-white/10 px-1 ml-0.5">MADE</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-6">
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 block">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-white/10 border border-white/20 text-white px-4 py-3 pr-10 text-sm focus:outline-none focus:border-[#fff500] placeholder-gray-600"
                placeholder="••••••••"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-[#fff500] text-black font-bold py-3 text-sm uppercase tracking-wide hover:bg-[#e6dc00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Vérification...' : 'Accéder'}
          </button>
        </form>
      </div>
    </div>
  );
}
