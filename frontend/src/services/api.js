import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (matricula, senha) => api.post('/auth/login', { matricula, senha });
export const trocarSenha = (data) => api.post('/auth/trocar-senha', data);
export const getMe = () => api.get('/auth/me');

// Gestor — colaboradores
export const listarColaboradores = (params) => api.get('/gestor/colaboradores', { params });
export const criarColaborador = (data) => api.post('/gestor/colaboradores', data);
export const atualizarColaborador = (id, data) => api.put(`/gestor/colaboradores/${id}`, data);
export const redefinirSenha = (id, data) => api.post(`/gestor/colaboradores/${id}/redefinir-senha`, data);
export const historicoSenha = (id) => api.get(`/gestor/colaboradores/${id}/historico-senha`);
export const listarLogs = () => api.get('/gestor/logs');
export const getPerfilGestor = () => api.get('/gestor/perfil');
export const atualizarPerfilGestor = (data) => api.put('/gestor/perfil', data);

// Veículos
export const listarVeiculos = (params) => api.get('/veiculos', { params });
export const criarVeiculo = (data) => api.post('/veiculos', data);
export const getMeuVeiculo = () => api.get('/veiculos/meu-veiculo');
export const atualizarVeiculo = (id, data) => api.put(`/veiculos/${id}`, data);
export const listarResponsaveis = () => api.get('/veiculos/responsaveis/manutencao');
export const criarResponsavel = (data) => api.post('/veiculos/responsaveis/manutencao', data);
export const atualizarResponsavel = (id, data) => api.put(`/veiculos/responsaveis/manutencao/${id}`, data);

// Checklist
export const enviarChecklist = (formData) => api.post('/checklists', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const meusChecklists = () => api.get('/checklists/meus');
export const listarChecklists = (params) => api.get('/checklists', { params });
export const getDashboard = () => api.get('/checklists/dashboard');
export const getChecklist = (id) => api.get(`/checklists/${id}`);
export const validarChecklist = (id, data) => api.patch(`/checklists/${id}/validar`, data);
export const historicoVeiculo = (veiculoId) => api.get(`/checklists/historico/veiculo/${veiculoId}`);
export const getNotificacoes = () => api.get('/checklists/notificacoes');
export const marcarNotificacoesLidas = () => api.patch('/checklists/notificacoes/marcar-lidas');

// Relatório
export const getConfiguracaoRelatorio = () => api.get('/relatorio/configuracao');
export const salvarConfiguracaoRelatorio = (data) => api.put('/relatorio/configuracao', data);
export const downloadExcel = (params) => api.get('/relatorio/excel', { params, responseType: 'blob' });
export const downloadPdf = (params) => api.get('/relatorio/pdf', { params, responseType: 'blob' });

export default api;
