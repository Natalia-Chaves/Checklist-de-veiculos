import React, { useEffect, useState, useRef } from 'react';
import { getMeuVeiculo, enviarChecklist } from '../../services/api';
import { PageLoader } from '../../components/shared';
import { Car, Truck, Gauge, Armchair, LayoutDashboard, Camera, CalendarDays, ClipboardCheck, MessageSquare, Send, AlertCircle, CheckCircle2, Check, AlertTriangle } from 'lucide-react';

const FOTOS = [
  { key: 'frente',  label: 'Frente do veículo',  icon: Car },
  { key: 'lateral', label: 'Lateral do veículo',  icon: Truck },
  { key: 'pneu',    label: 'Pneu',                icon: Gauge },
  { key: 'interna', label: 'Parte interna',        icon: Armchair },
  { key: 'painel',  label: 'Painel',               icon: LayoutDashboard },
];

const PERGUNTAS_BASE = [
  { key: 'documentacao_em_dia',       label: 'Documentação em dia?' },
  { key: 'equipamentos_obrigatorios', label: 'Equipamentos obrigatórios presentes?' },
  { key: 'avarias_visiveis',          label: 'Existem avarias visíveis?' },
  { key: 'apto_para_uso',             label: 'O veículo está apto para uso?' },
  { key: 'pneus_condicao_adequada',   label: 'Os pneus aparentam condição adequada?' },
];

const PERGUNTAS_POR_TIPO = {
  'Caminhão': [
    { key: 'tacografo_funcionando',      label: 'Tacógrafo funcionando?' },
    { key: 'luzes_sinalizacao_traseira', label: 'Luzes e sinalização traseira funcionando?' },
    { key: 'freio_estacionamento',       label: 'Freio de estacionamento funcionando?' },
    { key: 'lona_amarracao',             label: 'Lona/corda de amarração em boas condições?' },
    { key: 'extintor_validade',          label: 'Extintor de incêndio dentro da validade?' },
  ],
  'Utilitário': [
    { key: 'cacamba_carga',     label: 'Caçamba ou compartimento de carga em boas condições?' },
    { key: 'extintor_validade', label: 'Extintor de incêndio dentro da validade?' },
    { key: 'estepe_calibrado',  label: 'Estepe em boas condições de uso e calibrado?' },
  ],
  'Carro': [
    { key: 'ar_condicionado',  label: 'Ar-condicionado funcionando adequadamente?' },
    { key: 'cintos_seguranca', label: 'Cintos de segurança (todos) funcionando e sem rasgos?' },
    { key: 'estepe_calibrado', label: 'Estepe em boas condições de uso e calibrado?' },
  ],
};

const PERGUNTA_TRACAO_4X4 = { key: 'tracao_4x4_funcionando', label: 'Sistema de tração 4x4 funcionando?' };

function getPerguntas(veiculo) {
  const tipo = (veiculo?.tipo_veiculo || '').trim();
  const extras = PERGUNTAS_POR_TIPO[tipo] || [];
  const all = [...PERGUNTAS_BASE, ...extras];
  if (veiculo?.tracao_4x4 === true) all.push(PERGUNTA_TRACAO_4X4);
  return all;
}

