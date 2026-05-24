import React, { useState, useMemo, useEffect } from 'react';
import HowItWorks from '../../components/Common/HowItWorks';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import { compartilharConteudo, imprimirElemento, gerarPdfDeElemento } from '../../utils/exportUtils';
import {
  Flame, AlertTriangle, CheckCircle2, Clock, TrendingUp,
  BarChart3, Building2, Users, Filter as FilterIcon,
  Plus, X, Trash2, Check
} from 'lucide-react';
import Modal from '../../components/Common/Modal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './MapaCalor.module.css';
import { reportes as reportesApi, condominios as condominiosApi } from '../../services/api';

/* ═══════════════════════════════════════
   DADOS MOCK
═══════════════════════════════════════ */
interface Reclamacao {
  id: number;
  tipo: string;
  bloco: string;
  condominio: string;
  usuario: string;
  status: string;
  prioridade: string;
  data: string;
}

const CORES_TIPO: Record<string, string> = {
  Limpeza: '#1a73e8',
  Manutenção: '#00897b',
  Segurança: '#f57c00',
  Barulho: '#8e24aa',
  Vazamento: '#d32f2f',
  Elevador: '#5d4037',
};

const CORES_STATUS = ['#e53935', '#fb8c00', '#43a047', '#9e9e9e'];
const CORES_PRIORIDADE = ['#b71c1c', '#e65100', '#f9a825', '#43a047'];

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
const contarPor = (arr: Reclamacao[], campo: keyof Reclamacao): { nome: string; valor: number }[] => {
  const mapa: Record<string, number> = {};
  arr.forEach(r => { mapa[r[campo]] = (mapa[r[campo]] || 0) + 1; });
  return Object.entries(mapa)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);
};

const getCorCalor = (valor: number, max: number): { bg: string; fg: string } => {
  if (max === 0) return { bg: '#f5f5f5', fg: '#bdbdbd' };
  const ratio = valor / max;
  if (ratio >= 0.75) return { bg: '#c62828', fg: '#fff' };
  if (ratio >= 0.5) return { bg: '#e65100', fg: '#fff' };
  if (ratio >= 0.25) return { bg: '#f9a825', fg: '#333' };
  if (valor > 0) return { bg: '#a5d6a7', fg: '#1b5e20' };
  return { bg: '#f5f5f5', fg: '#bdbdbd' };
};

const diasAtras = (dataStr: string, dias: number): boolean => {
  const d = new Date(dataStr);
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  return d >= limite;
};

