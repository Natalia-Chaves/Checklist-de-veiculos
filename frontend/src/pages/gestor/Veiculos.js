import React, { useEffect, useState } from 'react';
import { listarVeiculos, listarResponsaveis, criarVeiculo, atualizarVeiculo, historicoVeiculo } from '../../services/api';
import { PageLoader, Modal, EmptyState, Badge, formatDate } from '../../components/shared';
import { Truck } from 'lucide-react';

const NOVO_INIT = {
  placa: '', modelo: '', tipo_veiculo: '', cidade: '', estado: '', situacao: 'Ativo',
  responsavel_manutencao_id: '', seguradora: '', apolice: '', inclusao: '', proprietario: '',
  tipo_proprietario: '', cc: '', ano_fabricacao: '', ano_modelo: '', numero_frota: '',
  chassi: '', renavam: '', tipo_seguro: '', franquia: '', km_atual: '', data_km_atual: ''
};

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [novoVeiculo, setNovoVeiculo] = useState(NOVO_INIT);
  const [editForm, setEditForm] = useState({
    modelo: '', tipo_veiculo: '', cidade: '', estado: '', situacao: '', responsavel_manutencao_id: '',
    seguradora: '', apolice: '', inclusao: '', proprietario: '', tipo_proprietario: '', cc: '',
    ano_fabricacao: '', ano_modelo: '', numero_frota: '', chassi: '', renavam: '',
    tipo_seguro: '', franquia: '', km_atual: '', data_km_atual: ''
  });
  const [filtros, setFiltros] = useState({ placa: '', modelo: '', tipo: '', motorista: '', cidade: '', situacao: '', responsavel_id: '' });
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = () => {
    setLoading(true);
    Promise.all([listarVeiculos(), listarResponsaveis()])
      .then(([v, r]) => { setVeiculos(v.data); setResponsaveis(r.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const veiculosFiltrados = veiculos.filter(v => {
    const f = filtros;
    if (f.placa && !v.placa?.toLowerCase().includes(f.placa.toLowerCase())) return false;
    if (f.modelo && !v.modelo?.toLowerCase().includes(f.modelo.toLowerCase())) return false;
    if (f.tipo && v.tipo_veiculo !== f.tipo) return false;
    if (f.motorista && !v.motorista_nome?.toLowerCase().includes(f.motorista.toLowerCase())) return false;
    if (f.cidade && !v.cidade?.toLowerCase().includes(f.cidade.toLowerCase())) return false;
    if (f.situacao && v.situacao !== f.situacao) return false;
    if (f.responsavel_id && String(v.responsavel_manutencao_id) !== f.responsavel_id) return false;
    return true;
  });

  const abrirHistorico = async (v) => {
    setSelecionado(v);
    const r = await historicoVeiculo(v.id);
    setHistorico(r.data);
    setModal('historico');
  };

  const abrirEditar = (v) => {
    setSelecionado(v);
    setEditForm({
      modelo: v.modelo || '',
      tipo_veiculo: v.tipo_veiculo || '',
      cidade: v.cidade || '',
      estado: v.estado || '',
      situacao: v.situacao || '',
      responsavel_manutencao_id: v.responsavel_manutencao_id || '',
      seguradora: v.seguradora || '',
      apolice: v.apolice || '',
      inclusao: v.inclusao || '',
      proprietario: v.proprietario || '',
      tipo_proprietario: v.tipo_proprietario || '',
      cc: v.cc || '',
      ano_fabricacao: v.ano_fabricacao ?? '',
      ano_modelo: v.ano_modelo ?? '',
      numero_frota: v.numero_frota || '',
      chassi: v.chassi || '',
      renavam: v.renavam || '',
      tipo_seguro: v.tipo_seguro || '',
      franquia: v.franquia || '',
      km_atual: v.km_atual ?? '',
      data_km_atual: v.data_km_atual || '',
    });
    setErro(''); setModal('editar');
  };

  const abrirDetalhes = (v) => { setSelecionado(v); setModal('detalhes'); };

  const handleCriarVeiculo = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await criarVeiculo({
        ...novoVeiculo,
        responsavel_manutencao_id: novoVeiculo.responsavel_manutencao_id || null,
        ano_fabricacao: novoVeiculo.ano_fabricacao ? parseInt(novoVeiculo.ano_fabricacao) : null,
        ano_modelo: novoVeiculo.ano_modelo ? parseInt(novoVeiculo.ano_modelo) : null,
        km_atual: novoVeiculo.km_atual ? parseInt(novoVeiculo.km_atual) : null,
        inclusao: novoVeiculo.inclusao || null,
        data_km_atual: novoVeiculo.data_km_atual || null,
      });
      setModal(null);
      setNovoVeiculo(NOVO_INIT);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao criar veículo');
    } finally { setSaving(false); }
  };

  const handleEditar = async (e) => {
    e.preventDefault(); setSaving(true); setErro('');
    try {
      await atualizarVeiculo(selecionado.id, {
        ...editForm,
        responsavel_manutencao_id: editForm.responsavel_manutencao_id || null,
        ano_fabricacao: editForm.ano_fabricacao !== '' ? parseInt(editForm.ano_fabricacao) : null,
        ano_modelo: editForm.ano_modelo !== '' ? parseInt(editForm.ano_modelo) : null,
        km_atual: editForm.km_atual !== '' ? parseInt(editForm.km_atual) : null,
        inclusao: editForm.inclusao || null,
        data_km_atual: editForm.data_km_atual || null,
      });
      setModal(null); carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao atualizar veículo');
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  const TIPOS = ['Carro', 'Utilitário', 'Caminhão'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Veículos</h1>
        <button onClick={() => { setNovoVeiculo(NOVO_INIT); setErro(''); setModal('veiculo'); }} className="btn-primary text-sm">
          + Novo Veículo
        </button>
      </div>

      {veiculosFiltrados.length === 0 && !Object.values(filtros).some(Boolean) ? <EmptyState icon={<Truck size={48} />} title="Nenhum veículo encontrado" /> : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Placa', 'Modelo', 'Tipo', 'Motorista', 'Cidade', 'Situação', 'Resp. Manutenção', 'Ações'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
              <tr className="border-b bg-white">
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.placa} onChange={e => setFiltros({ ...filtros, placa: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.modelo} onChange={e => setFiltros({ ...filtros, modelo: e.target.value })} /></td>
                <td className="px-2 py-1.5">
                  <select className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400" value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
                    <option value="">Todos</option>
                    {TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.motorista} onChange={e => setFiltros({ ...filtros, motorista: e.target.value })} /></td>
                <td className="px-2 py-1.5"><input className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-400" placeholder="Filtrar..." value={filtros.cidade} onChange={e => setFiltros({ ...filtros, cidade: e.target.value })} /></td>
                <td className="px-2 py-1.5">
                  <select className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400" value={filtros.situacao} onChange={e => setFiltros({ ...filtros, situacao: e.target.value })}>
                    <option value="">Todos</option>
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <select className="w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400" value={filtros.responsavel_id} onChange={e => setFiltros({ ...filtros, responsavel_id: e.target.value })}>
                    <option value="">Todos</option>
                    {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {veiculosFiltrados.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">{v.placa}</td>
                  <td className="px-4 py-3 text-gray-600">{v.modelo}</td>
                  <td className="px-4 py-3 text-gray-500">{v.tipo_veiculo}</td>
                  <td className="px-4 py-3 text-gray-600">{v.motorista_nome}</td>
                  <td className="px-4 py-3 text-gray-500">{v.cidade}/{v.estado}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${v.situacao === 'Ativo' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-400'}`}>
                      {v.situacao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {v.responsavel_manutencao?.nome || <span className="italic text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => abrirDetalhes(v)} className="text-xs text-indigo-600 hover:underline">Detalhes</button>
                      <button onClick={() => abrirEditar(v)} className="text-xs text-primary-600 hover:underline">Editar</button>
                      <button onClick={() => abrirHistorico(v)} className="text-xs text-gray-500 hover:underline">Histórico</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal novo veículo */}
      <Modal open={modal === 'veiculo'} onClose={() => setModal(null)} title="Novo Veículo"
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleCriarVeiculo} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Criar'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Placa <span className="text-danger-600">*</span></label><input className="input" value={novoVeiculo.placa} onChange={e => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value.toUpperCase() })} placeholder="Ex: ABC1D23" required /></div>
          <div><label className="label">Modelo</label><input className="input" value={novoVeiculo.modelo} onChange={e => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })} /></div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={novoVeiculo.tipo_veiculo} onChange={e => setNovoVeiculo({ ...novoVeiculo, tipo_veiculo: e.target.value })}>
              <option value="">Selecione</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Situação</label>
            <select className="input" value={novoVeiculo.situacao} onChange={e => setNovoVeiculo({ ...novoVeiculo, situacao: e.target.value })}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cidade</label><input className="input" value={novoVeiculo.cidade} onChange={e => setNovoVeiculo({ ...novoVeiculo, cidade: e.target.value })} /></div>
            <div><label className="label">Estado (UF)</label><input className="input" maxLength={2} value={novoVeiculo.estado} onChange={e => setNovoVeiculo({ ...novoVeiculo, estado: e.target.value.toUpperCase() })} placeholder="SC" /></div>
          </div>
          <div>
            <label className="label">Responsável de Manutenção</label>
            <select className="input" value={novoVeiculo.responsavel_manutencao_id} onChange={e => setNovoVeiculo({ ...novoVeiculo, responsavel_manutencao_id: e.target.value })}>
              <option value="">Sem responsável</option>
              {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Nº Frota</label><input className="input" value={novoVeiculo.numero_frota} onChange={e => setNovoVeiculo({ ...novoVeiculo, numero_frota: e.target.value })} /></div>
            <div><label className="label">Ano Fabricação</label><input className="input" type="number" placeholder="2020" value={novoVeiculo.ano_fabricacao} onChange={e => setNovoVeiculo({ ...novoVeiculo, ano_fabricacao: e.target.value })} /></div>
            <div><label className="label">Ano Modelo</label><input className="input" type="number" placeholder="2021" value={novoVeiculo.ano_modelo} onChange={e => setNovoVeiculo({ ...novoVeiculo, ano_modelo: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Chassi</label><input className="input" value={novoVeiculo.chassi} onChange={e => setNovoVeiculo({ ...novoVeiculo, chassi: e.target.value })} /></div>
            <div><label className="label">Renavam</label><input className="input" value={novoVeiculo.renavam} onChange={e => setNovoVeiculo({ ...novoVeiculo, renavam: e.target.value })} /></div>
          </div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Proprietário</label><input className="input" value={novoVeiculo.proprietario} onChange={e => setNovoVeiculo({ ...novoVeiculo, proprietario: e.target.value })} /></div>
            <div><label className="label">Tipo de Proprietário</label><input className="input" value={novoVeiculo.tipo_proprietario} onChange={e => setNovoVeiculo({ ...novoVeiculo, tipo_proprietario: e.target.value })} /></div>
          </div>
          <div><label className="label">CC</label><input className="input" value={novoVeiculo.cc} onChange={e => setNovoVeiculo({ ...novoVeiculo, cc: e.target.value })} /></div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Seguradora</label><input className="input" value={novoVeiculo.seguradora} onChange={e => setNovoVeiculo({ ...novoVeiculo, seguradora: e.target.value })} /></div>
            <div><label className="label">Apólice</label><input className="input" value={novoVeiculo.apolice} onChange={e => setNovoVeiculo({ ...novoVeiculo, apolice: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Tipo de Seguro</label><input className="input" value={novoVeiculo.tipo_seguro} onChange={e => setNovoVeiculo({ ...novoVeiculo, tipo_seguro: e.target.value })} /></div>
            <div><label className="label">Franquia</label><input className="input" value={novoVeiculo.franquia} onChange={e => setNovoVeiculo({ ...novoVeiculo, franquia: e.target.value })} /></div>
            <div><label className="label">Data de Inclusão</label><input className="input" type="date" value={novoVeiculo.inclusao} onChange={e => setNovoVeiculo({ ...novoVeiculo, inclusao: e.target.value })} /></div>
          </div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">KM Atual</label><input className="input" type="number" value={novoVeiculo.km_atual} onChange={e => setNovoVeiculo({ ...novoVeiculo, km_atual: e.target.value })} /></div>
            <div><label className="label">Data do KM Atual</label><input className="input" type="date" value={novoVeiculo.data_km_atual} onChange={e => setNovoVeiculo({ ...novoVeiculo, data_km_atual: e.target.value })} /></div>
          </div>
        </div>
      </Modal>

      {/* Modal editar veículo */}
      <Modal open={modal === 'editar'} onClose={() => setModal(null)} title={`Editar — ${selecionado?.placa}`}
        footer={<><button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleEditar} className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button></>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div className="space-y-4">
          <div><label className="label">Modelo</label><input className="input" value={editForm.modelo} onChange={e => setEditForm({ ...editForm, modelo: e.target.value })} /></div>
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={editForm.tipo_veiculo} onChange={e => setEditForm({ ...editForm, tipo_veiculo: e.target.value })}>
              <option value="">Selecione</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Cidade</label><input className="input" value={editForm.cidade} onChange={e => setEditForm({ ...editForm, cidade: e.target.value })} /></div>
            <div><label className="label">Estado (UF)</label><input className="input" maxLength={2} value={editForm.estado} onChange={e => setEditForm({ ...editForm, estado: e.target.value.toUpperCase() })} /></div>
          </div>
          <div>
            <label className="label">Situação</label>
            <select className="input" value={editForm.situacao} onChange={e => setEditForm({ ...editForm, situacao: e.target.value })}>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className="label">Responsável de Manutenção</label>
            <select className="input" value={editForm.responsavel_manutencao_id} onChange={e => setEditForm({ ...editForm, responsavel_manutencao_id: e.target.value })}>
              <option value="">Sem responsável</option>
              {responsaveis.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Nº Frota</label><input className="input" value={editForm.numero_frota} onChange={e => setEditForm({ ...editForm, numero_frota: e.target.value })} /></div>
            <div><label className="label">Ano Fabricação</label><input className="input" type="number" value={editForm.ano_fabricacao} onChange={e => setEditForm({ ...editForm, ano_fabricacao: e.target.value })} /></div>
            <div><label className="label">Ano Modelo</label><input className="input" type="number" value={editForm.ano_modelo} onChange={e => setEditForm({ ...editForm, ano_modelo: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Chassi</label><input className="input" value={editForm.chassi} onChange={e => setEditForm({ ...editForm, chassi: e.target.value })} /></div>
            <div><label className="label">Renavam</label><input className="input" value={editForm.renavam} onChange={e => setEditForm({ ...editForm, renavam: e.target.value })} /></div>
          </div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Proprietário</label><input className="input" value={editForm.proprietario} onChange={e => setEditForm({ ...editForm, proprietario: e.target.value })} /></div>
            <div><label className="label">Tipo de Proprietário</label><input className="input" value={editForm.tipo_proprietario} onChange={e => setEditForm({ ...editForm, tipo_proprietario: e.target.value })} /></div>
          </div>
          <div><label className="label">CC</label><input className="input" value={editForm.cc} onChange={e => setEditForm({ ...editForm, cc: e.target.value })} /></div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Seguradora</label><input className="input" value={editForm.seguradora} onChange={e => setEditForm({ ...editForm, seguradora: e.target.value })} /></div>
            <div><label className="label">Apólice</label><input className="input" value={editForm.apolice} onChange={e => setEditForm({ ...editForm, apolice: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Tipo de Seguro</label><input className="input" value={editForm.tipo_seguro} onChange={e => setEditForm({ ...editForm, tipo_seguro: e.target.value })} /></div>
            <div><label className="label">Franquia</label><input className="input" value={editForm.franquia} onChange={e => setEditForm({ ...editForm, franquia: e.target.value })} /></div>
            <div><label className="label">Data de Inclusão</label><input className="input" type="date" value={editForm.inclusao} onChange={e => setEditForm({ ...editForm, inclusao: e.target.value })} /></div>
          </div>
          <hr className="border-gray-100 my-1" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">KM Atual</label><input className="input" type="number" value={editForm.km_atual} onChange={e => setEditForm({ ...editForm, km_atual: e.target.value })} /></div>
            <div><label className="label">Data do KM Atual</label><input className="input" type="date" value={editForm.data_km_atual} onChange={e => setEditForm({ ...editForm, data_km_atual: e.target.value })} /></div>
          </div>
        </div>
      </Modal>

      {/* Modal histórico */}
      <Modal open={modal === 'historico'} onClose={() => setModal(null)} title={`Histórico — ${selecionado?.placa}`}>
        {historico.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Nenhum checklist registrado para este veículo.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {historico.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-800">{formatDate(c.data_checklist)}</p>
                  <p className="text-xs text-gray-500">{c.km_atual?.toLocaleString('pt-BR')} km</p>
                </div>
                <Badge status={c.status} />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal detalhes */}
      <Modal open={modal === 'detalhes'} onClose={() => setModal(null)} title={`Detalhes — ${selecionado?.placa}`}>
        <div className="space-y-5 text-sm">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Identificação</p>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[['Placa', selecionado?.placa], ['Modelo', selecionado?.modelo], ['Tipo', selecionado?.tipo_veiculo], ['Cor', selecionado?.cor], ['Nº Frota', selecionado?.numero_frota], ['Situação', selecionado?.situacao], ['Ano Fabricação', selecionado?.ano_fabricacao], ['Ano Modelo', selecionado?.ano_modelo], ['Chassi', selecionado?.chassi], ['Renavam', selecionado?.renavam]].map(([l, v]) => (
                <div key={l}><dt className="text-xs text-gray-400">{l}</dt><dd className="font-medium text-gray-800">{v ?? '—'}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Proprietário</p>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[['Proprietário', selecionado?.proprietario], ['Tipo de Proprietário', selecionado?.tipo_proprietario], ['CC', selecionado?.cc]].map(([l, v]) => (
                <div key={l}><dt className="text-xs text-gray-400">{l}</dt><dd className="font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Seguro</p>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[['Seguradora', selecionado?.seguradora], ['Apólice', selecionado?.apolice], ['Tipo de Seguro', selecionado?.tipo_seguro], ['Franquia', selecionado?.franquia], ['Data de Inclusão', formatDate(selecionado?.inclusao)]].map(([l, v]) => (
                <div key={l}><dt className="text-xs text-gray-400">{l}</dt><dd className="font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Quilometragem</p>
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[['KM Atual', selecionado?.km_atual?.toLocaleString('pt-BR')], ['Data do KM', formatDate(selecionado?.data_km_atual)]].map(([l, v]) => (
                <div key={l}><dt className="text-xs text-gray-400">{l}</dt><dd className="font-medium text-gray-800">{v || '—'}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </Modal>
    </div>
  );
}
