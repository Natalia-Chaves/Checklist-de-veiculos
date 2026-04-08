import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, FolderOpen, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/colaborador', label: 'Novo Checklist', icon: ClipboardList, end: true },
  { to: '/colaborador/meus-checklists', label: 'Meus Checklists', icon: FolderOpen },
  { to: '/colaborador/meu-veiculo', label: 'Meu Veículo', icon: Truck },
];

export default function ColaboradorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

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