/* ═══════════════════════════════════════
   COMPONENTE
═══════════════════════════════════════ */
const MapaCalorPage: React.FC = () => {
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [condominiosCadastrados, setCondominiosCadastrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNova, setModalNova] = useState(false);
  const formVazio = { tipo: 'Limpeza', condominio: '', bloco: '', usuario: '', status: 'Aberto', prioridade: 'Média', descricao: '' };
  const [nova, setNova] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);

  const recarregar = async () => {
    const data = await reportesApi.list();
    setReclamacoes((data as any[]).map((r: any, i: number) => ({
      id: i + 1,
      _apiId: r.id,
      tipo: r.tipo || r.categoria || 'Outro',
      bloco: r.bloco || r.local || 'Geral',
      condominio: r.condominioNome || r.condominio || '',
      usuario: r.usuario || r.criadoPorNome || '',
      status: r.status === 'aberto' ? 'Aberto' : r.status === 'em_analise' || r.status === 'em_andamento' ? 'Em andamento' : r.status === 'resolvido' ? 'Resolvido' : r.status || 'Aberto',
      prioridade: r.prioridade === 'urgente' ? 'Urgente' : r.prioridade === 'alta' ? 'Alta' : r.prioridade === 'media' ? 'Média' : r.prioridade === 'baixa' ? 'Baixa' : r.prioridade || 'Média',
      data: r.criadoEm ? new Date(r.criadoEm).toISOString().split('T')[0] : r.data || '',
    } as any)));
  };

  const salvarNova = async () => {
    if (!nova.condominio || !nova.tipo) { alert('Selecione condomínio e tipo.'); return; }
    setSalvando(true);
    try {
      const cond = condominiosCadastrados.find((c: any) => c.nome === nova.condominio);
      await reportesApi.create({
        tipo: nova.tipo,
        categoria: nova.tipo,
        bloco: nova.bloco,
        local: nova.bloco,
        condominioId: cond?.id,
        descricao: nova.descricao,
        status: nova.status === 'Aberto' ? 'aberto' : nova.status === 'Em andamento' ? 'em_andamento' : 'resolvido',
        prioridade: nova.prioridade.toLowerCase() === 'média' ? 'media' : nova.prioridade.toLowerCase(),
      } as any);
      setModalNova(false);
      setNova(formVazio);
      await recarregar();
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const mudarStatus = async (apiId: string, novoStatus: string) => {
    try {
      await reportesApi.updateStatus(apiId, novoStatus);
      await recarregar();
    } catch (err: any) { alert(err?.message || 'Erro ao atualizar status.'); }
  };

  const excluir = async (apiId: string) => {
    if (!confirm('Excluir esta reclamação?')) return;
    try { await reportesApi.remove(apiId); await recarregar(); }
    catch (err: any) { alert(err?.message || 'Erro ao excluir.'); }
  };
  const [periodo, setPeriodo] = useState<'diario' | 'semanal' | 'mensal'>('mensal');
  const [condFiltro, setCondFiltro] = useState('todos');
  const [blocoFiltro, setBlocoFiltro] = useState('todos');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('todos');

  useEffect(() => {
    condominiosApi.list().then((cs: any[]) => {
      setCondominiosCadastrados(cs || []);
    }).catch(() => {});

    recarregar().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const condominios = useMemo(
    () => [...new Set([...condominiosCadastrados.map((c: any) => c.nome), ...reclamacoes.map(r => r.condominio)].filter(Boolean))].sort(),
    [reclamacoes, condominiosCadastrados]
  );

  const blocosDoCondSelecionado = useMemo(() => {
    if (condFiltro === 'todos') return null;
    const c = condominiosCadastrados.find((x: any) => x.nome === condFiltro);
    const nomes: string[] = c?.blocosNomes?.filter((n: string) => n && n.trim()) || [];
    if (nomes.length > 0) return nomes;
    if (c?.blocos > 0) return Array.from({ length: c.blocos }, (_, i) => String.fromCharCode(65 + i));
    return null;
  }, [condFiltro, condominiosCadastrados]);

  const blocosNovoForm = useMemo(() => {
    const c = condominiosCadastrados.find((x: any) => x.nome === nova.condominio);
    const nomes: string[] = c?.blocosNomes?.filter((n: string) => n && n.trim()) || [];
    if (nomes.length > 0) return nomes;
    if (c?.blocos > 0) return Array.from({ length: c.blocos }, (_, i) => String.fromCharCode(65 + i));
    return [];
  }, [nova.condominio, condominiosCadastrados]);
  const blocos = useMemo(() => [...new Set(reclamacoes.map(r => r.bloco))].sort(), [reclamacoes]);
  const tipos = useMemo(() => [...new Set(reclamacoes.map(r => r.tipo))].sort(), [reclamacoes]);

  const dadosFiltrados = useMemo(() => {
    let arr = reclamacoes;
    if (periodo === 'diario') arr = arr.filter(r => diasAtras(r.data, 1));
    else if (periodo === 'semanal') arr = arr.filter(r => diasAtras(r.data, 7));
    else arr = arr.filter(r => diasAtras(r.data, 30));
    if (condFiltro !== 'todos') arr = arr.filter(r => r.condominio === condFiltro);
    if (blocoFiltro !== 'todos') arr = arr.filter(r => r.bloco === blocoFiltro);
    if (statusFiltro !== 'todos') arr = arr.filter(r => r.status === statusFiltro);
    if (prioridadeFiltro !== 'todos') arr = arr.filter(r => r.prioridade === prioridadeFiltro);
    return arr;
  }, [periodo, condFiltro, blocoFiltro, statusFiltro, prioridadeFiltro]);

  /* --- Números consolidados --- */
  const totalReclamacoes = dadosFiltrados.length;
  const totalAbertos = dadosFiltrados.filter(r => r.status === 'Aberto').length;
  const totalEmAndamento = dadosFiltrados.filter(r => r.status === 'Em andamento').length;
  const totalResolvidos = dadosFiltrados.filter(r => r.status === 'Resolvido').length;
  const taxaResolucao = totalReclamacoes > 0 ? Math.round((totalResolvidos / totalReclamacoes) * 100) : 0;

  /* --- Dados dos gráficos --- */
  const porTipo = contarPor(dadosFiltrados, 'tipo');
  const porBloco = contarPor(dadosFiltrados, 'bloco');
  const porCondominio = contarPor(dadosFiltrados, 'condominio');
  const porStatus = contarPor(dadosFiltrados, 'status');
  const porPrioridade = contarPor(dadosFiltrados, 'prioridade');
  const porUsuario = contarPor(dadosFiltrados, 'usuario');

  /* --- Heatmap: Blocos x Tipos --- */
  const heatmapBlocosArr = [...new Set(dadosFiltrados.map(r => r.bloco))].sort();
  const heatmapTiposArr = [...new Set(dadosFiltrados.map(r => r.tipo))].sort();
  const heatmapData: Record<string, Record<string, number>> = {};
  let heatmapMax = 0;
  heatmapBlocosArr.forEach(b => {
    heatmapData[b] = {};
    heatmapTiposArr.forEach(t => {
      const count = dadosFiltrados.filter(r => r.bloco === b && r.tipo === t).length;
      heatmapData[b][t] = count;
      if (count > heatmapMax) heatmapMax = count;
    });
  });

  /* --- Heatmap: Condomínios x Tipos --- */
  const heatmapCondsArr = [...new Set(dadosFiltrados.map(r => r.condominio))].sort();
  const heatmapCondData: Record<string, Record<string, number>> = {};
  let heatmapCondMax = 0;
  heatmapCondsArr.forEach(c => {
    heatmapCondData[c] = {};
    heatmapTiposArr.forEach(t => {
      const count = dadosFiltrados.filter(r => r.condominio === c && r.tipo === t).length;
      heatmapCondData[c][t] = count;
      if (count > heatmapCondMax) heatmapCondMax = count;
    });
  });

  const maxReclamacoesBloco = porBloco.length > 0 ? porBloco[0].valor : 1;

  const tooltipStyle = { background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;

  return (
    <div id="mapa-calor-content">
      <HowItWorks
        titulo="Mapa de Calor de Reclamações"
        descricao="Identifique visualmente quai espaços e categorias geram mais problemas nos condomínios."
        passos={[
          'Filtre por período (diário, semanal, mensal), condomínio, bloco, status e prioridade',
          'Veja os números consolidados no topo da página',
          'Analise o mapa de calor para identificar pontos críticos por bloco e tipo',
          'Compare reclamações através dos gráficos de barras e pizza',
          'Consulte o ranking dos espaços com mais ocorrências',
        ]}
      />

      <PageHeader
        titulo="Mapa de Calor de Reclamações"
        subtitulo={`${totalReclamacoes} reclamações no período`}
        onCompartilhar={() => compartilharConteudo('Mapa de Calor', 'Mapa de Calor de Reclamações do sistema App Síndico')}
        onImprimir={() => imprimirElemento('mapa-calor-content')}
        onGerarPdf={() => gerarPdfDeElemento('mapa-calor-content', 'mapa-calor-reclamacoes')}
        acoes={
          <button onClick={() => setModalNova(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--cor-primaria)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <Plus size={16} /> Nova Reclamação
          </button>
        }
      />

      {/* ═══ Filtros ═══ */}
      <Card padding="md">
        <div className={styles.filtros}>
          <div className={styles.filtroGrupo}>
            <span className={styles.filtroLabel}>Período</span>
            <select className={styles.filtroSelect} value={periodo} onChange={e => setPeriodo(e.target.value as any)}>
              <option value="diario">Hoje</option>
              <option value="semanal">Última Semana</option>
              <option value="mensal">Último Mês</option>
            </select>
          </div>
          <div className={styles.filtroGrupo}>
            <span className={styles.filtroLabel}>Condomínio</span>
            <select className={styles.filtroSelect} value={condFiltro} onChange={e => setCondFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {condominios.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.filtroGrupo}>
            <span className={styles.filtroLabel}>Bloco</span>
            <select className={styles.filtroSelect} value={blocoFiltro} onChange={e => setBlocoFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              {(blocosDoCondSelecionado || blocos).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className={styles.filtroGrupo}>
            <span className={styles.filtroLabel}>Status</span>
            <select className={styles.filtroSelect} value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Resolvido">Resolvido</option>
            </select>
          </div>
          <div className={styles.filtroGrupo}>
            <span className={styles.filtroLabel}>Prioridade</span>
            <select className={styles.filtroSelect} value={prioridadeFiltro} onChange={e => setPrioridadeFiltro(e.target.value)}>
              <option value="todos">Todas</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ═══ Números Consolidados ═══ */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcone} style={{ background: '#e3f2fd' }}>
            <Flame size={24} color="#1565c0" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValor}>{totalReclamacoes}</span>
            <span className={styles.statLabel}>Total de Reclamações</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcone} style={{ background: '#ffebee' }}>
            <AlertTriangle size={24} color="#c62828" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValor}>{totalAbertos}</span>
            <span className={styles.statLabel}>Em Aberto</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcone} style={{ background: '#fff3e0' }}>
            <Clock size={24} color="#e65100" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValor}>{totalEmAndamento}</span>
            <span className={styles.statLabel}>Em Andamento</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcone} style={{ background: '#e8f5e9' }}>
            <CheckCircle2 size={24} color="#2e7d32" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValor}>{totalResolvidos}</span>
            <span className={styles.statLabel}>Resolvidos</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcone} style={{ background: '#f3e5f5' }}>
            <TrendingUp size={24} color="#7b1fa2" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValor}>{taxaResolucao}%</span>
            <span className={styles.statLabel}>Taxa de Resolução</span>
          </div>
        </div>
      </div>

      {/* ═══ Mapa de Calor: Blocos x Tipos ═══ */}
      <Card padding="md">
        <h3 className={styles.chartTitle}>
          <Flame size={18} style={{ color: '#d32f2f' }} /> Mapa de Calor — Blocos × Tipo de Problema
        </h3>
        {heatmapBlocosArr.length > 0 && heatmapTiposArr.length > 0 ? (
          <div className={styles.heatmapContainer}>
            <div
              className={styles.heatmapGrid}
              style={{ gridTemplateColumns: `120px repeat(${heatmapTiposArr.length}, 1fr)` }}
            >
              <div />
              {heatmapTiposArr.map(t => (
                <div key={t} className={styles.heatmapHeader}>{t}</div>
              ))}
              {heatmapBlocosArr.map(b => (
                <React.Fragment key={b}>
                  <div className={styles.heatmapRowLabel}>{b}</div>
                  {heatmapTiposArr.map(t => {
                    const v = heatmapData[b][t];
                    const cor = getCorCalor(v, heatmapMax);
                    return (
                      <div
                        key={`${b}-${t}`}
                        className={styles.heatmapCell}
                        style={{ background: cor.bg, color: cor.fg }}
                        title={`${b} / ${t}: ${v} reclamação(ões)`}
                      >
                        {v}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className={styles.legendaRow}>
              <span>Menor</span>
              <div className={styles.legendaBloco} style={{ background: '#f5f5f5' }} />
              <div className={styles.legendaBloco} style={{ background: '#a5d6a7' }} />
              <div className={styles.legendaBloco} style={{ background: '#f9a825' }} />
              <div className={styles.legendaBloco} style={{ background: '#e65100' }} />
              <div className={styles.legendaBloco} style={{ background: '#c62828' }} />
              <span>Maior</span>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 14 }}>Nenhuma reclamação encontrada para os filtros selecionados.</p>
        )}
      </Card>

      {/* ═══ Mapa de Calor: Condomínios x Tipos ═══ */}
      <Card padding="md" style={{ marginTop: 20 }}>
        <h3 className={styles.chartTitle}>
          <Building2 size={18} style={{ color: '#1565c0' }} /> Mapa de Calor — Condomínios × Tipo de Problema
        </h3>
        {heatmapCondsArr.length > 0 && heatmapTiposArr.length > 0 ? (
          <div className={styles.heatmapContainer}>
            <div
              className={styles.heatmapGrid}
              style={{ gridTemplateColumns: `120px repeat(${heatmapTiposArr.length}, 1fr)` }}
            >
              <div />
              {heatmapTiposArr.map(t => (
                <div key={t} className={styles.heatmapHeader}>{t}</div>
              ))}
              {heatmapCondsArr.map(c => (
                <React.Fragment key={c}>
                  <div className={styles.heatmapRowLabel}>{c}</div>
                  {heatmapTiposArr.map(t => {
                    const v = heatmapCondData[c][t];
                    const cor = getCorCalor(v, heatmapCondMax);
                    return (
                      <div
                        key={`${c}-${t}`}
                        className={styles.heatmapCell}
                        style={{ background: cor.bg, color: cor.fg }}
                        title={`${c} / ${t}: ${v} reclamação(ões)`}
                      >
                        {v}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            <div className={styles.legendaRow}>
              <span>Menor</span>
              <div className={styles.legendaBloco} style={{ background: '#f5f5f5' }} />
              <div className={styles.legendaBloco} style={{ background: '#a5d6a7' }} />
              <div className={styles.legendaBloco} style={{ background: '#f9a825' }} />
              <div className={styles.legendaBloco} style={{ background: '#e65100' }} />
              <div className={styles.legendaBloco} style={{ background: '#c62828' }} />
              <span>Maior</span>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 14 }}>Nenhuma reclamação encontrada.</p>
        )}
      </Card>

      {/* ═══ Gráficos: Barras por Tipo + Pizza por Status ═══ */}
      <div className={styles.chartsRow} style={{ marginTop: 20 }}>
        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <BarChart3 size={18} style={{ color: 'var(--cor-primaria)' }} /> Reclamações por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porTipo} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis type="number" fontSize={12} stroke="var(--cor-texto-secundario)" />
              <YAxis dataKey="nome" type="category" fontSize={12} stroke="var(--cor-texto-secundario)" width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]} name="Reclamações">
                {porTipo.map((entry) => (
                  <Cell key={entry.nome} fill={CORES_TIPO[entry.nome] || '#9e9e9e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <CheckCircle2 size={18} style={{ color: '#43a047' }} /> Distribuição por Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={porStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={95} dataKey="valor" nameKey="nome" label={({ nome, valor }: any) => `${nome} (${valor})`}>
                {porStatus.map((_, i) => <Cell key={i} fill={CORES_STATUS[i % CORES_STATUS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ═══ Gráficos: Barras por Bloco + Pizza por Prioridade ═══ */}
      <div className={styles.chartsRow}>
        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <Building2 size={18} style={{ color: '#5d4037' }} /> Reclamações por Bloco
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porBloco}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="nome" fontSize={12} stroke="var(--cor-texto-secundario)" />
              <YAxis fontSize={12} stroke="var(--cor-texto-secundario)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="#5d4037" radius={[4, 4, 0, 0]} name="Reclamações" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <AlertTriangle size={18} style={{ color: '#e65100' }} /> Distribuição por Prioridade
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={porPrioridade} cx="50%" cy="50%" innerRadius={45} outerRadius={95} dataKey="valor" nameKey="nome" label={({ nome, valor }: any) => `${nome} (${valor})`}>
                {porPrioridade.map((_, i) => <Cell key={i} fill={CORES_PRIORIDADE[i % CORES_PRIORIDADE.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ═══ Gráficos: Barras por Condomínio + Pizza por Usuário ═══ */}
      <div className={styles.chartsRow}>
        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <Building2 size={18} style={{ color: '#1565c0' }} /> Reclamações por Condomínio
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porCondominio}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="nome" fontSize={12} stroke="var(--cor-texto-secundario)" />
              <YAxis fontSize={12} stroke="var(--cor-texto-secundario)" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="valor" fill="#1565c0" radius={[4, 4, 0, 0]} name="Reclamações" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <Users size={18} style={{ color: '#7b1fa2' }} /> Reclamações por Usuário
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={porUsuario} cx="50%" cy="50%" innerRadius={45} outerRadius={95} dataKey="valor" nameKey="nome" label={({ nome, valor }: any) => `${nome} (${valor})`}>
                {porUsuario.map((_, i) => <Cell key={i} fill={Object.values(CORES_TIPO)[i % Object.values(CORES_TIPO).length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ═══ Ranking: Espaços mais problemáticos ═══ */}
      <Card padding="md">
        <h3 className={styles.chartTitle}>
          <TrendingUp size={18} style={{ color: '#d32f2f' }} /> Ranking — Espaços com Mais Reclamações
        </h3>
        <div className={styles.tabelaWrapper}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>#</th>
                <th>Bloco</th>
                <th>Reclamações</th>
                <th>Volume</th>
                <th>Criticidade</th>
              </tr>
            </thead>
            <tbody>
              {porBloco.map((item, i) => {
                const ratio = item.valor / maxReclamacoesBloco;
                const criticidade = ratio >= 0.75 ? 'Crítico' : ratio >= 0.5 ? 'Alto' : ratio >= 0.25 ? 'Médio' : 'Baixo';
                const badgeClass = criticidade === 'Crítico' ? styles.badgeCritico : criticidade === 'Alto' ? styles.badgeAlto : criticidade === 'Médio' ? styles.badgeMedio : styles.badgeBaixo;
                return (
                  <tr key={item.nome}>
                    <td>
                      <span className={`${styles.rankNum} ${i === 0 ? styles.rank1 : i === 1 ? styles.rank2 : i === 2 ? styles.rank3 : styles.rankN}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.nome}</td>
                    <td style={{ fontWeight: 700 }}>{item.valor}</td>
                    <td>
                      <div className={styles.barraInlineWrapper}>
                        <div className={styles.barraInline} style={{ width: `${(item.valor / maxReclamacoesBloco) * 100}%`, background: ratio >= 0.75 ? '#c62828' : ratio >= 0.5 ? '#e65100' : ratio >= 0.25 ? '#f9a825' : '#43a047' }} />
                      </div>
                    </td>
                    <td><span className={`${styles.badge} ${badgeClass}`}>{criticidade}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══ Lista de Reclamações ═══ */}
      <Card padding="md">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Reclamações ({dadosFiltrados.length})</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Condomínio</th>
                <th>Bloco</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 18, color: 'var(--cor-texto-secundario)' }}>Nenhuma reclamação no filtro atual.</td></tr>
              )}
              {dadosFiltrados.slice(0, 100).map((r: any) => (
                <tr key={r._apiId || r.id}>
                  <td>{r.data ? new Date(r.data).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{r.condominio}</td>
                  <td>{r.bloco}</td>
                  <td>{r.tipo}</td>
                  <td>{r.status}</td>
                  <td>{r.prioridade}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {r._apiId && r.status !== 'Em andamento' && (
                      <button onClick={() => mudarStatus(r._apiId, 'em_andamento')} title="Em andamento"
                        style={{ marginRight: 4, padding: '4px 8px', border: '1px solid #fde68a', background: '#fef3c7', color: '#92400e', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                        <Clock size={11} />
                      </button>
                    )}
                    {r._apiId && r.status !== 'Resolvido' && (
                      <button onClick={() => mudarStatus(r._apiId, 'resolvido')} title="Marcar como resolvido"
                        style={{ marginRight: 4, padding: '4px 8px', border: '1px solid #86efac', background: '#dcfce7', color: '#166534', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                        <Check size={11} />
                      </button>
                    )}
                    {r._apiId && (
                      <button onClick={() => excluir(r._apiId)} title="Excluir"
                        style={{ padding: '4px 8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {dadosFiltrados.length > 100 && (
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--cor-texto-secundario)', padding: 8 }}>
              Mostrando 100 de {dadosFiltrados.length}. Use os filtros para refinar.
            </div>
          )}
        </div>
      </Card>

      {modalNova && (
        <Modal aberto={true} titulo="Nova Reclamação" largura="md" onFechar={() => setModalNova(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500, gridColumn: '1 / -1' }}>
              Condomínio *
              <select value={nova.condominio} onChange={e => setNova({ ...nova, condominio: e.target.value, bloco: '' })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                <option value="">Selecione...</option>
                {condominiosCadastrados.map((c: any) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Bloco
              {blocosNovoForm.length > 0 ? (
                <select value={nova.bloco} onChange={e => setNova({ ...nova, bloco: e.target.value })}
                  style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                  <option value="">Selecione...</option>
                  {blocosNovoForm.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <input value={nova.bloco} onChange={e => setNova({ ...nova, bloco: e.target.value })} placeholder="Ex: A"
                  style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
              )}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Tipo *
              <select value={nova.tipo} onChange={e => setNova({ ...nova, tipo: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                {['Limpeza', 'Manutenção', 'Segurança', 'Barulho', 'Vazamento', 'Elevador', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Prioridade
              <select value={nova.prioridade} onChange={e => setNova({ ...nova, prioridade: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                {['Urgente', 'Alta', 'Média', 'Baixa'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Status
              <select value={nova.status} onChange={e => setNova({ ...nova, status: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                {['Aberto', 'Em andamento', 'Resolvido'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500, gridColumn: '1 / -1' }}>
              Descrição
              <textarea value={nova.descricao} onChange={e => setNova({ ...nova, descricao: e.target.value })} rows={3}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setModalNova(false)} style={{ padding: '8px 14px', border: '1px solid var(--cor-borda)', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={salvarNova} disabled={salvando}
              style={{ padding: '8px 14px', background: 'var(--cor-primaria)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {salvando ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MapaCalorPage;
