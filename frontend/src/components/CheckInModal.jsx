import React, { useState, useEffect } from 'react';
import { Scroll, Swords, Crown, Sparkles, Dices, Shield, X, AlertCircle } from 'lucide-react';
import { useCourt } from '../context/CourtContext';
import { courtApi } from '../services/api';

const DEFAULT_TITLES = [
  'O Cavaleiro das 23h59',
  'A Feiticeira do CSS',
  'O Mago Supremo do Backend',
  'O Arauto do Commit Forçado',
  'O Paladino do StackOverflow',
  'A Arquimaga do Banco de Dados',
  'O Caçador de Red Flags',
  'O Bobo Oficial da Corte',
  'O Destruidor de Ambientes',
  'O Menestrel do PowerPoint',
  'A Guardiã dos Pull Requests',
  'O Alquimista de Bugs',
  'O Lorde do Na Minha Máquina Funciona'
];

export default function CheckInModal({ isOpen, onClose, canClose = true }) {
  const { checkIn, currentParticipant } = useCourt();
  const [name, setName] = useState('');
  const [selectedTitle, setSelectedTitle] = useState(DEFAULT_TITLES[0]);
  const [customTitle, setCustomTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [availableTitles, setAvailableTitles] = useState(DEFAULT_TITLES);

  // Buscar títulos extras do backend se disponíveis
  useEffect(() => {
    courtApi.getTitles().then(res => {
      if (res?.titles && res.titles.length > 0) {
        setAvailableTitles(res.titles);
      }
    }).catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleRollDice = () => {
    const random = availableTitles[Math.floor(Math.random() * availableTitles.length)];
    setSelectedTitle(random);
    setCustomTitle('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome ou apelido para alistar-se!');
      return;
    }

    const finalTitle = customTitle.trim() || selectedTitle;

    setIsSubmitting(true);
    try {
      await checkIn(name.trim(), finalTitle);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Falha ao registrar seu nome no Tomo Real.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 p-6 sm:p-8 rounded-2xl medieval-border bg-gradient-to-b from-royal-950/95 via-obsidian-900 to-obsidian-950 text-parchment-100 shadow-2xl border-gold-500/40">
        
        {/* Botão Fechar se permitido */}
        {canClose && currentParticipant && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-parchment-400 hover:text-gold-300 hover:bg-royal-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Cabeçalho da Tenda de Alistamento */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-royal-900 border-2 border-gold-500 shadow-gold-glow mb-3">
            <Swords className="w-8 h-8 text-gold-400" />
          </div>
          <h2 className="font-medieval text-2xl sm:text-3xl text-gold-400 font-bold medieval-title-glow tracking-wider">
            Tenda de Alistamento
          </h2>
          <p className="text-sm text-parchment-300 font-heading mt-1">
            Entre na Corte Real para votar e ser votado pelos seus pares!
          </p>
        </div>

        {/* Aviso de Regra de Ouro */}
        <div className="mb-6 p-3 rounded-lg bg-royal-900/60 border border-gold-600/30 text-xs text-parchment-200 flex items-start gap-2.5">
          <Crown className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-gold-300 font-semibold block mb-0.5">Regra Sagrada da Corte:</strong>
            Ao alistar-se, seu nome aparecerá instantaneamente como opção de voto em todos os decretos para todos os colegas da festa!
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-600/50 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome do Combatente */}
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-gold-300 mb-1.5">
              Como és chamado neste Reino? (Seu Nome / Apelido)
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cris, Rogens, Edvan..."
              className="w-full px-4 py-3 rounded-lg bg-obsidian-850 border border-gold-600/40 text-parchment-100 placeholder-parchment-500/50 focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 text-sm font-medium"
            />
          </div>

          {/* Escolha do Título de Nobreza / Combatente */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-heading uppercase tracking-wider text-gold-300">
                Título de Nobreza da Corte
              </label>
              <button
                type="button"
                onClick={handleRollDice}
                className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 hover:underline font-heading"
              >
                <Dices className="w-3.5 h-3.5" />
                <span>Sortear Título</span>
              </button>
            </div>

            <select
              value={selectedTitle}
              onChange={(e) => {
                setSelectedTitle(e.target.value);
                setCustomTitle('');
              }}
              className="w-full px-4 py-2.5 rounded-lg bg-obsidian-850 border border-gold-600/40 text-parchment-100 focus:outline-none focus:border-gold-400 text-sm"
            >
              {availableTitles.map((t, idx) => (
                <option key={idx} value={t} className="bg-obsidian-900 text-parchment-200">
                  {t}
                </option>
              ))}
            </select>

            {/* Ou Título Personalizado */}
            <div className="mt-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Ou digite seu próprio título medieval..."
                className="w-full px-3 py-2 rounded-lg bg-obsidian-850/60 border border-gold-600/20 text-xs text-parchment-300 placeholder-parchment-500/40 focus:outline-none focus:border-gold-400"
              />
            </div>
          </div>

          {/* Botão de Confirmação de Alistamento */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 text-obsidian-950 font-heading font-extrabold text-sm uppercase tracking-wider shadow-gold-glow hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Selando teu nome nos anais...</span>
            ) : (
              <>
                <Shield className="w-4 h-4 text-obsidian-950" />
                <span>Juramentar e Entrar na Corte</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