function FotoUpload({ label, icon: Icon, value, onChange }) {
  const inputRef = useRef();
  const preview = value ? URL.createObjectURL(value) : null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-600 text-center flex items-center justify-center gap-1"><Icon size={13} /> {label}</p>
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className={`relative w-full aspect-square rounded-xl border-2 overflow-hidden transition-all ${
          value
            ? 'border-success-200 hover:border-success-400'
            : 'border-dashed border-gray-300 hover:border-primary-400 bg-gray-50'
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Trocar</span>
            </div>
            <div className="absolute top-1 right-1 bg-success-500 text-white rounded-full w-5 h-5 flex items-center justify-center"><Check size={11} strokeWidth={3} /></div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 p-2">
          <Camera size={22} className="text-gray-300" />
            <span className="text-xs text-gray-400 text-center">Toque para adicionar</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => onChange(e.target.files[0] || null)}
      />
    </div>
  );
}

export default function NovoChecklist() {
  const [veiculo, setVeiculo] = useState(null);
  const [loadingVeiculo, setLoadingVeiculo] = useState(true);
  const [erroVeiculo, setErroVeiculo] = useState('');
  const [fotos, setFotos] = useState({ frente: null, lateral: null, pneu: null, interna: null, painel: null });
  const [respostas, setRespostas] = useState({});
  const [km, setKm] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [avisos, setAvisos] = useState({ km: false, fotos: false });

  useEffect(() => {
    getMeuVeiculo()
      .then(r => {
        setVeiculo(r.data);
        setRespostas(Object.fromEntries(getPerguntas(r.data).map(p => [p.key, null])));
      })
      .catch(() => setErroVeiculo('Nenhum veículo vinculado ao seu cadastro. Fale com o gestor.'))
      .finally(() => setLoadingVeiculo(false));
  }, []);

  const perguntas = veiculo ? getPerguntas(veiculo) : [];
  const fotosOk = FOTOS.every(f => fotos[f.key] !== null);
  const respostasOk = perguntas.length > 0 && perguntas.every(p => respostas[p.key] !== null && respostas[p.key] !== undefined);
  const kmOk = km && parseInt(km) > 0;
  const kmAbaixoDoAtual = veiculo?.km_atual != null && km !== '' && parseInt(km) < veiculo.km_atual;

  const handleSetKm = (val) => {
    setKm(val);
    if (veiculo?.km_atual != null && val !== '' && parseInt(val) < veiculo.km_atual) {
      setAvisos(a => ({ ...a, km: true }));
    } else {
      setAvisos(a => ({ ...a, km: false }));
    }
  };

  const handleSetFoto = (key, value) => {
    const novas = { ...fotos, [key]: value };
    setFotos(novas);
    if (FOTOS.every(f => novas[f.key] !== null)) {
      setAvisos(a => ({ ...a, fotos: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!fotosOk) { setAvisos(a => ({ ...a, fotos: true })); setErro('Todas as 5 fotos são obrigatórias.'); return; }
    if (!respostasOk) { setErro('Responda todas as perguntas antes de enviar.'); return; }
    if (!kmOk) { setErro('Informe o KM atual do veículo.'); return; }
    if (kmAbaixoDoAtual) { setErro(`KM informado é inferior ao registrado no veículo (${veiculo.km_atual.toLocaleString('pt-BR')} km).`); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('data_checklist', data);
      fd.append('km_atual', km);
      fd.append('respostas', JSON.stringify(respostas));
      if (observacao) fd.append('observacao', observacao);

      FOTOS.forEach(f => fd.append(f.key, fotos[f.key]));

      await enviarChecklist(fd);
      setSucesso(true);
      setFotos({ frente: null, lateral: null, pneu: null, interna: null, painel: null });
      setRespostas(Object.fromEntries(getPerguntas(veiculo).map(p => [p.key, null])));
      setKm('');
      setObservacao('');
    } catch (err) {
      setErro(err.response?.data?.detail || 'Erro ao enviar checklist. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingVeiculo) return <PageLoader />;

  if (erroVeiculo) {
    return (
      <div className="text-center py-16">
      <AlertCircle size={48} className="text-danger-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">{erroVeiculo}</h2>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="text-center py-16 space-y-4">
        <CheckCircle2 size={56} className="text-success-500 mx-auto" />
        <h2 className="text-2xl font-bold text-success-600">Checklist enviado!</h2>
        <p className="text-gray-500">Seu checklist foi registrado e aguarda validação do gestor.</p>
        <button onClick={() => setSucesso(false)} className="btn-primary px-8">
          Fazer novo checklist
        </button>
      </div>
    );
  }

  const progresso = [fotosOk, respostasOk, kmOk].filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Veículo */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-300 text-xs uppercase tracking-wide font-medium">Seu veículo</p>
            <p className="text-2xl font-bold mt-1">{veiculo.placa}</p>
            <p className="text-primary-200 text-sm">{veiculo.modelo} — {veiculo.tipo_veiculo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-300">Nº Frota</p>
            <p className="text-lg font-semibold">{veiculo.numero_frota}</p>
            <p className="text-xs text-primary-300 mt-1">{veiculo.cor}</p>
          </div>
        </div>
      </div>

      {/* Progresso */}
      <div className="card py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">Progresso do checklist</p>
          <p className="text-xs font-semibold text-primary-600">{progresso}/3 etapas</p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${(progresso / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Data e KM */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><CalendarDays size={16} /> Informações gerais</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Data do checklist</label>
            <input type="date" className="input" value={data} onChange={e => setData(e.target.value)} required max={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="label">KM atual <span className="text-danger-600">*</span></label>
            <input
              type="number"
              className={`input ${kmAbaixoDoAtual ? 'border-danger-400 bg-danger-50' : ''}`}
              placeholder={veiculo?.km_atual != null ? `Mínimo: ${veiculo.km_atual.toLocaleString('pt-BR')}` : 'Ex: 85000'}
              value={km}
              onChange={e => handleSetKm(e.target.value)}
              min={veiculo?.km_atual ?? 0}
              required
            />
            {avisos.km && (
              <p className="text-xs text-danger-600 bg-danger-50 rounded-lg px-3 py-2 flex items-center gap-1.5 mt-1">
                <AlertTriangle size={13} /> KM informado é inferior ao último registrado ({veiculo.km_atual.toLocaleString('pt-BR')} km).
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fotos */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><Camera size={16} /> Fotos obrigatórias</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${fotosOk ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'}`}>
            {Object.values(fotos).filter(Boolean).length}/5
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {FOTOS.slice(0, 3).map(f => (
            <FotoUpload key={f.key} label={f.label} icon={f.icon} value={fotos[f.key]} onChange={v => handleSetFoto(f.key, v)} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FOTOS.slice(3).map(f => (
            <FotoUpload key={f.key} label={f.label} icon={f.icon} value={fotos[f.key]} onChange={v => handleSetFoto(f.key, v)} />
          ))}
        </div>
        {!fotosOk && avisos.fotos && <p className="text-xs text-danger-600 bg-danger-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertTriangle size={13} /> Adicione todas as 5 fotos para prosseguir.</p>}
        {!fotosOk && !avisos.fotos && <p className="text-xs text-warning-600 bg-warning-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertTriangle size={13} /> Todas as 5 fotos são obrigatórias para enviar.</p>}
      </div>

      {/* Perguntas */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2"><ClipboardCheck size={16} /> Inspeção</h2>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${respostasOk ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'}`}>
            {perguntas.filter(p => respostas[p.key] !== null && respostas[p.key] !== undefined).length}/{perguntas.length}
          </span>
        </div>

        {perguntas.map(p => (
          <div key={p.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-700 flex-1 pr-4">{p.label}</p>
            <div className="flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setRespostas({ ...respostas, [p.key]: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  respostas[p.key] === true
                    ? 'bg-success-500 text-white border-success-500 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-success-300'
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setRespostas({ ...respostas, [p.key]: false })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  respostas[p.key] === false
                    ? 'bg-danger-500 text-white border-danger-500 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-danger-300'
                }`}
              >
                Não
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Observação */}
      <div className="card space-y-2">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2"><MessageSquare size={16} /> Observação livre</h2>
        <textarea
          className="input"
          rows={3}
          placeholder="Alguma ocorrência, anomalia ou informação adicional sobre o veículo? (opcional)"
          value={observacao}
          onChange={e => setObservacao(e.target.value)}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right">{observacao.length}/500</p>
      </div>

      {/* Erro e Submit */}
      {erro && (
        <div className="bg-danger-50 border border-red-200 text-danger-600 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle size={14} className="inline mr-1" /> {erro}
        </div>
      )}

      <button
        type="submit"
        disabled={saving || !fotosOk || !respostasOk || !kmOk}
        className="btn-primary w-full py-4 text-base"
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Enviando checklist...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Send size={16} />
            Enviar checklist
          </span>
        )}
      </button>

      <div className="h-6" />
    </form>
  );
}