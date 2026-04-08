import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChecklist, validarChecklist } from '../../services/api';
import { PageLoader, Badge, Modal, formatDate, formatDateTime } from '../../components/shared';
import { Camera, XCircle, CheckCircle } from 'lucide-react';

const PERGUNTAS_BASE = [
  { key: 'documentacao_em_dia', label: 'Documentação em dia?' },
  { key: 'equipamentos_obrigatorios', label: 'Equipamentos obrigatórios presentes?' },
  { key: 'avarias_visiveis', label: 'Existem avarias visíveis?' },
  { key: 'apto_para_uso', label: 'O veículo está apto para uso?' },
  { key: 'pneus_condicao_adequada', label: 'Os pneus aparentam condição adequada?' },
];

const PERGUNTAS_POR_TIPO = {
  'Caminhão': [
    { key: 'tacografo_funcionando', label: 'Tacógrafo funcionando?' },
    { key: 'luzes_sinalizacao_traseira', label: 'Luzes e sinalização traseira funcionando?' },
    { key: 'freio_estacionamento', label: 'Freio de estacionamento funcionando?' },
    { key: 'lona_amarracao', label: 'Lona/corda de amarração em boas condições?' },
    { key: 'extintor_validade', label: 'Extintor de incêndio dentro da validade?' },
  ],
  'Utilitário': [
    { key: 'cacamba_carga', label: 'Caçamba ou compartimento de carga em boas condições?' },
    { key: 'extintor_validade', label: 'Extintor de incêndio dentro da validade?' },
    { key: 'estepe_calibrado', label: 'Estepe em boas condições de uso e calibrado?' },
  ],
  'Carro': [
    { key: 'ar_condicionado', label: 'Ar-condicionado funcionando adequadamente?' },
    { key: 'cintos_seguranca', label: 'Cintos de segurança (todos) funcionando e sem rasgos?' },
    { key: 'estepe_calibrado', label: 'Estepe em boas condições de uso e calibrado?' },
  ],
};

function getPerguntas(checklist) {
  const tipo = (checklist?.veiculo?.tipo_veiculo || '').trim();
  const extras = PERGUNTAS_POR_TIPO[tipo] || [];
  const all = [...PERGUNTAS_BASE, ...extras];
  if (checklist?.respostas?.tracao_4x4_funcionando !== undefined) {
    all.push({ key: 'tracao_4x4_funcionando', label: 'Sistema de tração 4x4 funcionando?' });
  }
  return all;
}

const FOTOS_LABELS = { frente: 'Frente', lateral: 'Lateral', pneu: 'Pneu', interna: 'Parte Interna', painel: 'Painel' };

