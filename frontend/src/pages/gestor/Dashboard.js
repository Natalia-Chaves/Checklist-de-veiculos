import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClipboardList, Clock, CheckCircle, XCircle, CheckCircle2 } from 'lucide-react';
import { getDashboard } from '../../services/api';
import { PageLoader, StatCard, Badge, ErrorState } from '../../components/shared';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const navigate = useNavigate();

  const carregar = () => {
    setLoading(true); setErro(false);
    getDashboard().then(r => setData(r.data)).catch(() => setErro(true)).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  if (loading) return <PageLoader />;
  if (erro) return <ErrorState message="Erro ao carregar o dashboard." onRetry={carregar} />;
  if (!data) return null;

  const { resumo, veiculos_sem_checklist, grafico_semanal } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral da frota hoje</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Checklists hoje" value={resumo.total_hoje} color="blue" icon={<ClipboardList size={28} />} />
        <StatCard label="Pendentes" value={resumo.pendentes} color="yellow" icon={<Clock size={28} />} />
        <StatCard label="Aprovados" value={resumo.aprovados} color="green" icon={<CheckCircle size={28} />} />
        <StatCard label="Reprovados" value={resumo.reprovados} color="red" icon={<XCircle size={28} />} />
      </div>

      {/* Gráfico + Alertas */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico semanal */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Checklists — últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico_semanal} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="data"
                tickFormatter={d => {
                  const [year, month, day] = d.split('-');
                  return `${day}/${month}/${year.slice(2)}`;
                }}
                tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="aprovado" name="Aprovado" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="reprovado" name="Reprovado" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pendente" name="Pendente" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Veículos sem checklist */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700">Sem checklist hoje</h2>
            <span className="badge-reprovado">{resumo.veiculos_sem_checklist_hoje}</span>
          </div>
          {veiculos_sem_checklist.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="text-success-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Todos os veículos têm checklist hoje!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {veiculos_sem_checklist.map(v => (
                <div key={v.id} className="flex items-center justify-between p-2 bg-danger-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{v.placa}</p>
                    <p className="text-xs text-gray-500">{v.motorista_nome || v.modelo}</p>
                  </div>
                  <button onClick={() => navigate(`/gestor/checklists?veiculo_id=${v.id}`)} className="text-xs text-primary-600 hover:underline">Ver</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pendentes recentes */}
      {resumo.pendentes > 0 && (
        <div className="bg-warning-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={22} className="text-warning-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-warning-600">{resumo.pendentes} checklist{resumo.pendentes > 1 ? 's' : ''} aguardando validação</p>
              <p className="text-sm text-yellow-600">Revise e aprove ou reprove os checklists pendentes.</p>
            </div>
          </div>
          <button onClick={() => navigate('/gestor/checklists?status=pendente')} className="btn-primary text-sm">
            Ver pendentes
          </button>
        </div>
      )}
    </div>
  );
}
