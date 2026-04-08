import React, { useEffect } from 'react';

export function Badge({ status }) {
  const map = {
    pendente: 'badge-pendente',
    aprovado: 'badge-aprovado',
    reprovado: 'badge-reprovado',
  };
  const labels = { pendente: 'Pendente', aprovado: 'Aprovado', reprovado: 'Reprovado' };
  return <span className={map[status] || 'badge-pendente'}>{labels[status] || status}</span>;
}

export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-primary-600`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}

export function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-gray-300 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 border-t flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, color = 'blue', icon }) {
  const colors = {
    blue:   'bg-primary-50 text-primary-700 border-primary-100',
    green:  'bg-success-50 text-success-600 border-green-100',
    red:    'bg-danger-50 text-danger-600 border-red-100',
    yellow: 'bg-warning-50 text-warning-600 border-yellow-100',
    gray:   'bg-gray-50 text-gray-600 border-gray-100',
  };
  return (
    <div className={`card border-2 ${colors[color]} flex items-center gap-4`}>
      {icon && <div className="text-gray-400">{icon}</div>}
      <div>
        <p className="text-sm font-medium opacity-70">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Erro ao carregar dados.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-danger-400">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{message}</h3>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 btn-primary text-sm">Tentar novamente</button>
      )}
    </div>
  );
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = dateStr.length === 10 ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
  return d.toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const s = String(dateStr);
  const d = s.endsWith('Z') || s.includes('+') ? new Date(s) : new Date(s + 'Z');
  return d.toLocaleString('pt-BR');
}
