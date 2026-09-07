import React, { useState } from 'react';
import { Crown, Check, Sparkles, User, AlertCircle, PlusCircle } from 'lucide-react';
import { useCourt } from '../context/CourtContext';

export default function QuestionCard({ question, index, onOpenAddProf }) {
  const { participants, professors, myVotes, castVote, votingStatus } = useCourt();
  
  const currentVote = myVotes[question.id] || '';
  const status = votingStatus[question.id] || 'idle';
  const isVoted = Boolean(currentVote);
  const isProfessorQuestion = question.target_type === 'professor';

  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (name) => {
    if (!name || name === currentVote) return;
    castVote(question.id, name);
  };

  // Determinar as opções disponíveis
  const candidateOptions = isProfessorQuestion
    ? professors.map(p => ({ name: p.name, detail: p.subject }))
    : participants.map(p => ({ name: p.name, detail: p.title }));

  // Filtrar opções se o usuário pesquisar
  const filteredOptions = candidateOptions.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.detail && c.detail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 ${
        isVoted
          ? 'bg-gradient-to-b from-royal-950/70 via-obsidian-900 to-obsidian-900/90 border border-gold-500/50 shadow-gold-glow'
          : 'bg-obsidian-900/80 border border-gold-600/25 hover:border-gold-500/40 shadow-lg'
      }`}
    >
      {/* Selo Real no Canto Superior Direito se já votado */}
      {isVoted && (
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-royal-800/90 border border-gold-400 text-gold-300 text-[11px] font-heading font-bold shadow-md wax-seal-animate">
          <Crown className="w-3.5 h-3.5 text-gold-400" />
          <span>SELADO</span>
        </div>
      )}

      {/* Cabeçalho da Pergunta: Número e Subtítulo Real */}
      <div className="mb-3 pr-20">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded bg-royal-900 border border-gold-600/40 text-gold-400 text-xs font-heading font-extrabold">
            Decreto #{question.number}
          </span>
          <span className="text-[11px] font-heading font-semibold text-gold-300 tracking-wide uppercase px-2 py-0.5 rounded bg-obsidian-800 border border-gold-600/20">
            {question.subtitle}
          </span>
        </div>
        <h3 className="font-heading font-bold text-base sm:text-lg text-parchment-100 leading-snug">
          {question.title}
        </h3>
      </div>

      {/* Seção de Seleção de Voto */}
      <div className="mt-4 pt-3 border-t border-gold-600/20">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-heading text-gold-300/90 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gold-400" />
            <span>{isProfessorQuestion ? 'Mestre Escolhido:' : 'Combatente da Corte Escolhido:'}</span>
          </label>

          {isProfessorQuestion && onOpenAddProf && (
            <button
              onClick={onOpenAddProf}
              className="text-[11px] text-gold-400 hover:text-gold-300 flex items-center gap-1 font-heading"
            >
              <PlusCircle className="w-3 h-3" />
              <span>+ Outro Mestre</span>
            </button>
          )}
        </div>

        {/* Dropdown Principal */}
        {candidateOptions.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-obsidian-950/80 border border-dashed border-gold-600/40 text-xs text-parchment-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gold-500 shrink-0" />
            <span>
              {isProfessorQuestion
                ? 'Nenhum mestre cadastrado ainda. Clique em "+ Outro Mestre" acima para cadastrar!'
                : 'Aguardando combatentes fazerem check-in na festa para compor a lista de opções!'}
            </span>
          </div>
        ) : (
          <div className="relative">
            <select
              value={currentVote}
              onChange={(e) => handleSelect(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-obsidian-950 text-sm font-medium border transition-colors cursor-pointer appearance-none ${
                isVoted
                  ? 'border-gold-400 text-gold-200 focus:ring-1 focus:ring-gold-400'
                  : 'border-gold-600/40 text-parchment-200 focus:border-gold-400'
              }`}
            >
              <option value="" disabled className="text-parchment-500">
                {isVoted ? 'Alterar combatente escolhido...' : '✦ Selecione o combatente para este decreto...'}
              </option>
              {candidateOptions.map((opt, i) => (
                <option key={i} value={opt.name} className="bg-obsidian-900 text-parchment-100 py-1">
                  {opt.name} {opt.detail ? `— (${opt.detail})` : ''}
                </option>
              ))}
            </select>

            {/* Seta decorativa */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gold-400">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Feedback visual de Voto Selado */}
        {isVoted && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-gold-400 font-heading">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Voto registrado em: <strong className="text-gold-200">{currentVote}</strong></span>
            </div>
            {status === 'saving' && (
              <span className="text-[11px] text-parchment-400 animate-pulse">Gravando selo...</span>
            )}
            {status === 'saved' && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Selado!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
