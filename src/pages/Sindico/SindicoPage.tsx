import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sindico as sindicoApi } from '../../services/api';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  Building2, Wrench, CheckCircle2, AlertTriangle, Users, DollarSign, MessageSquare, Megaphone, ShieldAlert,
  LayoutDashboard, CalendarClock, ShieldCheck, Contact, Shield, CalendarDays, ClipboardCheck, Settings,
  Package, QrCode, FileText, Cog, Calendar, Store, MapPin, Search, ScanLine, CalendarRange, Columns3,
  Flame, BarChart3, FileWarning, BookOpen, MessageSquareText, CalendarCheck, Eye, MessageCircle
} from 'lucide-react';
import styles from './SindicoPage.module.css';

interface AcessoRapido {
  id: string;
  label: string;
  descricao: string;
  rota: string;
  icon: React.ReactNode;
  cor: string;
  minRole: number;
}

const OCULTOS_KEY = 'manutencao-sidebar-ocultos';

// IDs e minRole devem espelhar o Sidebar (manutencao-sidebar-ocultos usa esses ids)
const ACESSOS: AcessoRapido[] = [
  { id: 'dashboard', label: 'Dashboard', descricao: 'Visão geral', rota: '/dashboard', icon: <LayoutDashboard size={18} />, cor: '#3b82f6', minRole: 1 },
  { id: 'vencimentos', label: 'Agenda de Vencimentos', descricao: 'Contas e compromissos', rota: '/vencimentos', icon: <CalendarClock size={18} />, cor: '#dc2626', minRole: 2 },
  { id: 'laudos', label: 'Laudos Obrigatórios', descricao: 'AVCB, SPDA e outros', rota: '/laudos', icon: <ShieldCheck size={18} />, cor: '#059669', minRole: 2 },
  { id: 'condominios', label: 'Condomínios', descricao: 'Cadastro e gestão', rota: '/condominios', icon: <Building2 size={18} />, cor: '#0284c7', minRole: 2 },
  { id: 'moradores', label: 'Moradores', descricao: 'Cadastro dos moradores', rota: '/moradores', icon: <Contact size={18} />, cor: '#7c3aed', minRole: 2 },
  { id: 'permissoes', label: 'Permissões', descricao: 'Controle de acesso', rota: '/permissoes', icon: <Shield size={18} />, cor: '#475569', minRole: 3 },
  { id: 'usuarios', label: 'Usuários', descricao: 'Quem acessa o sistema', rota: '/usuarios', icon: <Users size={18} />, cor: '#0891b2', minRole: 3 },
  { id: 'calendario', label: 'Calendário Manutenção', descricao: 'Eventos e manutenções', rota: '/calendario', icon: <CalendarDays size={18} />, cor: '#0d9488', minRole: 2 },
  { id: 'checklists', label: 'Checklists', descricao: 'Listas de verificação', rota: '/checklists', icon: <ClipboardCheck size={18} />, cor: '#2563eb', minRole: 1 },
  { id: 'comunicados', label: 'Comunicados / Avisos', descricao: 'Avisos aos moradores', rota: '/comunicados', icon: <Megaphone size={18} />, cor: '#9333ea', minRole: 2 },
  { id: 'configuracoes', label: 'Configurações', descricao: 'Preferências do sistema', rota: '/configuracoes', icon: <Settings size={18} />, cor: '#475569', minRole: 1 },
  { id: 'materiais', label: 'Controle de Estoque', descricao: 'Materiais e retiradas', rota: '/materiais', icon: <Package size={18} />, cor: '#ea580c', minRole: 1 },
  { id: 'qrcode', label: 'Criar QR Code', descricao: 'Gerar formulários', rota: '/qrcode', icon: <QrCode size={18} />, cor: '#1e40af', minRole: 2 },
  { id: 'documentos', label: 'Documentação Técnica', descricao: 'Manuais e certificados', rota: '/documentos', icon: <FileText size={18} />, cor: '#0e7490', minRole: 2 },
  { id: 'equipamentos', label: 'Equipamentos', descricao: 'Inventário técnico', rota: '/equipamentos', icon: <Cog size={18} />, cor: '#64748b', minRole: 2 },
  { id: 'escalas', label: 'Escalas', descricao: 'Turnos da equipe', rota: '/escalas', icon: <Calendar size={18} />, cor: '#be185d', minRole: 2 },
  { id: 'fornecedores', label: 'Fornecedores', descricao: 'Cadastro de prestadores', rota: '/fornecedores', icon: <Store size={18} />, cor: '#b45309', minRole: 2 },
  { id: 'geolocalizacao', label: 'Geolocalização', descricao: 'Rastreamento GPS', rota: '/geolocalizacao', icon: <MapPin size={18} />, cor: '#1d4ed8', minRole: 2 },
  { id: 'inspecoes', label: 'Inspeções', descricao: 'Vistorias técnicas', rota: '/inspecoes', icon: <Search size={18} />, cor: '#7e22ce', minRole: 2 },
  { id: 'leitor-qrcode', label: 'Leitor QR Code', descricao: 'Escanear códigos', rota: '/leitor-qrcode', icon: <ScanLine size={18} />, cor: '#0369a1', minRole: 1 },
  { id: 'ordens', label: 'Ordens de Serviço', descricao: 'Abertura e acompanhamento', rota: '/ordens-servico', icon: <Wrench size={18} />, cor: '#f59e0b', minRole: 1 },
  { id: 'planos-manutencao', label: 'Planos Preventivos', descricao: 'Manutenção recorrente', rota: '/planos-manutencao', icon: <CalendarRange size={18} />, cor: '#16a34a', minRole: 2 },
  { id: 'quadro-atividades', label: 'Quadro de Atividades', descricao: 'Kanban operacional', rota: '/quadro-atividades', icon: <Columns3 size={18} />, cor: '#9f1239', minRole: 1 },
  { id: 'mapa-calor', label: 'Reclamações', descricao: 'Mapa de calor', rota: '/mapa-calor', icon: <Flame size={18} />, cor: '#dc2626', minRole: 3 },
  { id: 'relatorios', label: 'Relatórios', descricao: 'Análises e exportações', rota: '/relatorios', icon: <BarChart3 size={18} />, cor: '#1e3a8a', minRole: 2 },
  { id: 'reportes', label: 'Reportes', descricao: 'Ocorrências relatadas', rota: '/reportes', icon: <FileWarning size={18} />, cor: '#b91c1c', minRole: 1 },
  { id: 'roteiros', label: 'Roteiro de Execução', descricao: 'Passo a passo', rota: '/roteiros', icon: <BookOpen size={18} />, cor: '#365314', minRole: 1 },
  { id: 'tarefas', label: 'Tarefas Agendadas', descricao: 'Atividades programadas', rota: '/tarefas', icon: <CalendarCheck size={18} />, cor: '#15803d', minRole: 1 },
  { id: 'vistorias', label: 'Vistorias', descricao: 'Registros visuais', rota: '/vistorias', icon: <Eye size={18} />, cor: '#0f766e', minRole: 1 },
];

