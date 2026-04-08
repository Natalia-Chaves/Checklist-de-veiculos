import React, { useEffect, useState } from 'react';
import { listarResponsaveis, criarResponsavel, atualizarResponsavel, listarVeiculos } from '../../services/api';
import { PageLoader, Modal, EmptyState } from '../../components/shared';
import { Wrench } from 'lucide-react';

export default function Responsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [form, setForm] = useState({ nome: '', telefone: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState({ nome: '', telefone: '', placa: '' });

  const carregar = () => {
    setLoading(true);
    Promise.all([listarResponsaveis(), listarVeiculos()])
      .then(([r, v]) => { setResponsaveis(r.data); setVeiculos(v.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => { setForm({ nome: '', telefone: '' }); setErro(''); setModal('criar'); };

  const abrirEditar = (r) => {
    setSelecionado(r);
    setForm({ nome: r.nome, telefone: r.telefone || '' });
    setErro(''); setModal('editar');
  };

  const handleCriar = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await criarResponsavel(form);
      setModal(null); carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar responsável');
    } finally { setSaving(false); }
  };

  const handleEditar = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await atualizarResponsavel(selecionado.id, form);
      setModal(null); carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao atualizar responsável');
    } finally { setSaving(false); }
  };

  const responsaveisFiltrados = responsaveis.filter(r => {
    if (filtros.nome && !r.nome?.toLowerCase().includes(filtros.nome.toLowerCase())) return false;
    if (filtros.telefone && !r.telefone?.toLowerCase().includes(filtros.telefone.toLowerCase())) return false;
    if (filtros.placa) {
      const placas = veiculos.filter(v => v.responsavel_manutencao_id === r.id).map(v => v.placa.toLowerCase());
      if (!placas.some(p => p.includes(filtros.placa.toLowerCase()))) return false;
    }
    return true;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Responsáveis de Manutenção</h1>
        <button onClick={abrirCriar} className="btn-primary text-sm">+ Novo responsável</button>
      </div>

      {responsaveis.length === 0 && !Object.values(filtros).some(Boolean) ? (
        <EmptyState icon={<Wrench size={48} />} title="Nenhum responsável cadastrado" description="Adicione o primeiro responsável de manutenção." />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Nome', 'Telefone', 'Veículos vinculados', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
              <tr className="border-b bg-white">
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.nome} onChange={e => setFiltros({ ...filtros, nome: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.telefone} onChange={e => setFiltros({ ...filtros, telefone: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.placa} onChange={e => setFiltros({ ...filtros, placa: e.target.value })} /></td>
                <td className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {responsaveisFiltrados.map(r => {
                const vinculados = veiculos.filter(v => v.responsavel_manutencao_id === r.id);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{r.telefone || <span className="italic text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {vinculados.length > 0
                        ? vinculados.map(v => v.placa).join(', ')
                        : <span className="italic text-gray-300">Nenhum</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirEditar(r)} className="text-xs text-primary-600 hover:underline">Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal === 'criar'} onClose={() => setModal(null)} title="Novo Responsável de Manutenção"
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleCriar} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Criar'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Nome <span className="text-danger-600">*</span></label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
          <div><label className="label">Telefone</label><input className="input" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="opcional" /></div>
        </div>
      </Modal>

      <Modal open={modal === 'editar'} onClose={() => setModal(null)} title={`Editar — ${selecionado?.nome}`}
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleEditar} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Nome <span className="text-danger-600">*</span></label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
          <div><label className="label">Telefone</label><input className="input" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  );
}
