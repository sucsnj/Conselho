const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.error || `Erro do Reino (${response.status})`);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`Erro na requisição ${endpoint}:`, err);
    throw err;
  }
}

export const courtApi = {
  // Alistamento e participantes
  checkIn: (name, title, sessionToken) => request('/api/checkin', {
    method: 'POST',
    body: JSON.stringify({ name, title, session_token: sessionToken })
  }),

  getParticipants: () => request('/api/participants'),

  getTitles: () => request('/api/titles'),

  // Perguntas e Categorias
  getQuestions: (categoryId) => request(`/api/questions${categoryId ? `?category_id=${categoryId}` : ''}`),

  getCategories: () => request('/api/categories'),

  // Conselho dos Mestres
  getProfessors: () => request('/api/professors'),

  addProfessor: (name, subject) => request('/api/professors', {
    method: 'POST',
    body: JSON.stringify({ name, subject })
  }),

  // Votação
  submitVote: (voterId, questionId, votedForName, sessionToken) => request('/api/votes', {
    method: 'POST',
    body: JSON.stringify({
      voter_id: voterId,
      question_id: questionId,
      voted_for_name: votedForName,
      session_token: sessionToken
    })
  }),

  getMyVotes: (voterId, sessionToken) => request(`/api/votes/my/${voterId}`, {
    headers: { 'x-participant-token': sessionToken }
  }),

  getStats: () => request('/api/votes/stats'),

  // Administração (Cofre da Coroa)
  verifyAdminPin: (pin) => request('/api/admin/verify', {
    method: 'POST',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify({ pin })
  }),

  getAdminResults: (pin) => request('/api/admin/results', {
    headers: { 'x-admin-pin': pin }
  }),

  resetVotes: (pin) => request('/api/admin/reset-votes', {
    method: 'POST',
    headers: { 'x-admin-pin': pin }
  }),

  resetAll: (pin) => request('/api/admin/reset-all', {
    method: 'POST',
    headers: { 'x-admin-pin': pin }
  }),

  // Gestão de Combatentes e Mestres
  updateParticipant: (pin, id, { name, title }) => request(`/api/admin/participants/${id}`, {
    method: 'PUT',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify({ name, title })
  }),

  deleteParticipant: (pin, id) => request(`/api/admin/participants/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin }
  }),

  updateProfessor: (pin, id, { name, subject }) => request(`/api/admin/professors/${id}`, {
    method: 'PUT',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify({ name, subject })
  }),

  deleteProfessor: (pin, id) => request(`/api/admin/professors/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin }
  }),

  // Gestão de Decretos (Perguntas)
  createQuestion: (pin, data) => request('/api/admin/questions', {
    method: 'POST',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify(data)
  }),

  updateQuestion: (pin, id, data) => request(`/api/admin/questions/${id}`, {
    method: 'PUT',
    headers: { 'x-admin-pin': pin },
    body: JSON.stringify(data)
  }),

  deleteQuestion: (pin, id) => request(`/api/admin/questions/${id}`, {
    method: 'DELETE',
    headers: { 'x-admin-pin': pin }
  })
};
