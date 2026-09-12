import React, { useState, useEffect } from 'react';
import {
  Crown, Trophy, Users, Scroll, Play, RefreshCw, AlertTriangle,
  ArrowLeft, Shield, CheckCircle2, Edit2, Trash2, Search,
  GraduationCap, X, Check, Swords, ShieldAlert, Plus, BookOpen, Sparkles
} from 'lucide-react';
import { courtApi } from '../services/api';
import { useCourt } from '../context/CourtContext';
import CeremonyMode from './CeremonyMode';
import AddProfessorModal from './AddProfessorModal';

export default function AdminDashboard({ pin, onClose }) {
  const { refreshParticipants, refreshProfessors, refreshQuestions } = useCourt();

  // Visualização ativa: 'results' (apuração) ou 'management' (gestão de combatentes/mestres/decretos)
  const [viewMode, setViewMode] = useState('results');
  
  // Apuração e Resultados
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState(1);
  const [isCeremonyOpen, setIsCeremonyOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Listas de Gestão
  const [participantsList, setParticipantsList] = useState([]);
  const [professorsList, setProfessorsList] = useState([]);
  const [questionsList, setQuestionsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  
  // Sub-abas de Gestão: 'combatentes' | 'mestres' | 'decretos'
  const [managementTab, setManagementTab] = useState('combatentes');
  const [selectedDecreeCategory, setSelectedDecreeCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddProfOpen, setIsAddProfOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Modais de Ação
  const [editingItem, setEditingItem] = useState(null); // { type, id, name, title, subject }
  const [expungingItem, setExpungingItem] = useState(null); // { type, id, name }
  const [editingDecree, setEditingDecree] = useState(null); // { id, title, subtitle, category_id, target_type }
  const [deletingDecree, setDeletingDecree] = useState(null); // { id, number, title }

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

  const fetchRoster = async () => {
    try {
      const [partData, profData] = await Promise.all([
        courtApi.getParticipants(),
        courtApi.getProfessors()
      ]);
      setParticipantsList(partData.participants || []);
      setProfessorsList(profData.professors || []);
    } catch (err) {
      console.error('Erro ao buscar combatentes e mestres:', err);
    }
  };

  const fetchDecrees = async () => {
    try {
      const [qData, cData] = await Promise.all([
        courtApi.getQuestions(),
        courtApi.getCategories()
      ]);
      setQuestionsList(qData.questions || []);
      setCategoriesList(cData.categories || []);
    } catch (err) {
      console.error('Erro ao buscar decretos e categorias:', err);
    }
  };

  useEffect(() => {
    fetchResults();
    fetchRoster();
    fetchDecrees();
  }, [pin]);

  // Salvar Renomeação (Combatente ou Mestre)
  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (editingItem.type === 'combatente') {
        await courtApi.updateParticipant(pin, editingItem.id, {
          name: editingItem.name.trim(),
          title: editingItem.title?.trim()
        });
        setActionMessage(`Combatente renomeado com sucesso para "${editingItem.name.trim()}"!`);
      } else {
        await courtApi.updateProfessor(pin, editingItem.id, {
          name: editingItem.name.trim(),
          subject: editingItem.subject?.trim()
        });
        setActionMessage(`Mestre renomeado com sucesso para "${editingItem.name.trim()}"!`);
      }
      setEditingItem(null);
      await Promise.all([fetchRoster(), fetchResults()]);
      refreshParticipants();
      refreshProfessors();
    } catch (err) {
      alert(err.message || 'Erro ao renomear.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar Expurgo Individual (Combatente ou Mestre)
  const handleConfirmExpunge = async () => {
    if (!expungingItem) return;

    setIsSubmitting(true);
    try {
      if (expungingItem.type === 'combatente') {
        await courtApi.deleteParticipant(pin, expungingItem.id);
        setActionMessage(`⚔️ Combatente "${expungingItem.name}" foi expurgado e seus votos removidos!`);
      } else {
        await courtApi.deleteProfessor(pin, expungingItem.id);
        setActionMessage(`📜 Mestre "${expungingItem.name}" foi expurgado do Conselho!`);
      }
      setExpungingItem(null);
      await Promise.all([fetchRoster(), fetchResults()]);
      refreshParticipants();
      refreshProfessors();
    } catch (err) {
      alert(err.message || 'Erro ao expurgar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Salvar Decreto (Criar ou Editar)
  const handleSaveDecree = async (e) => {
    if (e) e.preventDefault();
    if (!editingDecree || !editingDecree.title.trim() || !editingDecree.subtitle.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingDecree.id) {
        // Atualizar existente
        await courtApi.updateQuestion(pin, editingDecree.id, {
          title: editingDecree.title.trim(),
          subtitle: editingDecree.subtitle.trim(),
          category_id: Number(editingDecree.category_id),
          target_type: editingDecree.target_type
        });
        setActionMessage(`👑 Decreto #${editingDecree.number || ''} atualizado com sucesso!`);
      } else {
        // Criar novo
        await courtApi.createQuestion(pin, {
          title: editingDecree.title.trim(),
          subtitle: editingDecree.subtitle.trim(),
          category_id: Number(editingDecree.category_id),
          target_type: editingDecree.target_type
        });
        setActionMessage('👑 Novo decreto real proclamado perante a Corte!');
      }
      setEditingDecree(null);
      await Promise.all([fetchDecrees(), fetchResults()]);
      if (refreshQuestions) refreshQuestions();
    } catch (err) {
      alert(err.message || 'Erro ao salvar decreto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirmar Exclusão de Decreto
  const handleConfirmDeleteDecree = async () => {
    if (!deletingDecree) return;
    setIsSubmitting(true);
    try {
      await courtApi.deleteQuestion(pin, deletingDecree.id);
      setActionMessage(`🗑️ Decreto #${deletingDecree.number} excluído e votos expurgados!`);
      setDeletingDecree(null);
      await Promise.all([fetchDecrees(), fetchResults()]);
      if (refreshQuestions) refreshQuestions();
    } catch (err) {
      alert(err.message || 'Erro ao excluir decreto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetVotes = async () => {
    if (!window.confirm('⚠️ ATENÇÃO: Tem certeza que deseja expurgar TODOS os votos já realizados?')) {
      return;
    }
    try {
      await courtApi.resetVotes(pin);
      setActionMessage('Todos os votos foram zerados com sucesso!');
      await Promise.all([fetchResults(), fetchRoster()]);
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
      await Promise.all([fetchResults(), fetchRoster()]);
      refreshParticipants();
      refreshProfessors();
    } catch (err) {
      alert(err.message || 'Erro ao reiniciar tudo.');
    }
  };

  // Filtragem de Busca
  const filteredParticipants = participantsList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.title && p.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProfessors = professorsList.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.subject && p.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredQuestions = questionsList.filter(q => {
    const matchesCategory = selectedDecreeCategory === 'all' || q.category_id === Number(selectedDecreeCategory);
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        {/* Barra Superior */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gold-600/30">
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
                Painel do Mestre de Cerimônias e Gestão da Corte
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchResults(); fetchRoster(); fetchDecrees(); }}
              title="Recarregar dados"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-900 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-200 hover:border-gold-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={() => setIsCeremonyOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-extrabold text-xs uppercase tracking-wider shadow-gold-glow hover:brightness-110 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-obsidian-950" />
              <span>Modo Telão</span>
            </button>
          </div>
        </div>

        {/* Notificação de Ação */}
        {actionMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-xs sm:text-sm text-emerald-200 flex items-center justify-between shadow-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage('')} className="text-emerald-400 hover:text-emerald-200 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Switcher de Visão: Apuração vs Gestão da Corte */}
        <div className="flex items-center gap-3 mb-6 p-1.5 bg-obsidian-900 border border-gold-600/30 rounded-2xl w-full sm:w-auto sm:inline-flex">
          <button
            onClick={() => setViewMode('results')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs sm:text-sm font-bold transition-all ${
              viewMode === 'results'
                ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-parchment-400 hover:text-parchment-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Apuração & Votos</span>
          </button>

          <button
            onClick={() => setViewMode('management')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-heading text-xs sm:text-sm font-bold transition-all ${
              viewMode === 'management'
                ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 shadow-gold-glow'
                : 'text-parchment-400 hover:text-parchment-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Gestão da Corte</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              viewMode === 'management' ? 'bg-obsidian-950 text-gold-400' : 'bg-royal-950 text-parchment-300'
            }`}>
              {participantsList.length + professorsList.length + questionsList.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: APURAÇÃO DOS RESULTADOS */}
        {/* ========================================================================= */}
        {viewMode === 'results' && (
          <>
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

                            {/* Ranking da Pergunta */}
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

                {/* Zona de Perigo Global */}
                <div className="mt-12 p-6 rounded-2xl border border-red-800/40 bg-red-950/20 text-parchment-300">
                  <div className="flex items-center gap-2 text-red-400 font-heading font-bold text-sm mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Zona dos Guardiões (Ações Globais Irreversíveis)</span>
                  </div>
                  <p className="text-xs text-parchment-400 mb-4">
                    Use estas opções para testes ou para limpar todos os votos ao dar início oficial à festa.
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
          </>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: GESTÃO DA CORTE (COMBATENTES, MESTRES E DECRETOS) */}
        {/* ========================================================================= */}
        {viewMode === 'management' && (
          <div className="space-y-6">
            {/* Sub-abas de Gestão */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-obsidian-900/80 border border-gold-600/30">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
                <button
                  onClick={() => { setManagementTab('combatentes'); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                    managementTab === 'combatentes'
                      ? 'bg-royal-900 border border-gold-400 text-gold-300 shadow-gold-glow'
                      : 'bg-obsidian-950 border border-gold-600/20 text-parchment-400 hover:text-parchment-200'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>Combatentes ({participantsList.length})</span>
                </button>

                <button
                  onClick={() => { setManagementTab('mestres'); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                    managementTab === 'mestres'
                      ? 'bg-royal-900 border border-gold-400 text-gold-300 shadow-gold-glow'
                      : 'bg-obsidian-950 border border-gold-600/20 text-parchment-400 hover:text-parchment-200'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Mestres ({professorsList.length})</span>
                </button>

                <button
                  onClick={() => { setManagementTab('decretos'); setSearchQuery(''); }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-heading font-bold whitespace-nowrap transition-all ${
                    managementTab === 'decretos'
                      ? 'bg-royal-900 border border-gold-400 text-gold-300 shadow-gold-glow'
                      : 'bg-obsidian-950 border border-gold-600/20 text-parchment-400 hover:text-parchment-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Decretos ({questionsList.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-parchment-400" />
                  <input
                    type="text"
                    placeholder={`Buscar em ${managementTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-obsidian-950 border border-gold-600/30 rounded-xl text-xs text-parchment-100 placeholder:text-parchment-500 focus:outline-none focus:border-gold-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-parchment-500 hover:text-parchment-200 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {managementTab === 'mestres' && (
                  <button
                    onClick={() => setIsAddProfOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gold-600 hover:bg-gold-500 text-obsidian-950 rounded-xl text-xs font-heading font-bold transition-all shrink-0 shadow-gold-glow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mestre</span>
                  </button>
                )}

                {managementTab === 'decretos' && (
                  <button
                    onClick={() => setEditingDecree({
                      id: null,
                      number: questionsList.length + 1,
                      title: '',
                      subtitle: '',
                      category_id: categoriesList[0]?.id || 1,
                      target_type: 'student'
                    })}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:brightness-110 text-obsidian-950 rounded-xl text-xs font-heading font-bold transition-all shrink-0 shadow-gold-glow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Decreto</span>
                  </button>
                )}
              </div>
            </div>

            {/* SUB-ABA 1: LISTAGEM DE COMBATENTES */}
            {managementTab === 'combatentes' && (
              <div className="space-y-3">
                {filteredParticipants.length === 0 ? (
                  <div className="text-center py-16 bg-obsidian-900/50 border border-gold-600/20 rounded-2xl">
                    <Users className="w-10 h-10 text-parchment-500 mx-auto mb-2 opacity-50" />
                    <p className="font-heading text-sm text-parchment-400">
                      {searchQuery ? 'Nenhum combatente encontrado com este nome.' : 'Nenhum combatente alistado na Corte até o momento.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredParticipants.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-obsidian-900/80 border border-gold-600/30 hover:border-gold-500/50 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-royal-950 border border-gold-500/40 flex items-center justify-center font-medieval text-gold-400 font-bold text-base shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-heading font-bold text-sm text-parchment-100 truncate group-hover:text-gold-300 transition-colors">
                              {p.name}
                            </h4>
                            <p className="text-xs text-gold-400/90 font-heading truncate">
                              {p.title || 'Guerreiro(a) da Corte'}
                            </p>
                            <span className="text-[10px] text-parchment-400">
                              {p.total_votes_cast !== undefined ? `${p.total_votes_cast} votos selados` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingItem({
                              type: 'combatente',
                              id: p.id,
                              name: p.name,
                              title: p.title || ''
                            })}
                            title="Renomear combatente e título"
                            className="p-2 rounded-lg bg-obsidian-950 border border-gold-600/30 text-parchment-300 hover:text-gold-300 hover:border-gold-400 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setExpungingItem({
                              type: 'combatente',
                              id: p.id,
                              name: p.name
                            })}
                            title="Expurgar combatente da Corte"
                            className="p-2 rounded-lg bg-obsidian-950 border border-red-700/40 text-red-400 hover:bg-red-950 hover:border-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA 2: LISTAGEM DE MESTRES (PROFESSORES) */}
            {managementTab === 'mestres' && (
              <div className="space-y-3">
                {filteredProfessors.length === 0 ? (
                  <div className="text-center py-16 bg-obsidian-900/50 border border-gold-600/20 rounded-2xl">
                    <GraduationCap className="w-10 h-10 text-parchment-500 mx-auto mb-2 opacity-50" />
                    <p className="font-heading text-sm text-parchment-400">
                      {searchQuery ? 'Nenhum mestre encontrado com esse critério.' : 'Nenhum mestre cadastrado no Conselho.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProfessors.map((prof) => (
                      <div
                        key={prof.id}
                        className="p-4 rounded-xl bg-obsidian-900/80 border border-gold-600/30 hover:border-gold-500/50 transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-royal-950 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold shrink-0">
                            <GraduationCap className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-heading font-bold text-sm text-parchment-100 truncate group-hover:text-gold-300 transition-colors">
                              {prof.name}
                            </h4>
                            <p className="text-xs text-parchment-400 truncate">
                              {prof.subject || 'Disciplina da Corte'}
                            </p>
                            {prof.is_preset ? (
                              <span className="text-[10px] text-gold-400 uppercase tracking-wider font-semibold">Mestre Regente</span>
                            ) : (
                              <span className="text-[10px] text-parchment-500">Mestre Convocado</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setEditingItem({
                              type: 'mestre',
                              id: prof.id,
                              name: prof.name,
                              subject: prof.subject || ''
                            })}
                            title="Renomear mestre e disciplina"
                            className="p-2 rounded-lg bg-obsidian-950 border border-gold-600/30 text-parchment-300 hover:text-gold-300 hover:border-gold-400 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setExpungingItem({
                              type: 'mestre',
                              id: prof.id,
                              name: prof.name
                            })}
                            title="Expurgar mestre do Conselho"
                            className="p-2 rounded-lg bg-obsidian-950 border border-red-700/40 text-red-400 hover:bg-red-950 hover:border-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-ABA 3: GESTÃO DE DECRETOS (PERGUNTAS) */}
            {managementTab === 'decretos' && (
              <div className="space-y-4">
                {/* Filtro de Categorias de Decretos */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <button
                    onClick={() => setSelectedDecreeCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                      selectedDecreeCategory === 'all'
                        ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                        : 'bg-obsidian-900 border border-gold-600/20 text-parchment-400 hover:text-parchment-200'
                    }`}
                  >
                    Todos os Tomos ({questionsList.length})
                  </button>

                  {categoriesList.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedDecreeCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                        selectedDecreeCategory === cat.id
                          ? 'bg-gold-500 text-obsidian-950 shadow-gold-glow'
                          : 'bg-obsidian-900 border border-gold-600/20 text-parchment-400 hover:text-parchment-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-16 bg-obsidian-900/50 border border-gold-600/20 rounded-2xl">
                    <BookOpen className="w-10 h-10 text-parchment-500 mx-auto mb-2 opacity-50" />
                    <p className="font-heading text-sm text-parchment-400">
                      Nenhum decreto real encontrado neste critério de busca.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 rounded-xl bg-obsidian-900/90 border border-gold-600/30 hover:border-gold-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="px-2.5 py-1 rounded-lg bg-royal-950 border border-gold-500/40 text-gold-400 font-heading font-bold text-xs shrink-0 mt-0.5">
                            #{q.number}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-obsidian-950 border border-gold-600/30 text-gold-400 font-heading">
                                {q.category_emoji} {q.category_name}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                q.target_type === 'professor'
                                  ? 'bg-purple-950/80 border border-purple-600/40 text-purple-300'
                                  : 'bg-royal-950/80 border border-royal-600/40 text-royal-300'
                              }`}>
                                {q.target_type === 'professor' ? '🧙 Conselho de Mestres' : '⚔️ Combatentes da Turma'}
                              </span>
                            </div>
                            <h4 className="font-heading font-bold text-sm text-parchment-100 group-hover:text-gold-300 transition-colors">
                              {q.title}
                            </h4>
                            <p className="text-xs text-gold-400/80 italic font-heading mt-0.5">
                              Subtítulo: "{q.subtitle}"
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => setEditingDecree({
                              id: q.id,
                              number: q.number,
                              title: q.title,
                              subtitle: q.subtitle,
                              category_id: q.category_id,
                              target_type: q.target_type || 'student'
                            })}
                            title="Editar título e subtítulo do decreto"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-950 border border-gold-600/30 text-parchment-300 hover:text-gold-300 hover:border-gold-400 transition-all text-xs font-heading font-semibold"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => setDeletingDecree({
                              id: q.id,
                              number: q.number,
                              title: q.title
                            })}
                            title="Excluir decreto da Corte"
                            className="p-2 rounded-lg bg-obsidian-950 border border-red-700/40 text-red-400 hover:bg-red-950 hover:border-red-500 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: RENOMEAR (COMBATENTE OU MESTRE) */}
        {/* ========================================================================= */}
        {editingItem && (
          <div className="fixed inset-0 z-[60] bg-obsidian-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-obsidian-900 border-2 border-gold-500/80 rounded-2xl p-6 shadow-gold-glow animate-fade-in text-parchment-100">
              <div className="flex items-center justify-between mb-4 border-b border-gold-600/30 pb-3">
                <div className="flex items-center gap-2 text-gold-400 font-medieval text-lg font-bold">
                  <Edit2 className="w-5 h-5" />
                  <span>Renomear {editingItem.type === 'combatente' ? 'Combatente' : 'Mestre'}</span>
                </div>
                <button
                  onClick={() => setEditingItem(null)}
                  className="text-parchment-400 hover:text-parchment-100 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-parchment-300 mb-4">
                {editingItem.type === 'combatente'
                  ? 'Ao renomear este combatente, todos os votos que ele já recebeu nos decretos serão automaticamente transferidos para o novo nome.'
                  : 'Atualize o nome e a disciplina lecionada pelo mestre no Conselho.'}
              </p>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                    Nome Oficial
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-sm text-parchment-100 focus:outline-none focus:border-gold-400"
                    placeholder="Nome completo..."
                  />
                </div>

                {editingItem.type === 'combatente' ? (
                  <div>
                    <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                      Título Honorífico da Corte
                    </label>
                    <input
                      type="text"
                      value={editingItem.title}
                      onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-sm text-parchment-100 focus:outline-none focus:border-gold-400"
                      placeholder="Ex: O Cavaleiro das 23h59"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                      Disciplina / Matéria
                    </label>
                    <input
                      type="text"
                      value={editingItem.subject}
                      onChange={(e) => setEditingItem({ ...editingItem, subject: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-sm text-parchment-100 focus:outline-none focus:border-gold-400"
                      placeholder="Ex: Banco de Dados, Algoritmos..."
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-600/20">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 rounded-xl bg-obsidian-950 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-300 hover:text-parchment-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !editingItem.name.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-bold text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Gravando...' : 'Salvar Alterações'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: EXPURGAR INDIVIDUAL (COMBATENTE OU MESTRE) */}
        {/* ========================================================================= */}
        {expungingItem && (
          <div className="fixed inset-0 z-[60] bg-obsidian-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-obsidian-900 border-2 border-red-600/80 rounded-2xl p-6 shadow-2xl animate-fade-in text-parchment-100">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h3 className="font-medieval text-lg font-bold text-red-300">
                  Expurgar {expungingItem.type === 'combatente' ? 'Combatente' : 'Mestre'}
                </h3>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-700/40 text-xs text-parchment-300 mb-5 space-y-2">
                <p>
                  Tem certeza que deseja expurgar <strong className="text-red-300 font-bold">"{expungingItem.name}"</strong> dos anais da Corte?
                </p>
                {expungingItem.type === 'combatente' ? (
                  <ul className="list-disc pl-4 text-red-200/90 space-y-1">
                    <li>O participante será removido da lista de combatentes.</li>
                    <li>Todos os votos emitidos por ele serão cancelados.</li>
                    <li>Todos os votos que outros deram nele serão expurgados para não gerar dados fantasmas.</li>
                  </ul>
                ) : (
                  <ul className="list-disc pl-4 text-red-200/90 space-y-1">
                    <li>O mestre será desativado do Conselho.</li>
                    <li>Votos recebidos por ele serão removidos das apurações de mestres.</li>
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setExpungingItem(null)}
                  className="px-4 py-2 rounded-xl bg-obsidian-950 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-300 hover:text-parchment-100"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmExpunge}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-parchment-100 font-heading font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Expurgando...' : 'Confirmar Expurgo'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CRIAR OU EDITAR DECRETO REAL (PERGUNTA) */}
        {/* ========================================================================= */}
        {editingDecree && (
          <div className="fixed inset-0 z-[60] bg-obsidian-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-obsidian-900 border-2 border-gold-500/80 rounded-2xl p-6 shadow-gold-glow animate-fade-in text-parchment-100">
              <div className="flex items-center justify-between mb-4 border-b border-gold-600/30 pb-3">
                <div className="flex items-center gap-2 text-gold-400 font-medieval text-lg font-bold">
                  <BookOpen className="w-5 h-5" />
                  <span>{editingDecree.id ? `Editar Decreto #${editingDecree.number}` : 'Proclamar Novo Decreto'}</span>
                </div>
                <button
                  onClick={() => setEditingDecree(null)}
                  className="text-parchment-400 hover:text-parchment-100 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDecree} className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                    Título / Pergunta do Decreto *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={editingDecree.title}
                    onChange={(e) => setEditingDecree({ ...editingDecree, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-sm text-parchment-100 focus:outline-none focus:border-gold-400"
                    placeholder="Ex: Quem é mais provável de comitar direto na branch main?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                    Subtítulo / Título Cômico do Decreto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingDecree.subtitle}
                    onChange={(e) => setEditingDecree({ ...editingDecree, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-sm text-parchment-100 focus:outline-none focus:border-gold-400"
                    placeholder="Ex: O Herege do Git"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                      Tomo / Categoria *
                    </label>
                    <select
                      value={editingDecree.category_id}
                      onChange={(e) => setEditingDecree({ ...editingDecree, category_id: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-xs text-parchment-100 focus:outline-none focus:border-gold-400"
                    >
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-heading font-bold text-gold-300 mb-1.5">
                      Quem pode receber votos? *
                    </label>
                    <select
                      value={editingDecree.target_type}
                      onChange={(e) => setEditingDecree({ ...editingDecree, target_type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-obsidian-950 border border-gold-600/40 rounded-xl text-xs text-parchment-100 focus:outline-none focus:border-gold-400"
                    >
                      <option value="student">⚔️ Combatentes (Alunos)</option>
                      <option value="professor">🧙 Conselho dos Mestres (Professores)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gold-600/20">
                  <button
                    type="button"
                    onClick={() => setEditingDecree(null)}
                    className="px-4 py-2 rounded-xl bg-obsidian-950 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-300 hover:text-parchment-100"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !editingDecree.title.trim() || !editingDecree.subtitle.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-bold text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSubmitting ? 'Gravando...' : editingDecree.id ? 'Salvar Decreto' : 'Proclamar Decreto'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: EXCLUIR DECRETO REAL */}
        {/* ========================================================================= */}
        {deletingDecree && (
          <div className="fixed inset-0 z-[60] bg-obsidian-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-obsidian-900 border-2 border-red-600/80 rounded-2xl p-6 shadow-2xl animate-fade-in text-parchment-100">
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <h3 className="font-medieval text-lg font-bold text-red-300">
                  Revogar Decreto #{deletingDecree.number}
                </h3>
              </div>

              <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-700/40 text-xs text-parchment-300 mb-5 space-y-2">
                <p>
                  Tem certeza que deseja revogar permanentemente o decreto:
                </p>
                <p className="font-heading font-bold text-red-200">
                  "{deletingDecree.title}"?
                </p>
                <p className="text-red-300/90 text-[11px]">
                  ⚠️ Todos os votos selados pelos combatentes para este decreto específico serão removidos dos tomos da Corte.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingDecree(null)}
                  className="px-4 py-2 rounded-xl bg-obsidian-950 border border-gold-600/30 text-xs font-heading font-semibold text-parchment-300 hover:text-parchment-100"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDeleteDecree}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 text-parchment-100 font-heading font-bold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Revogando...' : 'Confirmar Exclusão'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Adicionar Mestre */}
        <AddProfessorModal
          isOpen={isAddProfOpen}
          onClose={() => {
            setIsAddProfOpen(false);
            fetchRoster();
            fetchResults();
          }}
        />
      </div>
    </div>
  );
}
