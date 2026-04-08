import React, { useEffect, useState } from 'react';
import { downloadExcel, downloadPdf, listarVeiculos, listarColaboradores } from '../../services/api';
import { PageLoader } from '../../components/shared';
import { FileSpreadsheet, FileText } from 'lucide-react';

function baixarBlob(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nome; a.click();
  URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const [veiculos, setVeiculos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [filtros, setFiltros] = useState({ data_inicio: '', data_fim: '', veiculo_id: '', colaborador_id: '', status: '' });
  const dataInvalida = filtros.data_inicio && filtros.data_fim && filtros.data_fim < filtros.data_inicio;

  useEffect(() => {
    Promise.all([listarVeiculos(), listarColaboradores()])
      .then(([v, col]) => { setVeiculos(v.data); setColaboradores(col.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (tipo) => {
    setDownloading(tipo);
    const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
    try {
      const r = tipo === 'excel' ? await downloadExcel(params) : await downloadPdf(params);
      baixarBlob(r.data, tipo === 'excel' ? 'relatorio_frota.xlsx' : 'relatorio_frota.pdf');
    } finally { setDownloading(null); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-700">Gerar relatório</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="label">De</label><input type="date" className="input" value={filtros.data_inicio} onChange={e => setFiltros({ ...filtros, data_inicio: e.target.value })} /></div>
          <div><label className="label">Até</label><input type="date" className={`input ${dataInvalida ? 'border-red-400 ring-1 ring-red-300' : ''}`} value={filtros.data_fim} onChange={e => setFiltros({ ...filtros, data_fim: e.target.value })} /></div>
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
            <label className="label">Status</label>
            <select className="input" value={filtros.status} onChange={e => setFiltros({ ...filtros, status: e.target.value })}>
              <option value="">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="reprovado">Reprovado</option>
            </select>
          </div>
        </div>
        {dataInvalida && <p className="text-xs text-danger-600 mt-1">A data final não pode ser anterior à data inicial.</p>}
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleDownload('excel')} className="btn-success flex items-center gap-2" disabled={!!downloading || dataInvalida}>
            {downloading === 'excel' ? 'Gerando...' : <><FileSpreadsheet size={15} className="inline mr-1" />Baixar Excel</>}
          </button>
          <button onClick={() => handleDownload('pdf')} className="btn-danger flex items-center gap-2" disabled={!!downloading || dataInvalida}>
            {downloading === 'pdf' ? 'Gerando...' : <><FileText size={15} className="inline mr-1" />Baixar PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}