export default function ChecklistDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'aprovar' | 'reprovar'
  const [justificativa, setJustificativa] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const carregar = () => {
    setLoading(true);
    getChecklist(id).then(r => setChecklist(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, [id]);

  const handleValidar = async (decisao) => {
    if (decisao === 'reprovado' && !justificativa.trim()) { setErro('Justificativa obrigatória para reprovação'); return; }
    setSaving(true); setErro('');
    try {
      await validarChecklist(id, { decisao, justificativa: justificativa || null });
      setModal(null);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao validar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!checklist) return null;

  const fotos = checklist.fotos || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/gestor/checklists')} className="text-gray-400 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Checklist #{checklist.id}</h1>
          <p className="text-sm text-gray-500">{formatDate(checklist.data_checklist)}</p>
        </div>
        <Badge status={checklist.status} />
      </div>

      {/* Info */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Informações gerais</h2>
          {[
            ['Placa', checklist.veiculo?.placa],
            ['Modelo', checklist.veiculo?.modelo],
            ['Colaborador', checklist.colaborador?.nome],
            ['Matrícula', checklist.colaborador?.matricula],
            ['CPF', checklist.colaborador?.cpf],
            ['KM atual', `${checklist.km_atual?.toLocaleString('pt-BR')} km`],
            ['Enviado em', formatDateTime(checklist.criado_em)],
          ].filter(([, v]) => v).map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-gray-500">{l}</span>
              <span className="font-medium text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        {/* Perguntas */}
        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-700">Perguntas Sim/Não</h2>
          {getPerguntas(checklist).map(({ key, label }) => {
            const resp = checklist.respostas?.[key];
            return (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={`font-semibold ${resp ? 'text-success-600' : 'text-danger-600'}`}>
                  {resp ? 'Sim' : 'Não'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observação */}
      {checklist.observacao && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-2">Observação do colaborador</h2>
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{checklist.observacao}</p>
        </div>
      )}

      {/* Fotos */}
      <div className="card">
        <h2 className="font-semibold text-gray-700 mb-4">Fotos ({fotos.length}/5)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.keys(FOTOS_LABELS).map(tipo => {
            const foto = fotos.find(f => f.tipo === tipo);
            return (
              <div key={tipo} className="space-y-1">
                <p className="text-xs font-medium text-gray-500 text-center">{FOTOS_LABELS[tipo]}</p>
                {foto ? (
                  <button onClick={() => setFotoAmpliada(foto)} className="w-full aspect-square rounded-lg overflow-hidden border-2 border-success-200 hover:opacity-90 transition-opacity">
                    <img src={`/uploads/${foto.caminho_arquivo.split('/').slice(-2).join('/')}`} alt={tipo} className="w-full h-full object-cover" />
                  </button>
                ) : (
                  <div className="aspect-square rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Camera size={24} className="text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Validação existente */}
      {checklist.validacao && (
        <div className={`card border-2 ${checklist.status === 'aprovado' ? 'border-green-200 bg-success-50' : 'border-red-200 bg-danger-50'}`}>
          <h2 className="font-semibold text-gray-700 mb-2">Resultado da validação</h2>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Decisão:</span>{' '}
            <Badge status={checklist.status} />
          </p>
          {checklist.validacao.justificativa && (
            <p className="text-sm text-gray-600 mt-2">
              <span className="font-medium">Justificativa:</span> {checklist.validacao.justificativa}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Validado em {formatDateTime(checklist.validacao.validado_em)}
          </p>
        </div>
      )}

      {/* Botões de validação */}
      {checklist.status === 'pendente' && (
        <div className="flex gap-3">
          <button onClick={() => { setModal('reprovar'); setJustificativa(''); setErro(''); }} className="btn-danger flex items-center gap-2">
            <XCircle size={16} /> Reprovar
          </button>
          <button onClick={() => { setModal('aprovar'); setErro(''); }} className="btn-success flex items-center gap-2">
            <CheckCircle size={16} /> Aprovar
          </button>
        </div>
      )}

      {/* Modal aprovar */}
      <Modal open={modal === 'aprovar'} onClose={() => setModal(null)} title="Confirmar aprovação"
        footer={<>
          <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => handleValidar('aprovado')} className="btn-success" disabled={saving}>
            {saving ? 'Salvando...' : 'Confirmar aprovação'}
          </button>
        </>}
      >
        <p className="text-gray-600">Deseja aprovar o checklist <strong>#{checklist.id}</strong>?</p>
      </Modal>

      {/* Modal reprovar */}
      <Modal open={modal === 'reprovar'} onClose={() => setModal(null)} title="Reprovar checklist"
        footer={<>
          <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
          <button onClick={() => handleValidar('reprovado')} className="btn-danger" disabled={saving}>
            {saving ? 'Salvando...' : 'Confirmar reprovação'}
          </button>
        </>}
      >
        {erro && <div className="bg-danger-50 text-danger-600 border border-red-200 rounded-lg p-3 text-sm mb-4">{erro}</div>}
        <div>
          <label className="label">Justificativa <span className="text-danger-600">*</span></label>
          <textarea className="input" rows={4} placeholder="Descreva o motivo da reprovação..." value={justificativa} onChange={e => setJustificativa(e.target.value)} />
        </div>
      </Modal>

      {/* Modal foto ampliada */}
      {fotoAmpliada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setFotoAmpliada(null)}>
          <img src={`/uploads/${fotoAmpliada.caminho_arquivo.split('/').slice(-2).join('/')}`} alt={fotoAmpliada.tipo} className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
