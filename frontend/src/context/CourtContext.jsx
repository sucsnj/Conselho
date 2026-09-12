import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { courtApi } from '../services/api';

const CourtContext = createContext();

export function CourtProvider({ children }) {
  // Combatente ativo (salvo no localStorage para não perder a sessão)
  const [currentParticipant, setCurrentParticipant] = useState(() => {
    try {
      const saved = localStorage.getItem('corte_combatente');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Lista dinâmica de participantes alistados na festa
  const [participants, setParticipants] = useState([]);
  
  // Lista de mestres (professores)
  const [professors, setProfessors] = useState([]);

  // Perguntas e Categorias
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(1);

  // Votos do participante atual: { [question_id]: voted_for_name }
  const [myVotes, setMyVotes] = useState({});
  const [votingStatus, setVotingStatus] = useState({}); // { [question_id]: 'idle' | 'saving' | 'saved' | 'error' }

  // Estados de carregamento e erro
  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Exibir toast temporário
  const showToast = useCallback((msg, type = 'success') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // 1. Carregar lista de participantes (polling suave a cada 6s para refletir novos check-ins da festa)
  const fetchParticipants = useCallback(async (isSilent = false) => {
    try {
      const data = await courtApi.getParticipants();
      setParticipants(data.participants || []);
      setApiOnline(true);
    } catch (err) {
      if (!isSilent) console.error('Erro ao buscar combatentes:', err);
      setApiOnline(false);
    }
  }, []);

  // 2. Carregar professores
  const fetchProfessors = useCallback(async () => {
    try {
      const data = await courtApi.getProfessors();
      setProfessors(data.professors || []);
    } catch (err) {
      console.error('Erro ao buscar mestres:', err);
    }
  }, []);

  // 3. Carregar perguntas e categorias
  const fetchQuestionsAndCategories = useCallback(async () => {
    try {
      const [catData, qData] = await Promise.all([
        courtApi.getCategories(),
        courtApi.getQuestions()
      ]);
      setCategories(catData.categories || []);
      setQuestions(qData.questions || []);
    } catch (err) {
      console.error('Erro ao carregar tomos reais:', err);
    }
  }, []);

  // 4. Carregar votos do combatente atual
  const fetchMyVotes = useCallback(async (voterId) => {
    if (!voterId) {
      setMyVotes({});
      return;
    }
    try {
      const data = await courtApi.getMyVotes(voterId);
      setMyVotes(data.votes || {});
    } catch (err) {
      console.error('Erro ao buscar votos:', err);
    }
  }, []);

  // Inicialização geral
  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([
        fetchParticipants(),
        fetchProfessors(),
        fetchQuestionsAndCategories()
      ]);
      if (currentParticipant?.id) {
        await fetchMyVotes(currentParticipant.id);
      }
      setLoading(false);
    }
    init();
  }, [fetchParticipants, fetchProfessors, fetchQuestionsAndCategories, fetchMyVotes, currentParticipant?.id]);

  // Polling automático da lista de participantes a cada 6 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchParticipants(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchParticipants]);

  // Ação de Check-in
  const checkIn = async (name, title) => {
    try {
      const data = await courtApi.checkIn(name, title);
      const participant = data.participant;
      setCurrentParticipant(participant);
      localStorage.setItem('corte_combatente', JSON.stringify(participant));
      await fetchParticipants();
      await fetchMyVotes(participant.id);
      showToast(`Bem-vindo à Corte, ${participant.name}!`, 'success');
      return participant;
    } catch (err) {
      showToast(err.message || 'Erro no alistamento real.', 'error');
      throw err;
    }
  };

  // Trocar de combatente (logout local)
  const leaveCourt = () => {
    setCurrentParticipant(null);
    setMyVotes({});
    localStorage.removeItem('corte_combatente');
    showToast('Você retirou seu elmo. Aliste-se novamente a qualquer momento.', 'info');
  };

  // Votar em uma pergunta
  const castVote = async (questionId, votedForName) => {
    if (!currentParticipant) {
      showToast('Aliste-se primeiro para selar seus votos!', 'warning');
      return false;
    }

    if (!votedForName) return false;

    // Atualização otimista
    setMyVotes(prev => ({ ...prev, [questionId]: votedForName }));
    setVotingStatus(prev => ({ ...prev, [questionId]: 'saving' }));

    try {
      await courtApi.submitVote(currentParticipant.id, questionId, votedForName);
      setVotingStatus(prev => ({ ...prev, [questionId]: 'saved' }));
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [questionId]: 'idle' }));
      }, 2000);
      return true;
    } catch (err) {
      setVotingStatus(prev => ({ ...prev, [questionId]: 'error' }));
      showToast('Falha ao gravar selo real no tomo!', 'error');
      return false;
    }
  };

  // Adicionar professor em tempo real
  const addProfessor = async (name, subject) => {
    try {
      const res = await courtApi.addProfessor(name, subject);
      await fetchProfessors();
      showToast(`Mestre ${name} consagrado no Conselho!`, 'success');
      return res.professor;
    } catch (err) {
      showToast(err.message || 'Erro ao adicionar mestre', 'error');
      throw err;
    }
  };

  // Estatísticas de progresso
  const totalQuestions = questions.length || 48;
  const votedCount = Object.keys(myVotes).length;
  const progressPercentage = totalQuestions > 0 ? Math.round((votedCount / totalQuestions) * 100) : 0;

  return (
    <CourtContext.Provider
      value={{
        currentParticipant,
        checkIn,
        leaveCourt,
        participants,
        refreshParticipants: () => fetchParticipants(false),
        professors,
        addProfessor,
        refreshProfessors: fetchProfessors,
        questions,
        categories,
        refreshQuestions: fetchQuestionsAndCategories,
        activeCategory,
        setActiveCategory,
        myVotes,
        castVote,
        votingStatus,
        totalQuestions,
        votedCount,
        progressPercentage,
        loading,
        apiOnline,
        toastMessage,
        showToast
      }}
    >
      {children}
    </CourtContext.Provider>
  );
}

export function useCourt() {
  const context = useContext(CourtContext);
  if (!context) {
    throw new Error('useCourt deve ser usado dentro de CourtProvider');
  }
  return context;
}
