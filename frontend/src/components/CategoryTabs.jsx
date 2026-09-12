import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useCourt } from '../context/CourtContext';

export default function CategoryTabs() {
  const { categories, questions, activeCategory, setActiveCategory, myVotes } = useCourt();

  // Calcular progresso para cada categoria
  const getCategoryStats = (catId) => {
    const catQuestions = questions.filter(q => q.category_id === catId);
    const catTotal = catQuestions.length;
    const catVoted = catQuestions.filter(q => myVotes[q.id]).length;
    const isCompleted = catTotal > 0 && catVoted === catTotal;

    return { catTotal, catVoted, isCompleted };
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => {
          const { catTotal, catVoted, isCompleted } = getCategoryStats(cat.id);
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left border transition-all duration-200 ${
                isActive
                  ? 'bg-royal-900 border-gold-400 text-gold-300 shadow-gold-glow scale-[1.02]'
                  : 'bg-obsidian-900/90 border-gold-600/30 text-parchment-300 hover:border-gold-500/60 hover:bg-obsidian-850'
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <div>
                <div className="font-heading text-xs font-bold tracking-wide truncate max-w-[250px] sm:max-w-[280px]">
                  {cat.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-parchment-400">
                  <span>{catVoted}/{catTotal} votos</span>
                  {isCompleted && (
                    <span className="inline-flex items-center text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3 h-3 ml-0.5" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
