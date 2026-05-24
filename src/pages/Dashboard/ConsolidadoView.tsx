import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Common/Card';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { dashboardConsolidado as api } from '../../services/api';
import {
  Building2, Wrench, FileWarning, AlertTriangle, Users, ArrowRight, ShieldCheck, CalendarClock,
} from 'lucide-react';

interface Totais {
  condominios?: number;
  os_abertas?: number;
  os_urgentes?: number;
  laudos_vencidos?: number;
  laudos_30?: number;
  moradores?: number;
  funcionarios?: number;
}
interface CondoLinha {
  id: string;
  nome: string;
  cidade?: string;
  uf?: string;
  os_abertas: number;
  os_urgentes: number;
  laudos_vencidos: number;
  laudos_30: number;
  vencimentos_30: number;
  moradores: number;
  usuarios: number;
}
interface Alerta {
  tipo: 'laudo_vencido' | 'os_urgente';
  id: string;
  descricao: string;
  subtipo: string;
  condominio_id: string;
  condominio_nome: string;
  dias: number;
}

const ConsolidadoView: React.FC = () => {
  const [data, setData] = useState<{ totais: Totais; condominios: CondoLinha[]; alertasCriticos: Alerta[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api.get()
      .then(setData)
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (erro) return <Card padding="md"><p style={{ color: '#dc2626' }}>{erro}</p></Card>;
  if (!data) return null;

  const t = data.totais;

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '8px 0 12px', color: '#111827' }}>Visão consolidada</h2>

      {/* KPIs gerais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10, marginBottom: 14 }}>
        <Kpi cor="#2563eb" icon={<Building2 size={18} />}     label="Condomínios"      valor={t.condominios} />
        <Kpi cor="#0891b2" icon={<Wrench size={18} />}        label="OS abertas"       valor={t.os_abertas} />
        <Kpi cor="#dc2626" icon={<AlertTriangle size={18} />} label="OS urgentes"      valor={t.os_urgentes} />
        <Kpi cor="#b91c1c" icon={<FileWarning size={18} />}   label="Laudos vencidos"  valor={t.laudos_vencidos} />
        <Kpi cor="#d97706" icon={<ShieldCheck size={18} />}   label="Laudos D-30"      valor={t.laudos_30} />
        <Kpi cor="#16a34a" icon={<Users size={18} />}         label="Moradores"        valor={t.moradores} />
        <Kpi cor="#7c3aed" icon={<Users size={18} />}         label="Funcionários"     valor={t.funcionarios} />
      </div>

      {/* Alertas críticos */}
      {data.alertasCriticos.length > 0 && (
        <Card padding="md">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={18} color="#dc2626" />
            <strong>Alertas críticos</strong>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {data.alertasCriticos.map(a => (
              <div key={`${a.tipo}-${a.id}`}
                onClick={() => nav(a.tipo === 'laudo_vencido' ? '/laudos' : '/ordens-servico')}
                style={{ padding: 10, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#7f1d1d' }}>
                    {a.tipo === 'laudo_vencido'
                      ? `Laudo vencido: ${a.descricao || a.subtipo}`
                      : `OS urgente: ${a.descricao}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#991b1b' }}>
                    {a.condominio_nome} ·
                    {a.tipo === 'laudo_vencido'
                      ? ` vencido há ${a.dias} dia(s)`
                      : ` aberta há ${a.dias} dia(s) (${a.subtipo})`}
                  </div>
                </div>
                <ArrowRight size={16} color="#7f1d1d" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabela por condomínio */}
      <Card padding="md" style={{ marginTop: 14 }}>
        <strong style={{ fontSize: 15 }}>Resumo por condomínio</strong>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <Th>Condomínio</Th>
                <Th>OS abertas</Th>
                <Th>Urgentes</Th>
                <Th>Laudos vencidos</Th>
                <Th>Laudos D-30</Th>
                <Th>Venc. 30d</Th>
                <Th>Moradores</Th>
              </tr>
            </thead>
            <tbody>
              {data.condominios.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 14, color: '#6b7280', textAlign: 'center' }}>Nenhum condomínio cadastrado ainda.</td></tr>
              )}
              {data.condominios.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <Td><strong>{c.nome}</strong>{c.cidade && <span style={{ color: '#6b7280' }}> · {c.cidade}/{c.uf}</span>}</Td>
                  <Td>{c.os_abertas}</Td>
                  <Td style={{ color: c.os_urgentes > 0 ? '#dc2626' : undefined, fontWeight: c.os_urgentes > 0 ? 700 : 400 }}>{c.os_urgentes}</Td>
                  <Td style={{ color: c.laudos_vencidos > 0 ? '#dc2626' : undefined, fontWeight: c.laudos_vencidos > 0 ? 700 : 400 }}>{c.laudos_vencidos}</Td>
                  <Td style={{ color: c.laudos_30 > 0 ? '#d97706' : undefined }}>{c.laudos_30}</Td>
                  <Td>{c.vencimentos_30}</Td>
                  <Td>{c.moradores}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const Kpi: React.FC<{ cor: string; icon: React.ReactNode; label: string; valor?: number }> = ({ cor, icon, label, valor }) => (
  <Card padding="sm">
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: `${cor}22`, color: cor, padding: 8, borderRadius: 10, display: 'flex' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{valor ?? 0}</div>
      </div>
    </div>
  </Card>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => <th style={{ padding: '8px 10px', fontWeight: 600, color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>{children}</th>;
const Td: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <td style={{ padding: '10px', verticalAlign: 'middle', ...style }}>{children}</td>;

export default ConsolidadoView;
