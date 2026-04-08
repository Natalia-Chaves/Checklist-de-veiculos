import React, { useEffect, useState } from 'react';
import { meusChecklists } from '../../services/api';
import { PageLoader, Badge, EmptyState, formatDate, formatDateTime } from '../../components/shared';
import { CheckCircle, XCircle, Clock, FolderOpen, Camera } from 'lucide-react';

const PERGUNTAS_LABELS = {
  documentacao_em_dia: 'Documentação em dia',
  equipamentos_obrigatorios: 'Equipamentos obrigatórios',
  avarias_visiveis: 'Avarias visíveis',
  apto_para_uso: 'Apto para uso',
  pneus_condicao_adequada: 'Pneus em condição adequada',
  tacografo_funcionando: 'Tacógrafo funcionando',
  luzes_sinalizacao_traseira: 'Luzes e sinalização traseira',
  freio_estacionamento: 'Freio de estacionamento',
  lona_amarracao: 'Lona/corda de amarração',
  extintor_validade: 'Extintor dentro da validade',
  cacamba_carga: 'Caçamba/compartimento de carga',
  estepe_calibrado: 'Estepe calibrado',
  ar_condicionado: 'Ar-condicionado',
  cintos_seguranca: 'Cintos de segurança',
  tracao_4x4_funcionando: 'Tração 4x4 funcionando',
  nivel_combustivel: 'Nível de combustível',
};

const FOTOS_LABELS = { frente: 'Frente', lateral: 'Lateral', pneu: 'Pneu', interna: 'Interna', painel: 'Painel' };

export default function MeusChecklists() {
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  useEffect(() => {
    meusChecklists().then(r => setChecklists(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (checklists.length === 0) {
    return <EmptyState icon={<FolderOpen size={48} />} title="Nenhum checklist enviado ainda" description="Seu histórico aparecerá aqui após o primeiro envio." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Meus Checklists</h1>
        <span className="text-sm text-gray-400">{checklists.length} registros</span>
      </div>

      {checklists.map(c => {
        const aberto = expandido === c.id;
        return (
          <div key={c.id} className={`card p-0 overflow-hidden border-2 transition-colors ${
            c.status === 'aprovado' ? 'border-green-100' :
            c.status === 'reprovado' ? 'border-red-100' : 'border-yellow-100'
          }`}>
            {/* Header do card */}
            <button
              type="button"
              onClick={() => setExpandido(aberto ? null : c.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {formatDate(c.data_checklist)}
                  </p>
                  <p className="text-xs text-gray-400">{c.km_atual?.toLocaleString('pt-BR')} km — #{c.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={c.status} />
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${aberto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Conteúdo expandido */}
            {aberto && (
              <div className="border-t border-gray-100 p-4 space-y-4">

                {/* Resultado validação */}
                {c.validacao && (
                  <div className={`rounded-xl p-3 text-sm ${c.status === 'aprovado' ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                    <p className="font-semibold flex items-center gap-1.5">
                      {c.status === 'aprovado'
                        ? <><CheckCircle size={14} />Aprovado pelo gestor</>
                        : <><XCircle size={14} />Reprovado pelo gestor</>}
                    </p>
                    {c.validacao.justificativa && (
                      <p className="mt-1 text-xs opacity-80">{c.validacao.justificativa}</p>
                    )}
                    <p className="text-xs mt-1 opacity-60">
                      {formatDateTime(c.validacao.validado_em)}
                    </p>
                  </div>
                )}

                {c.status === 'pendente' && (
                  <div className="bg-warning-50 rounded-xl p-3 text-sm text-warning-600">
                    <span className="flex items-center gap-1.5"><Clock size={14} />Aguardando validação do gestor</span>
                  </div>
                )}

                {/* Perguntas */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Inspeção</p>
                  <div className="space-y-1.5">
                    {Object.entries(c.respostas || {}).map(([key, valor]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{PERGUNTAS_LABELS[key] || key}</span>
                        {typeof valor === 'string' ? (
                          <span className="font-semibold text-xs text-gray-700">{valor}</span>
                        ) : (
                          <span className={`font-semibold text-xs ${valor ? 'text-success-600' : 'text-danger-600'}`}>
                            {valor ? 'Sim' : 'Não'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observação */}
                {c.observacao && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observação</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{c.observacao}</p>
                  </div>
                )}

                {/* Fotos */}
                {c.fotos?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Fotos ({c.fotos.length}/5)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {Object.keys(FOTOS_LABELS).map(tipo => {
                        const foto = c.fotos.find(f => f.tipo === tipo);
                        return (
                          <div key={tipo} className="space-y-1">
                            <p className="text-xs text-gray-400 text-center">{FOTOS_LABELS[tipo]}</p>
                            {foto ? (
                              <button
                                type="button"
                                onClick={() => setFotoAmpliada(foto)}
                                className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={`/uploads/${foto.caminho_arquivo.split('/').slice(-2).join('/')}`}
                                  alt={tipo}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                                <Camera size={16} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-300 text-right">
                  Enviado em {formatDateTime(c.criado_em)}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setFotoAmpliada(null)}
        >
          <img
            src={`/uploads/${fotoAmpliada.caminho_arquivo.split('/').slice(-2).join('/')}`}
            alt={fotoAmpliada.tipo}
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
}
