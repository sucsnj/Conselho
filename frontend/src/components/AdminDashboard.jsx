import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Users, Scroll, Play, RefreshCw, AlertTriangle, ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import { courtApi } from '../services/api';
import CeremonyMode from './CeremonyMode';

export default function AdminDashboard({ pin, onClose }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState(1);
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const fetchResults = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await courtApi.getAdminResults(pin);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Erro ao consultar apuração.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [pin]);

  const handleResetVotes = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Tem certeza que deseja expurgar TODOS os votos já realizados?')) {
      return;
    }
    try {
      await courtApi.resetVotes(pin);
      setActionMessage('Todos os votos foram zerados com sucesso!');
      await fetchResults();
    } catch (err) {
      alert(err.message || 'Erro ao resetar votos.');
    }
  };

  const handleResetAll = async () => {
    if (!window.confirm('🚨 PERIGO: Deseja apagar TODOS os participantes e TODOS os votos para recomeçar do zero?')) {
      return;
    }
    try {
      await courtApi.resetAll(pin);
      setActionMessage('Toda a Corte foi reiniciada!');
      await fetchResults();
    } catch (err) {
      alert(err.message || 'Erro ao reiniciar tudo.');
    }
  };

  if (isCeremonyOpen && results) {
    return (
      <CeremonyMode
        results={results}
        onClose={() => setIsCeremonyOpen(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-obsidian-950 text-parchment-100 overflow-y-auto p-4 sm:p-8">
      <div className="max-w-6xl mx-auto pb-12">
        {/* Barra de Navegação do Painel */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-gold-600/30">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-obsidian-900 border border-gold-600/30 text-parchment-300 hover:text-gold-300 hover:border-gold-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-medieval text-2xl sm:text-3xl text-gold-400 font-bold medieval-title-glow">
                Cofre da Coroa & Apuração
              </h1>
              <p className="text-xs text-parchment-400 font-heading">
                Painel do Mestre de Cerimônias e Resultados da Turma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchResults}
              title="Recarregar apuração"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-900 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-200 hover:border-gold-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => setIsCeremonyOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-obsidian-950" />
              <span>Modo Telão / Cerimônia</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-emerald-400 font-bold ml-2">✕</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full mb-3"></div>
            <p className="font-heading text-sm text-parchment-300">Consultando os pergaminhos da Corte...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-600/50 text-xs text-red-200 text-center">
            {error}
          </div>
        ) : results ? (
          <>
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <div className="p-4 rounded-xl medieval-border bg-royal-950/70">
                <div className="flex items-center gap-2 text-gold-400 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-heading uppercase tracking-wider">Combatentes Alistados</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-parchment-100">
                  {results.summary.totalParticipants}
                </div>
              </div>

              <div className="p-4 rounded-xl medieval-border bg-royal-950/70">
                <div className="flex items-center gap-2 text-gold-400 mb-1">
                  <Scroll className="w-4 h-4" />
                  <span className="text-xs font-heading uppercase tracking-wider">Total de Votos Selados</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-parchment-100">
                  {results.summary.totalVotesCast}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 p-4 rounded-xl medieval-border bg-royal-950/70">
                <div className="flex items-center gap-2 text-gold-400 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-heading uppercase tracking-wider">Decretos Realizados</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-heading text-parchment-100">
                  {results.summary.totalQuestions}
                </div>
              </div>
            </div>

            {/* Abas de Categorias */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin">
              {results.resultsByCategory.map((catItem) => (
                <button
                  key={catItem.category.id}
                  onClick={() => setActiveCategoryTab(catItem.category.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                    activeCategoryTab === catItem.category.id
                      ? 'bg-royal-900 border border-gold-400 text-gold-300 shadow-gold-glow'
                      : 'bg-obsidian-900 border border-gold-600/30 text-parchment-400 hover:text-parchment-200'
                  }`}
                >
                  <span>{catItem.category.emoji}</span>
                  <span>{catItem.category.name}</span>
                </button>
              ))}
            </div>

            {/* Lista de Perguntas e Vencedores da Categoria Ativa */}
            {results.resultsByCategory
              .filter(c => c.category.id === activeCategoryTab)
              .map((catItem) => (
                <div key={catItem.category.id} className="space-y-4">
                  {catItem.questions.map(({ question, total_votes, ranking, winners }) => {
                    const topWinner = winners && winners.length > 0 ? winners[0] : null;

                    return (
                      <div
                        key={question.id}
                        className="p-5 rounded-2xl bg-obsidian-900/90 border border-gold-600/30 shadow-md"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded bg-royal-950 border border-gold-600/40 text-gold-400 text-xs font-heading font-bold">
                                #{question.number}
                              </span>
                              <span className="text-xs font-heading font-semibold text-gold-300 uppercase">
                                {question.subtitle}
                              </span>
                            </div>
                            <h3 className="font-heading font-bold text-sm sm:text-base text-parchment-100">
                              {question.title}
                            </h3>
                          </div>
                          <span className="text-xs text-parchment-400 font-heading">
                            {total_votes} votos
                          </span>
                        </div>

                        {/* Pódio / Ranking da Pergunta */}
                        {ranking.length === 0 ? (
                          <div className="text-xs text-parchment-500 italic py-2">
                            Nenhum voto selado ainda para este decreto.
                          </div>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {ranking.map((candidate, idx) => {
                              const isFirst = idx === 0;
                              return (
                                <div
                                  key={idx}
                                  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs ${
                                    isFirst
                                      ? 'bg-royal-950/80 border border-gold-500/50 text-gold-300'
                                      : 'bg-obsidian-950/60 border border-gold-600/15 text-parchment-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                      isFirst ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow' : 'bg-obsidian-800 text-parchment-400'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className="font-heading font-bold text-sm">
                                      {candidate.name}
                                    </span>
                                    {isFirst && <Crown className="w-3.5 h-3.5 text-gold-400" />}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="w-24 sm:w-36 h-2 bg-obsidian-900 rounded-full overflow-hidden border border-gold-600/20 hidden sm:block">
                                      <div
                                        className={`h-full rounded-full ${isFirst ? 'bg-gold-400 shadow-gold-glow' : 'bg-royal-600'}`}
                                        style={{ width: `${candidate.percentage}%` }}
                                      />
                                    </div>
                                    <span className="font-heading font-semibold text-parchment-300 min-w-[50px] text-right">
                                      {candidate.votes} ({candidate.percentage}%)
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

            {/* Zona de Perigo / Reinicialização */}
            <div className="mt-12 p-6 rounded-2xl border border-red-800/40 bg-red-950/20 text-parchment-300">
              <div className="flex items-center gap-2 text-red-400 font-heading font-bold text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Zona dos Guardiões (Ações Irreversíveis)</span>
              </div>
              <p className="text-xs text-parchment-400 mb-4">
                Use estas opções para testes ou para limpar os votos ao dar início oficial à festa.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleResetVotes}
                  className="px-3.5 py-2 rounded-xl bg-red-900/60 border border-red-600/50 text-red-200 hover:bg-red-800 text-xs font-heading font-semibold transition-colors"
                >
                  Expurgar Todos os Votos
                </button>
                <button
                  onClick={handleResetAll}
                  className="px-3.5 py-2 rounded-xl bg-red-950 border border-red-700 text-red-300 hover:bg-red-900 text-xs font-heading font-semibold transition-colors"
                >
                  Reiniciar Tudo (Participantes + Votos)
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
