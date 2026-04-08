import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import PrimeiroAcessoPage from './pages/PrimeiroAcessoPage';

// Gestor
import GestorLayout from './pages/gestor/GestorLayout';
import Dashboard from './pages/gestor/Dashboard';
import Checklists from './pages/gestor/Checklists';
import ChecklistDetalhe from './pages/gestor/ChecklistDetalhe';
import Colaboradores from './pages/gestor/Colaboradores';
import Veiculos from './pages/gestor/Veiculos';
import Responsaveis from './pages/gestor/Responsaveis';
import Relatorios from './pages/gestor/Relatorios';
import Logs from './pages/gestor/Logs';

// Colaborador
import ColaboradorLayout from './pages/colaborador/ColaboradorLayout';
import NovoChecklist from './pages/colaborador/NovoChecklist';
import MeusChecklists from './pages/colaborador/MeusChecklists';
import MeuVeiculo from './pages/colaborador/MeuVeiculo';

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Carregando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.primeiro_acesso) return <Navigate to="/primeiro-acesso" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (user.primeiro_acesso) return <Navigate to="/primeiro-acesso" />;
  return <Navigate to={user.role === 'gestor' ? '/gestor' : '/colaborador'} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />

          <Route path="/gestor" element={<PrivateRoute role="gestor"><GestorLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="checklists" element={<Checklists />} />
            <Route path="checklists/:id" element={<ChecklistDetalhe />} />
            <Route path="colaboradores" element={<Colaboradores />} />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="responsaveis" element={<Responsaveis />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="logs" element={<Logs />} />
          </Route>

          <Route path="/colaborador" element={<PrivateRoute role="colaborador"><ColaboradorLayout /></PrivateRoute>}>
            <Route index element={<NovoChecklist />} />
            <Route path="meus-checklists" element={<MeusChecklists />} />
            <Route path="meu-veiculo" element={<MeuVeiculo />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
