import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trocarSenha } from '../services/api';

export default function PrimeiroAcessoPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.nova_senha !== form.confirmar_senha) { setErro('As senhas não conferem'); return; }
    if (form.nova_senha.length < 6) { setErro('A nova senha deve ter pelo menos 6 caracteres'); return; }
    setLoading(true); setErro('');
    try {
      await trocarSenha(form);
      refreshUser({ primeiro_acesso: false });
      navigate(user?.role === 'gestor' ? '/gestor' : '/colaborador');
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao trocar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-warning-50 rounded-full mb-3">
            <svg className="w-7 h-7 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Primeiro acesso</h2>
          <p className="text-sm text-gray-500 mt-1">Por segurança, defina uma nova senha para continuar.</p>
        </div>

        {erro && <div className="bg-danger-50 border border-red-200 text-danger-600 rounded-lg px-4 py-3 mb-4 text-sm">{erro}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Senha atual (provisória)</label>
            <input type="password" className="input" value={form.senha_atual} onChange={e => setForm({ ...form, senha_atual: e.target.value })} required />
          </div>
          <div>
            <label className="label">Nova senha</label>
            <input type="password" className="input" placeholder="Mínimo 6 caracteres" value={form.nova_senha} onChange={e => setForm({ ...form, nova_senha: e.target.value })} required />
          </div>
          <div>
            <label className="label">Confirmar nova senha</label>
            <input type="password" className="input" value={form.confirmar_senha} onChange={e => setForm({ ...form, confirmar_senha: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Salvando...' : 'Definir nova senha e entrar'}
          </button>
        </form>

        <button onClick={logout} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-4">Sair</button>
      </div>
    </div>
  );
}
