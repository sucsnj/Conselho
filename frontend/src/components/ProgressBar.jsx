import React from 'react';
import { Scroll, Award } from 'lucide-react';
import { useCourt } from '../context/CourtContext';

export default function ProgressBar() {
  const { votedCount, totalQuestions, progressPercentage } = useCourt();

  return (
    <div className="w-full bg-obsidian-900/80 border border-gold-600/30 rounded-xl p-3.5 shadow-md">
      <div className="flex items-center justify-between text-xs font-heading text-gold-300 mb-2">
        <div className="flex items-center gap-1.5">
          <Scroll className="w-4 h-4 text-gold-400" />
          <span className="font-semibold uppercase tracking-wider">Decretos Selados pela Coroa</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gold-400 font-bold">{votedCount}</span>
          <span className="text-parchment-400">/</span>
          <span className="text-parchment-300">{totalQuestions}</span>
          <span className="text-xs text-gold-500 ml-1.5 font-bold">({progressPercentage}%)</span>
        </div>
      </div>

      {/* Barra de Progresso Real */}
      <div className="relative w-full h-3 bg-obsidian-950 rounded-full overflow-hidden border border-gold-600/40">
        <div
          className="h-full bg-gradient-to-r from-royal-700 via-gold-500 to-gold-400 rounded-full transition-all duration-500 shadow-gold-glow"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {progressPercentage === 100 && (
        <div className="mt-2 text-center text-xs text-gold-400 font-heading font-semibold flex items-center justify-center gap-1">
          <Award className="w-3.5 h-3.5" />
          <span>Glória! Todos os 48 decretos do Reino foram selados!</span>
        </div>
      )}
    </div>
  );
}