const SindicoPage: React.FC = () => {
  const navigate = useNavigate();
  const { roleNivel, podeVer } = usePermissions();
  const [resumo, setResumo] = useState<any>(null);
  const [porCond, setPorCond] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  const ocultos = useMemo<Set<string>>(() => {
    try { const v = localStorage.getItem(OCULTOS_KEY); return v ? new Set(JSON.parse(v)) : new Set(); } catch { return new Set(); }
  }, []);

  const acessosVisiveis = useMemo(() => {
    return ACESSOS.filter(a => roleNivel >= a.minRole && podeVer(a.id) && !ocultos.has(a.id));
  }, [roleNivel, podeVer, ocultos]);

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

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--cor-texto)' }}>Acesso Rápido</h3>
          <input
            type="text"
            placeholder="Buscar função..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--cor-borda)', borderRadius: 8, fontSize: 12.5, width: 200 }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {acessosVisiveis
            .filter(a => !busca.trim() || `${a.label} ${a.descricao}`.toLowerCase().includes(busca.toLowerCase()))
            .map(a => (
              <button
                key={a.id}
                onClick={() => navigate(a.rota)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 10,
                  border: '1.5px solid var(--cor-borda)', borderRadius: 10,
                  background: 'var(--cor-superficie)', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.cor; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cor-borda)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${a.cor}18`, color: a.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--cor-texto-secundario)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.descricao}</div>
                </div>
              </button>
            ))}
        </div>
      </Card>

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
