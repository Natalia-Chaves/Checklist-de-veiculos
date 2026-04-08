import React, { useEffect, useState } from 'react';
import { getMeuVeiculo } from '../../services/api';
import { PageLoader } from '../../components/shared';
import { AlertCircle } from 'lucide-react';

function InfoRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 pr-4">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right">{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card space-y-0 divide-y divide-gray-50">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function MeuVeiculo() {
  const [veiculo, setVeiculo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    getMeuVeiculo()
      .then(r => setVeiculo(r.data))
      .catch(() => setErro('Nenhum veículo vinculado ao seu cadastro. Fale com o gestor.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  if (erro) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={48} className="text-danger-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">{erro}</h2>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="card bg-gradient-to-r from-primary-900 to-primary-700 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-300 text-xs uppercase tracking-wide font-medium">Meu Veículo</p>
            <p className="text-3xl font-bold mt-1">{veiculo.placa}</p>
            <p className="text-primary-200 text-sm mt-0.5">{veiculo.modelo} {veiculo.ano_modelo ? `(${veiculo.ano_modelo})` : ''}</p>
          </div>
          <div className="text-right">
            {veiculo.numero_frota && (
              <>
                <p className="text-xs text-primary-300">Nº Frota</p>
                <p className="text-xl font-semibold">{veiculo.numero_frota}</p>
              </>
            )}
            {veiculo.situacao && (
              <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                veiculo.situacao === 'Ativo' ? 'bg-success-500 text-white' : 'bg-gray-600 text-gray-200'
              }`}>{veiculo.situacao}</span>
            )}
          </div>
        </div>
      </div>

      <Section title="Identificação">
        <InfoRow label="Tipo" value={veiculo.tipo_veiculo} />
        <InfoRow label="Cor" value={veiculo.cor} />
        <InfoRow label="Ano de fabricação" value={veiculo.ano_fabricacao} />
        <InfoRow label="Ano do modelo" value={veiculo.ano_modelo} />
        <InfoRow label="Chassi" value={veiculo.chassi} />
        <InfoRow label="Renavam" value={veiculo.renavam} />
        <InfoRow label="Tração 4x4" value={veiculo.tracao_4x4 ? 'Sim' : null} />
      </Section>

      <Section title="Localização">
        <InfoRow label="Cidade" value={veiculo.cidade} />
        <InfoRow label="Estado" value={veiculo.estado} />
      </Section>

      <Section title="Quilometragem">
        <InfoRow label="KM atual" value={veiculo.km_atual != null ? veiculo.km_atual.toLocaleString('pt-BR') + ' km' : null} />
        <InfoRow label="Data do KM" value={veiculo.data_km_atual ? new Date(veiculo.data_km_atual + 'T00:00:00').toLocaleDateString('pt-BR') : null} />
      </Section>

      <Section title="Seguro">
        <InfoRow label="Seguradora" value={veiculo.seguradora} />
        <InfoRow label="Apólice" value={veiculo.apolice} />
        <InfoRow label="Tipo de seguro" value={veiculo.tipo_seguro} />
        <InfoRow label="Franquia" value={veiculo.franquia} />
      </Section>

      <Section title="Proprietário">
        <InfoRow label="Proprietário" value={veiculo.proprietario} />
      </Section>

      {veiculo.responsavel_manutencao && (
        <Section title="Responsável de manutenção">
          <InfoRow label="Nome" value={veiculo.responsavel_manutencao.nome} />
        </Section>
      )}
    </div>
  );
}
