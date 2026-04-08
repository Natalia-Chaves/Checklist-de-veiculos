import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const data = await login(matricula, senha);
      if (data.primeiro_acesso) { navigate('/primeiro-acesso'); return; }
      navigate(data.role === 'gestor' ? '/gestor' : '/colaborador');
    } catch (err) {
      setErro(err.response?.data?.detail || 'Matrícula ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-9 h-9 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Checklist de Veículos</h1>
          <p className="text-primary-200 mt-1 text-sm">Gestão de Frota</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar no sistema</h2>

          {erro && (
            <div className="bg-danger-50 border border-red-200 text-danger-600 rounded-lg px-4 py-3 mb-4 text-sm">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Matrícula</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: G0001 ou C0001"
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Problemas de acesso? Fale com o gestor responsável.
          </p>
        </div>
      </div>
    </div>
  );
}
