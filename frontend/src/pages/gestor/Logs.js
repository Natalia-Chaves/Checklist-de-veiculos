import React, { useEffect, useState } from 'react';
import { listarLogs } from '../../services/api';
import { PageLoader, EmptyState, ErrorState, formatDateTime } from '../../components/shared';
import { LogIn, ClipboardList, UserPlus, KeyRound, UserCog, Zap, Search, RefreshCw } from 'lucide-react';

const ICONS = {
  login: LogIn,
  checklist: ClipboardList,
  colaborador_criado: UserPlus,
  senha_redefinida: KeyRound,
  perfil_atualizado: UserCog,
  acao: Zap,
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);

  const carregar = () => {
    setLoading(true); setErro(false);
    listarLogs().then(r => setLogs(r.data)).catch(() => setErro(true)).finally(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  if (loading) return <PageLoader />;
  if (erro) return <ErrorState message="Erro ao carregar logs." onRetry={carregar} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Logs de Atividade</h1>
        <button onClick={carregar} className="btn-secondary text-sm flex items-center gap-1.5"><RefreshCw size={14} /> Atualizar</button>
      </div>

      {logs.length === 0 ? <EmptyState icon={<Search size={48} />} title="Nenhum log registrado" /> : (
        <div className="card p-0 overflow-hidden">
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <span className="mt-0.5 text-gray-400">
                  {React.createElement(ICONS[log.acao] || Zap, { size: 18 })}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">{log.descricao}</p>
                  <div className="flex gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{formatDateTime(log.criado_em)}</span>
                    {log.ip && <span className="text-xs text-gray-300">IP: {log.ip}</span>}
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-300 bg-gray-50 px-2 py-0.5 rounded">{log.acao}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
