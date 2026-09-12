import React, { useState } from 'react';
import { Lock, Crown, Key, X, AlertCircle } from 'lucide-react';
import { courtApi } from '../services/api';

export default function AdminModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Informe o PIN da Coroa!');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await courtApi.verifyAdminPin(pin.trim());
      localStorage.setItem('corte_admin_pin', pin.trim());
      onSuccess(pin.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'PIN inválido! Acesso negado pelo Guardião.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm p-6 rounded-2xl medieval-border bg-gradient-to-b from-royal-950 via-obsidian-900 to-obsidian-950 text-parchment-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-parchment-400 hover:text-gold-300 hover:bg-royal-900/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-royal-900 border border-gold-500 shadow-gold-glow mb-2">
            <Lock className="w-6 h-6 text-gold-400" />
          </div>
          <h3 className="font-medieval text-xl text-gold-400 font-bold medieval-title-glow">
            Cofre da Coroa
          </h3>
          <p className="text-xs text-parchment-300 font-heading mt-1">
            Área protegida para apuração e telão da festa
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-600/50 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-gold-300 mb-1">
              PIN Secreto da Corte
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Digite o PIN..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-850 border border-gold-600/40 text-sm text-parchment-100 placeholder-parchment-500/50 focus:outline-none focus:border-gold-400 tracking-widest text-center font-bold"
              />
              <Key className="w-4 h-4 text-gold-400 absolute right-3 top-3 pointer-events-none opacity-50" />
            </div>
            <p className="text-[11px] text-parchment-400 text-center mt-1.5 font-heading">
              (Somente com magia!... Na verdade ta no  <code className="text-gold-300 bg-obsidian-800 px-1 py-0.5 rounded">.env</code>)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Abrindo Cofre...' : 'Desbloquear Cofre'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
