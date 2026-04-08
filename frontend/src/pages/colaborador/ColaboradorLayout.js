import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, FolderOpen, Truck, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotificacoes, marcarNotificacoesLidas } from '../../services/api';

const NAV = [
  { to: '/colaborador', label: 'Novo Checklist', icon: ClipboardList, end: true },
  { to: '/colaborador/meus-checklists', label: 'Meus Checklists', icon: FolderOpen },
  { to: '/colaborador/meu-veiculo', label: 'Meu Veículo', icon: Truck },
];

export default function ColaboradorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => { logout(); navigate('/login'); };

  const [notificacoes, setNotificacoes] = useState({ count: 0, items: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotificacoes = useCallback(async () => {
    try {
      const { data } = await getNotificacoes();
      setNotificacoes(data);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { fetchNotificacoes(); }, [fetchNotificacoes, location.pathname]);

  useEffect(() => {
    const interval = setInterval(fetchNotificacoes, 60000);
    return () => clearInterval(interval);
  }, [fetchNotificacoes]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => setShowDropdown(prev => !prev);

  const handleNotificacaoClick = async (id) => {
    setShowDropdown(false);
    navigate(`/colaborador/meus-checklists`);
    try { await marcarNotificacoesLidas(); fetchNotificacoes(); } catch { /* silencioso */ }
  };

  const handleMarcarTodasLidas = async () => {
    try { await marcarNotificacoesLidas(); fetchNotificacoes(); setShowDropdown(false); } catch { /* silencioso */ }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-primary-900 text-white shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center"><Truck size={18} className="text-white" /></div>
            <div>
              <p className="font-bold text-sm leading-tight">Checklist de Veículos</p>
              <p className="text-primary-300 text-xs">Área do Colaborador</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notificações */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={handleBellClick} className="relative text-primary-200 hover:text-white transition-colors p-1">
                <Bell size={20} />
                {notificacoes.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {notificacoes.count > 9 ? '9+' : notificacoes.count}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">Notificações</span>
                    {notificacoes.count > 0 && (
                      <button onClick={handleMarcarTodasLidas} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Marcar como lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notificacoes.items.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">Nenhuma notificação</div>
                    ) : (
                      notificacoes.items.map(n => (
                        <button
                          key={n.id}
                          onClick={() => handleNotificacaoClick(n.id)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${n.status === 'aprovado' ? 'bg-success-500' : 'bg-danger-500'}`} />
                            <span className={`text-xs font-semibold ${n.status === 'aprovado' ? 'text-success-600' : 'text-danger-600'}`}>
                              {n.status === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                            </span>
                            <span className="text-xs text-gray-400 ml-auto">{n.placa}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Checklist de {n.data_checklist}
                            {n.justificativa && <span className="block text-gray-400 truncate mt-0.5">"{n.justificativa}"</span>}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.nome?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-primary-200">{user?.nome}</span>
            </div>
            <button onClick={handleLogout} className="text-primary-300 hover:text-white text-xs flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-white text-white'
                    : 'border-transparent text-primary-300 hover:text-white hover:border-primary-400'
                }`
              }
            >
              <item.icon size={16} /> {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
