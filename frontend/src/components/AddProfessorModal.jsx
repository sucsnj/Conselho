import React, { useState } from 'react';
import { Crown, Sparkles, X, PlusCircle, AlertCircle } from 'lucide-react';
import { useCourt } from '../context/CourtContext';

export default function AddProfessorModal({ isOpen, onClose }) {
  const { addProfessor } = useCourt();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Informe o nome do mestre/professor!');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await addProfessor(name.trim(), subject.trim() || 'Disciplina da Corte');
      setName('');
      setSubject('');
      onClose();
    } catch (err) {
      setError(err.message || 'Erro ao consagrar mestre.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md p-6 rounded-2xl medieval-border bg-gradient-to-b from-royal-950 via-obsidian-900 to-obsidian-950 text-parchment-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-parchment-400 hover:text-gold-300 hover:bg-royal-900/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-royal-900 border border-gold-500 shadow-gold-glow mb-2">
            <Crown className="w-6 h-6 text-gold-400" />
          </div>
          <h3 className="font-medieval text-xl text-gold-400 font-bold medieval-title-glow">
            Conselho dos Mestres
          </h3>
          <p className="text-xs text-parchment-300 font-heading mt-1">
            Consagre um novo professor para as votações da Corte
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
              Nome do Professor
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Prof. Carlos, Profa. Mariana..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-850 border border-gold-600/40 text-sm text-parchment-100 placeholder-parchment-500/50 focus:outline-none focus:border-gold-400"
            />
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-gold-300 mb-1">
              Disciplina / Matéria (Opcional)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Banco de Dados, Algoritmos, Redes..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-obsidian-850 border border-gold-600/40 text-sm text-parchment-100 placeholder-parchment-500/50 focus:outline-none focus:border-gold-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-bold text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Consagrando...' : 'Adicionar ao Conselho'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
