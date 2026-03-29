import React, { useEffect, useState } from 'react';
import { sindico as sindicoApi } from '../../services/api';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import { Building2, Wrench, CheckCircle2, AlertTriangle, Users, DollarSign, MessageSquare, Megaphone, ShieldAlert } from 'lucide-react';
import styles from './SindicoPage.module.css';

const SindicoPage: React.FC = () => {
  const [resumo, setResumo] = useState<any>(null);
  const [porCond, setPorCond] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [r, c] = await Promise.all([
        sindicoApi.resumo(),
        sindicoApi.osPorCondominio(),
      ]);
      setResumo(r);
      setPorCond(c);
    } catch (err) {
      console.error('Sindico loadData error:', err);
      setResumo({ condominios: 0, osAbertas: 0, osConcluidas: 0, osConcluidasMes: 0, slaVioladas: 0, solicitacoesPendentes: 0, moradores: 0, custoMes: 0, comunicadosMes: 0, osRecentes: [] });
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--cor-texto-secundario)' }}>Carregando...</div>;
  if (!resumo) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--cor-texto-secundario)' }}>Nenhum dado disponível</div>;

  const maxOS = Math.max(...porCond.map((c: any) => parseInt(c.total || '0')), 1);

  const statusColor: Record<string, string> = {
    aberta: '#3b82f6', em_andamento: '#f59e0b', concluida: '#16a34a', cancelada: '#6b7280',
  };

  return (
    <div className={styles.sindicoPage}>
      <PageHeader titulo="Painel do Síndico" subtitulo="Visão geral dos condomínios sob sua gestão" />

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#eff6ff' }}><Building2 size={20} color="#3b82f6" /></div>
          <span className={styles.statLabel}>Condomínios</span>
          <span className={styles.statValue}>{resumo.condominios}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}><Wrench size={20} color="#f59e0b" /></div>
          <span className={styles.statLabel}>OS Abertas</span>
          <span className={styles.statValue}>{resumo.osAbertas}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}><CheckCircle2 size={20} color="#16a34a" /></div>
          <span className={styles.statLabel}>Concluídas (Mês)</span>
          <span className={styles.statValue}>{resumo.osConcluidasMes}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fee2e2' }}><ShieldAlert size={20} color="#dc2626" /></div>
          <span className={styles.statLabel}>SLA Violadas</span>
          <span className={styles.statValue}>{resumo.slaVioladas}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f3e8ff' }}><MessageSquare size={20} color="#9333ea" /></div>
          <span className={styles.statLabel}>Solicitações Pendentes</span>
          <span className={styles.statValue}>{resumo.solicitacoesPendentes}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e0f2fe' }}><Users size={20} color="#0284c7" /></div>
          <span className={styles.statLabel}>Moradores Ativos</span>
          <span className={styles.statValue}>{resumo.moradores}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}><DollarSign size={20} color="#d97706" /></div>
          <span className={styles.statLabel}>Custo no Mês</span>
          <span className={styles.statValue}>R$ {Number(resumo.custoMes).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5' }}><Megaphone size={20} color="#059669" /></div>
          <span className={styles.statLabel}>Comunicados (Mês)</span>
          <span className={styles.statValue}>{resumo.comunicadosMes}</span>
        </div>
      </div>

      <div className={styles.columns}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>OS Recentes em Aberto</div>
          {resumo.osRecentes?.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--cor-texto-secundario)', fontSize: 13 }}>Nenhuma OS em aberto</div>
          ) : (
            resumo.osRecentes?.map((os: any) => (
              <div key={os.id} className={styles.osItem}>
                <span className={styles.osProtocolo}>{os.protocolo}</span>
                <span className={styles.osTitulo}>{os.titulo}</span>
                <span className={styles.osBadge} style={{
                  background: `${statusColor[os.status] || '#6b7280'}20`,
                  color: statusColor[os.status] || '#6b7280',
                }}>
                  {os.status?.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>OS por Condomínio</div>
          <div className={styles.barChart}>
            {porCond.map((c: any) => (
              <div key={c.id} className={styles.barItem}>
                <span className={styles.barLabel}>{c.nome}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${(parseInt(c.abertas || '0') / maxOS) * 100}%`,
                      background: '#f59e0b',
                    }}
                  />
                </div>
                <span className={styles.barValue} style={{ color: '#f59e0b' }}>{c.abertas}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${(parseInt(c.concluidas || '0') / maxOS) * 100}%`,
                      background: '#16a34a',
                    }}
                  />
                </div>
                <span className={styles.barValue} style={{ color: '#16a34a' }}>{c.concluidas}</span>
              </div>
            ))}
          </div>
          {porCond.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, color: 'var(--cor-texto-secundario)' }}>
              <span>🟡 Abertas</span> <span>🟢 Concluídas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SindicoPage;
