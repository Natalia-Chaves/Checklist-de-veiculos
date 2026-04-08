import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listarChecklists, listarVeiculos, listarColaboradores } from '../../services/api';
import { PageLoader, Badge, EmptyState, formatDate } from '../../components/shared';
import { ClipboardList } from 'lucide-react';

export default function Checklists() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [checklists, setChecklists] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: searchParams.get('status') || '',
    veiculo_id: searchParams.get('veiculo_id') || '',
    colaborador_id: '',
    data_inicio: '',
    data_fim: '',
  });

  useEffect(() => {
    Promise.all([listarVeiculos(), listarColaboradores()]).then(([v, c]) => {
      setVeiculos(v.data);
      setColaboradores(c.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
    listarChecklists(params).then(r => setChecklists(r.data)).finally(() => setLoading(false));
  }, [filtros]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Checklists</h1>

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
            </select>
          </div>
          <div>
            <label className="label">Veículo</label>
            <select className="input" value={filtros.veiculo_id} onChange={e => setFiltros({ ...filtros, veiculo_id: e.target.value })}>
              <option value="">Todos</option>
              {veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Colaborador</label>
            <select className="input" value={filtros.colaborador_id} onChange={e => setFiltros({ ...filtros, colaborador_id: e.target.value })}>
              <option value="">Todos</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">De</label>
            <input type="date" className="input" value={filtros.data_inicio} onChange={e => setFiltros({ ...filtros, data_inicio: e.target.value })} />
          </div>
          <div>
            <label className="label">Até</label>
            <input type="date" className="input" value={filtros.data_fim} onChange={e => setFiltros({ ...filtros, data_fim: e.target.value })} />
          </div>
        </div>
        <button className="btn-secondary text-sm mt-3" onClick={() => setFiltros({ status: '', veiculo_id: '', colaborador_id: '', data_inicio: '', data_fim: '' })}>
          Limpar filtros
        </button>
      </div>

      {loading ? <PageLoader /> : checklists.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} />} title="Nenhum checklist encontrado" description="Tente ajustar os filtros." />
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['#', 'Data', 'Placa', 'Colaborador', 'KM', 'Status', 'Ação'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {checklists.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">#{c.id}</td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(c.data_checklist)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{c.veiculo?.placa ?? c.veiculo_id}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="font-medium">{c.colaborador?.nome ?? c.colaborador_id}</span>
                    {c.colaborador?.matricula && <span className="block text-xs text-gray-400">{c.colaborador.matricula}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.km_atual?.toLocaleString('pt-BR')} km</td>
                  <td className="px-4 py-3"><Badge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => navigate(`/gestor/checklists/${c.id}`)} className="text-primary-600 hover:text-primary-800 font-medium text-xs">
                      Ver detalhes →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
