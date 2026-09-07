import React, { useState } from 'react';
import { Crown, Sparkles, ChevronLeft, ChevronRight, AlertCircle, Users } from 'lucide-react';
import { useCourt } from '../context/CourtContext';
import ProgressBar from '../components/ProgressBar';
import CategoryTabs from '../components/CategoryTabs';
import QuestionCard from '../components/QuestionCard';
import AddProfessorModal from '../components/AddProfessorModal';

export default function VotingArena({ onOpenCheckIn }) {
  const {
    currentParticipant,
    participants,
    questions,
    categories,
    activeCategory,
    setActiveCategory,
    toastMessage
  } = useCourt();

  const [isAddProfOpen, setIsAddProfOpen] = useState(false);

  // Perguntas da categoria ativa
  const activeQuestions = questions.filter(q => q.category_id === activeCategory);
  const currentCategoryObj = categories.find(c => c.id === activeCategory);

  const handleNextCategory = () => {
    if (activeCategory < categories.length) {
      setActiveCategory(activeCategory + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  const handlePrevCategory = () => {
    if (activeCategory > 1) {
      setActiveCategory(activeCategory - 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Toast Notificação Flutuante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-xl border shadow-xl text-xs font-heading font-bold flex items-center gap-2 ${
            toastMessage.type === 'error'
              ? 'bg-red-950 border-red-500 text-red-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950 border-amber-500 text-amber-200'
              : 'bg-royal-900 border-gold-400 text-gold-300 shadow-gold-glow'
          }`}>
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Banner Principal / Boas-vindas Medieval */}
      <section className="text-center pt-2 pb-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-950 border border-gold-500/40 text-gold-400 text-xs font-heading uppercase tracking-widest shadow-gold-glow mb-2">
          <Crown className="w-3.5 h-3.5" />
          <span>Grande Conselho da Turma de ADS</span>
        </div>
        
        <h1 className="font-medieval text-3xl sm:text-4xl md:text-5xl font-extrabold text-gold-400 medieval-title-glow tracking-wider">
          A Corte dos Formandos
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-parchment-300 font-heading max-w-xl mx-auto">
          {currentParticipant ? (
            <>
              Saudações, <strong className="text-gold-300 font-bold">{currentParticipant.name}</strong>,{' '}
              <span className="italic text-parchment-400">"{currentParticipant.title}"</span>! Sele os seus votos para os decretos do Reino.
            </>
          ) : (
            'Seja bem-vindo à festa de encerramento! Aliste-se na tenda para colocar seu nome nas disputas e votar.'
          )}
        </p>

        {/* Alerta caso o usuário ainda não tenha feito check-in */}
        {!currentParticipant && (
          <div className="mt-4 max-w-md mx-auto p-3.5 rounded-xl bg-royal-900/80 border border-gold-400 text-xs text-parchment-200 shadow-gold-glow flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-gold-400 shrink-0" />
              <span>Você ainda não fez check-in na festa!</span>
            </div>
            <button
              onClick={onOpenCheckIn}
              className="px-3 py-1.5 rounded-lg bg-gold-500 text-obsidian-950 font-heading font-bold text-xs uppercase hover:bg-gold-400 transition-colors whitespace-nowrap shadow-md"
            >
              Alistar-se Agora
            </button>
          </div>
        )}
      </section>

      {/* Barra de Progresso Geral */}
      <ProgressBar />

      {/* Navegação de Abas de Categorias */}
      <div className="space-y-2">
        <CategoryTabs />
        {currentCategoryObj && (
          <div className="flex items-center justify-between text-xs px-2 pt-1 text-parchment-400 font-heading">
            <span className="text-gold-300 font-semibold">{currentCategoryObj.name}</span>
            <span>{currentCategoryObj.description}</span>
          </div>
        )}
      </div>

      {/* Lista de Perguntas da Categoria Atual */}
      <section className="space-y-4 pt-1">
        {activeQuestions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            onOpenAddProf={() => setIsAddProfOpen(true)}
          />
        ))}
      </section>

      {/* Controles de Navegação Entre Categorias */}
      <div className="flex items-center justify-between pt-4 pb-8 border-t border-gold-600/30">
        <button
          onClick={handlePrevCategory}
          disabled={activeCategory === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-obsidian-900 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-300 hover:border-gold-400 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Categoria Anterior</span>
        </button>

        <button
          onClick={handleNextCategory}
          disabled={activeCategory === categories.length}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-royal-900 border border-gold-500 text-xs font-heading font-bold text-gold-300 hover:bg-royal-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-gold-glow"
        >
          <span>Próxima Categoria</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal de Adicionar Professor se chamado */}
      <AddProfessorModal
        isOpen={isAddProfOpen}
        onClose={() => setIsAddProfOpen(false)}
      />
    </main>
  );
}
