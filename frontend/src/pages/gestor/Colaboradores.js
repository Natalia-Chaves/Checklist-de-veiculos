import React, { useEffect, useState } from 'react';
import { listarColaboradores, criarColaborador, atualizarColaborador, redefinirSenha, listarVeiculos, historicoSenha } from '../../services/api';
import { PageLoader, Modal, EmptyState, ErrorState, formatDateTime } from '../../components/shared';
import { Users } from 'lucide-react';

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState([]);
  const [veiculos, setVeiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'criar' | 'editar' | 'senha' | 'historico'
  const [selecionado, setSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [erro, setErro] = useState('');
  const [form, setForm] = useState({ matricula: '', nome: '', cargo: '', senha: '', veiculo_id: '' });
  const [senhaForm, setSenhaForm] = useState({ nova_senha: '', observacao: '' });
  const [saving, setSaving] = useState(false);
  const [filtros, setFiltros] = useState({ matricula: '', nome: '', cargo: '', veiculo: '', status: '' });

  const [erroCarregar, setErroCarregar] = useState(false);

  const carregar = () => {
    setLoading(true); setErroCarregar(false);
    Promise.all([listarColaboradores(), listarVeiculos()])
      .then(([c, v]) => { setColaboradores(c.data); setVeiculos(v.data); })
      .catch(() => setErroCarregar(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const abrirCriar = () => {
    setForm({ matricula: '', nome: '', cargo: '', senha: '', veiculo_id: '' });
    setErro(''); setModal('criar');
  };

  const abrirEditar = (c) => {
    setSelecionado(c);
    setForm({ matricula: c.matricula, nome: c.nome, cargo: c.cargo, senha: '', veiculo_id: c.veiculo_id || '' });
    setErro(''); setModal('editar');
  };

  const abrirSenha = (c) => {
    setSelecionado(c); setSenhaForm({ nova_senha: '', observacao: '' }); setErro(''); setModal('senha');
  };

  const abrirHistorico = async (c) => {
    setSelecionado(c);
    const r = await historicoSenha(c.id);
    setHistorico(r.data);
    setModal('historico');
  };

  const handleCriar = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await criarColaborador({ ...form, veiculo_id: form.veiculo_id || null });
      setModal(null); carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar colaborador');
    } finally { setSaving(false); }
  };

  const handleEditar = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await atualizarColaborador(selecionado.id, { nome: form.nome, cargo: form.cargo, veiculo_id: form.veiculo_id || null });
      setModal(null); carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao atualizar');
    } finally { setSaving(false); }
  };

  const handleRedefinirSenha = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await redefinirSenha(selecionado.id, senhaForm);
      setModal(null);
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao redefinir senha');
    } finally { setSaving(false); }
  };

  const [toggling, setToggling] = useState(null);

  const handleToggleAtivo = async (c) => {
    setToggling(c.id);
    try {
      await atualizarColaborador(c.id, { ativo: !c.ativo });
      carregar();
    } finally { setToggling(null); }
  };

  const colaboradoresFiltrados = colaboradores.filter(c => {
    const f = filtros;
    const veiculo = veiculos.find(v => v.id === c.veiculo_id);
    const veiculoStr = veiculo ? `${veiculo.placa} ${veiculo.modelo}` : '';
    if (f.matricula && !c.matricula?.toLowerCase().includes(f.matricula.toLowerCase())) return false;
    if (f.nome && !c.nome?.toLowerCase().includes(f.nome.toLowerCase())) return false;
    if (f.cargo && !c.cargo?.toLowerCase().includes(f.cargo.toLowerCase())) return false;
    if (f.veiculo && !veiculoStr.toLowerCase().includes(f.veiculo.toLowerCase())) return false;
    if (f.status && String(c.ativo) !== f.status) return false;
    return true;
  });

  if (loading) return <PageLoader />;
  if (erroCarregar) return <ErrorState message="Erro ao carregar colaboradores." onRetry={carregar} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Colaboradores</h1>
        <button onClick={abrirCriar} className="btn-primary text-sm">+ Novo colaborador</button>
      </div>

      {colaboradores.length === 0 && !Object.values(filtros).some(Boolean) ? <EmptyState icon={<Users size={48} />} title="Nenhum colaborador cadastrado" description="Crie o primeiro colaborador para começar." /> : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[750px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Matrícula', 'Nome', 'Cargo', 'Veículo', 'Status', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
              <tr className="border-b bg-white">
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.matricula} onChange={e => setFiltros({ ...filtros, matricula: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.nome} onChange={e => setFiltros({ ...filtros, nome: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.cargo} onChange={e => setFiltros({ ...filtros, cargo: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.veiculo} onChange={e => setFiltros({ ...filtros, veiculo: e.target.value })} /></td>
                <td className="px-2 py-1.5">
                  <select className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400" value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
                    <option value="">Todos</option>
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </td>
                <td className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {colaboradoresFiltrados.map(c => {
                const veiculo = veiculos.find(v => v.id === c.veiculo_id);
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.matricula}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.nome}</td>
                    <td className="px-4 py-3 text-gray-600">{c.cargo}</td>
                    <td className="px-4 py-3 text-gray-600">{veiculo ? `${veiculo.placa} — ${veiculo.modelo}` : <span className="text-gray-300 italic">Não vinculado</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.ativo ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-400'}`}>
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => abrirEditar(c)} className="text-xs text-primary-600 hover:underline">Editar</button>
                        <button onClick={() => abrirSenha(c)} className="text-xs text-warning-600 hover:underline">Senha</button>
                        <button onClick={() => abrirHistorico(c)} className="text-xs text-gray-500 hover:underline">Histórico</button>
                        <button onClick={() => handleToggleAtivo(c)} disabled={toggling === c.id} className={`text-xs hover:underline ${c.ativo ? 'text-danger-600' : 'text-success-600'}`}>
                          {toggling === c.id ? '...' : c.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar colaborador */}
      <Modal open={modal === 'criar'} onClose={() => setModal(null)} title="Novo colaborador"
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleCriar} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Criar colaborador'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Matrícula</label><input className="input" value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })} placeholder="Ex: C0001" required /></div>
          <div><label className="label">Nome completo</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required /></div>
          <div><label className="label">Cargo</label><input className="input" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} placeholder="Ex: Motorista" required /></div>
          <div><label className="label">Senha provisória</label><input type="password" className="input" value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} required /></div>
          <div>
            <label className="label">Veículo vinculado</label>
            <select className="input" value={form.veiculo_id} onChange={e => setForm({ ...form, veiculo_id: e.target.value })}>
              <option value="">Selecione um veículo</option>
              {veiculos.filter(v => v.situacao === 'Ativo').map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal editar */}
      <Modal open={modal === 'editar'} onClose={() => setModal(null)} title={`Editar — ${selecionado?.nome}`}
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleEditar} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Nome</label><input className="input" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div><label className="label">Cargo</label><input className="input" value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} /></div>
          <div>
            <label className="label">Veículo vinculado</label>
            <select className="input" value={form.veiculo_id} onChange={e => setForm({ ...form, veiculo_id: e.target.value })}>
              <option value="">Nenhum</option>
              {veiculos.filter(v => v.situacao === 'Ativo').map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Modal senha */}
      <Modal open={modal === 'senha'} onClose={() => setModal(null)} title={`Redefinir senha — ${selecionado?.nome}`}
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleRedefinirSenha} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Redefinir'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Nova senha provisória</label><input type="password" className="input" value={senhaForm.nova_senha} onChange={e => setSenhaForm({ ...senhaForm, nova_senha: e.target.value })} required /></div>
          <div><label className="label">Observação (opcional)</label><input className="input" value={senhaForm.observacao} onChange={e => setSenhaForm({ ...senhaForm, observacao: e.target.value })} placeholder="Motivo da redefinição" /></div>
          <p className="text-xs text-gray-400">O colaborador será obrigado a trocar a senha no próximo login.</p>
        </div>
      </Modal>

      {/* Modal histórico senha */}
      <Modal open={modal === 'historico'} onClose={() => setModal(null)} title={`Histórico de senhas — ${selecionado?.nome}`}>
        {historico.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Nenhuma redefinição registrada.</p>
        ) : (
          <div className="space-y-2">
            {historico.map(h => (
              <div key={h.id} className="flex justify-between text-sm border-b pb-2">
                <span className="text-gray-600">{formatDateTime(h.redefinida_em)}</span>
                <span className="text-gray-400 italic">{h.observacao || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
