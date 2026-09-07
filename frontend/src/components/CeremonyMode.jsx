import React, { useState, useEffect } from 'react';
import { Crown, Trophy, ChevronLeft, ChevronRight, X, Sparkles, Award, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CeremonyMode({ results, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Flatten all questions with results
  const allQuestionResults = results?.resultsByCategory?.flatMap(cat => cat.questions) || [];
  const currentItem = allQuestionResults[currentIndex];

  const handleNext = () => {
    if (currentIndex < allQuestionResults.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsRevealed(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsRevealed(false);
    }
  };

  // Suporte a teclas de seta (esquerda e direita)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allQuestionResults.length]);

  // Efeito de revelação dramática e confetes
  const triggerReveal = () => {
    setIsRevealed(true);
    // Chuva de confetes dourados e reais
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FACC15', '#EAB308', '#B8265B', '#FFFFFF']
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FACC15', '#CA8A04', '#6B1232']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FACC15', '#CA8A04', '#6B1232']
      });
    }, 250);
  };

  if (!currentItem) {
    return (
      <div className="fixed inset-0 z-50 bg-obsidian-950 flex items-center justify-center text-parchment-200">
        <p>Nenhum decreto apurado ainda.</p>
        <button onClick={onClose} className="ml-4 px-3 py-1 bg-royal-800 rounded">Voltar</button>
      </div>
    );
  }

  const { question, total_votes, ranking, winners } = currentItem;
  const winner = winners && winners.length > 0 ? winners[0] : null;

  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950 text-parchment-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden">
      {/* Barra Superior */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-royal-900 border border-gold-500/50 text-gold-300 text-xs font-heading font-bold">
            <Crown className="w-4 h-4 text-gold-400" />
            <span>MODO CERIMÔNIA DA CORTE</span>
          </div>
          <span className="text-xs text-parchment-400 font-heading">
            Decreto {currentIndex + 1} de {allQuestionResults.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-900 border border-gold-600/30 text-xs text-parchment-300 hover:text-gold-300 hover:border-gold-400 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Sair do Telão (ESC)</span>
        </button>
      </div>

      {/* Conteúdo Principal do Telão */}
      <div className="max-w-4xl mx-auto w-full text-center my-auto px-4">
        {/* Subtítulo Medieval */}
        <div className="inline-block px-4 py-1.5 rounded-full bg-royal-950 border border-gold-500/60 text-gold-300 font-heading text-sm sm:text-base font-bold uppercase tracking-widest shadow-gold-glow mb-4">
          {question.subtitle}
        </div>

        {/* Pergunta */}
        <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-extrabold text-parchment-100 leading-tight mb-8">
          "{question.title}"
        </h1>

        {/* Caixa de Revelação do Escolhido */}
        <div className="relative max-w-xl mx-auto min-h-[220px] flex items-center justify-center">
          {!isRevealed ? (
            <button
              onClick={triggerReveal}
              className="group px-8 py-5 rounded-2xl bg-gradient-to-r from-royal-900 via-royal-800 to-royal-900 border-2 border-gold-400 text-gold-300 font-heading font-extrabold text-lg sm:text-xl uppercase tracking-wider shadow-gold-glow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 mx-auto"
            >
              <Sparkles className="w-6 h-6 text-gold-400 group-hover:rotate-45 transition-transform" />
              <span>Revelar Escolhido da Corte</span>
              <Sparkles className="w-6 h-6 text-gold-400 group-hover:-rotate-45 transition-transform" />
            </button>
          ) : (
            <div className="w-full p-8 rounded-3xl medieval-border bg-gradient-to-b from-royal-950/95 via-royal-900/90 to-obsidian-950 border-2 border-gold-400 shadow-gold-glow-lg wax-seal-animate">
              {winner ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-gold-400 mb-2">
                    <Trophy className="w-8 h-8 text-gold-400 animate-bounce" />
                  </div>
                  <div className="text-xs uppercase tracking-widest text-parchment-300 font-heading">
                    O Reino elegeu soberanamente:
                  </div>
                  <h2 className="font-medieval text-3xl sm:text-5xl font-black text-gold-300 medieval-title-glow mt-1 mb-2">
                    {winner.name}
                  </h2>
                  <div className="flex items-center justify-center gap-3 text-sm text-parchment-200 font-heading font-semibold">
                    <span className="px-3 py-1 rounded bg-royal-800 border border-gold-600/30 text-gold-300">
                      {winner.votes} votos ({winner.percentage}%)
                    </span>
                    <span className="text-parchment-400">|</span>
                    <span className="text-parchment-400">{total_votes} votos apurados</span>
                  </div>

                  {/* Pódio dos outros colocados */}
                  {ranking && ranking.length > 1 && (
                    <div className="mt-6 pt-4 border-t border-gold-600/30 flex items-center justify-center gap-4 text-xs font-heading">
                      {ranking.slice(1, 4).map((r, i) => (
                        <div key={i} className="px-3 py-1.5 rounded-lg bg-obsidian-900/80 border border-gold-600/20 text-parchment-300">
                          <span className="text-gold-400 font-bold mr-1">#{i + 2}</span>
                          <span className="font-semibold">{r.name}</span>
                          <span className="text-parchment-400 ml-1.5">({r.votes}v)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-parchment-400 font-heading">
                  Nenhum voto foi registrado para este decreto.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Controles Inferiores de Navegação */}
      <div className="flex items-center justify-between max-w-4xl mx-auto w-full pt-4 border-t border-gold-600/20">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-obsidian-900 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-200 hover:border-gold-400 disabled:opacity-40 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior (←)</span>
        </button>

        <div className="text-xs text-parchment-400 font-heading">
          Use as setas do teclado para navegar no projetor
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === allQuestionResults.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-royal-900 border border-gold-500 text-xs font-heading font-bold text-gold-300 hover:bg-royal-800 disabled:opacity-40 transition-all shadow-gold-glow"
        >
          <span>Próximo Decreto (→)</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
