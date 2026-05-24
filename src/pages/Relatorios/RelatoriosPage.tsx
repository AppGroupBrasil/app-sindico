import React, { useState, useEffect, useMemo } from 'react';
import HowItWorks from '../../components/Common/HowItWorks';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import { compartilharConteudo, imprimirElemento, gerarPdfDeElemento } from '../../utils/exportUtils';
import { BarChart3, TrendingUp, PieChart as PieIcon, Activity, Filter as FilterIcon, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  ordensServico as osApi,
  reportes as reportesApi,
  moradores as moradoresApi,
  condominios as condominiosApi,
  relatorios as relatoriosApi,
} from '../../services/api';
import styles from '../Geolocalizacao/Geolocalizacao.module.css';

const CORES = ['#2e7d32', '#1a73e8', '#f57c00', '#d32f2f', '#9e9e9e', '#7b1fa2', '#00897b'];

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const TIPOS_OS = ['limpeza', 'manutencao', 'emergencia', 'preventiva'];

const RelatoriosPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<any>({ osPorCondominio: [], satisfacao: [], custoMensal: [], produtividade: [] });
  const [ordens, setOrdens] = useState<any[]>([]);
  const [reclamacoes, setReclamacoes] = useState<any[]>([]);
  const [moradores, setMoradores] = useState<any[]>([]);
  const [condominios, setCondominios] = useState<any[]>([]);

  const hoje = new Date();
  const inicioPadrao = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const [dataIni, setDataIni] = useState<string>(inicioPadrao.toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState<string>(hoje.toISOString().slice(0, 10));
  const [condId, setCondId] = useState<string>('todos');
  const [bloco, setBloco] = useState<string>('todos');
  const [moradorId, setMoradorId] = useState<string>('todos');
  const [tipo, setTipo] = useState<string>('todos');
  const [status, setStatus] = useState<string>('todos');
  const [prioridade, setPrioridade] = useState<string>('todos');

  const carregar = async () => {
    setLoading(true);
    const [resR, osR, repR, morR, condR] = await Promise.allSettled([
      relatoriosApi.resumo(),
      osApi.list(),
      reportesApi.list(),
      moradoresApi.list(),
      condominiosApi.list(),
    ]);
    if (resR.status === 'fulfilled') setResumo(resR.value || {});
    if (osR.status === 'fulfilled') setOrdens(osR.value as any[]);
    if (repR.status === 'fulfilled') setReclamacoes(repR.value as any[]);
    if (morR.status === 'fulfilled') setMoradores(morR.value as any[]);
    if (condR.status === 'fulfilled') setCondominios(condR.value as any[]);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const condSelecionado = useMemo(() => condominios.find((c: any) => c.id === condId), [condominios, condId]);
  const blocosDisponiveis = useMemo(() => {
    if (!condSelecionado) return [];
    const nomes: string[] = condSelecionado.blocosNomes?.filter((n: string) => n && n.trim()) || [];
    if (nomes.length > 0) return nomes;
    if (condSelecionado.blocos > 0) return Array.from({ length: condSelecionado.blocos }, (_, i) => String.fromCharCode(65 + i));
    return [];
  }, [condSelecionado]);

  const moradoresDisponiveis = useMemo(() => {
    if (condId === 'todos') return moradores;
    return moradores.filter((m: any) => m.condominioId === condId || m.condominioNome === condSelecionado?.nome);
  }, [moradores, condId, condSelecionado]);

  const dentroDoPeriodo = (dataStr?: string) => {
    if (!dataStr) return true;
    const d = new Date(dataStr).getTime();
    return d >= new Date(dataIni).getTime() && d <= new Date(dataFim).getTime() + 86400000;
  };

  const ordensFiltradas = useMemo(() => ordens.filter((o: any) => {
    if (!dentroDoPeriodo(o.dataAbertura)) return false;
    if (condId !== 'todos' && o.condominioId !== condId) return false;
    if (bloco !== 'todos' && o.local && !o.local.toLowerCase().includes(bloco.toLowerCase())) return false;
    if (tipo !== 'todos' && o.tipo !== tipo) return false;
    if (status !== 'todos' && o.status !== status) return false;
    if (prioridade !== 'todos' && o.prioridade !== prioridade) return false;
    return true;
  }), [ordens, dataIni, dataFim, condId, bloco, tipo, status, prioridade]);

  const reclamacoesFiltradas = useMemo(() => reclamacoes.filter((r: any) => {
    const data = r.criadoEm || r.data;
    if (!dentroDoPeriodo(data)) return false;
    if (condId !== 'todos' && r.condominioId !== condId && r.condominioNome !== condSelecionado?.nome) return false;
    if (bloco !== 'todos' && (r.bloco || r.local) && !(r.bloco || r.local || '').toLowerCase().includes(bloco.toLowerCase())) return false;
    if (tipo !== 'todos' && r.tipo !== tipo && r.categoria !== tipo) return false;
    if (status !== 'todos' && r.status !== status) return false;
    if (prioridade !== 'todos' && r.prioridade !== prioridade) return false;
    if (moradorId !== 'todos' && r.moradorId !== moradorId && r.criadoPor !== moradorId) return false;
    return true;
  }), [reclamacoes, dataIni, dataFim, condId, bloco, tipo, status, prioridade, moradorId, condSelecionado]);

  const osMensal = useMemo(() => {
    const mapa: Record<string, { mes: string; limpeza: number; manutencao: number; emergencia: number; preventiva: number }> = {};
    ordensFiltradas.forEach((o: any) => {
      if (!o.dataAbertura) return;
      const d = new Date(o.dataAbertura);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MESES[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      if (!mapa[chave]) mapa[chave] = { mes: label, limpeza: 0, manutencao: 0, emergencia: 0, preventiva: 0 };
      const t = (o.tipo || 'manutencao') as 'limpeza' | 'manutencao' | 'emergencia' | 'preventiva';
      if (t in mapa[chave]) (mapa[chave] as any)[t]++;
    });
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).map(([_, v]) => v);
  }, [ordensFiltradas]);

  const osPorCondominio = useMemo(() => {
    const mapa: Record<string, number> = {};
    ordensFiltradas.forEach((o: any) => {
      const nome = condominios.find((c: any) => c.id === o.condominioId)?.nome || o.condominioNome || '—';
      mapa[nome] = (mapa[nome] || 0) + 1;
    });
    return Object.entries(mapa).map(([nome, os]) => ({ nome, os })).sort((a, b) => b.os - a.os);
  }, [ordensFiltradas, condominios]);

  const porTipo = useMemo(() => {
    const mapa: Record<string, number> = {};
    ordensFiltradas.forEach((o: any) => { mapa[o.tipo || 'outro'] = (mapa[o.tipo || 'outro'] || 0) + 1; });
    return Object.entries(mapa).map(([nome, valor]) => ({ nome, valor }));
  }, [ordensFiltradas]);

  const porStatus = useMemo(() => {
    const mapa: Record<string, number> = {};
    ordensFiltradas.forEach((o: any) => { mapa[o.status || 'aberta'] = (mapa[o.status || 'aberta'] || 0) + 1; });
    return Object.entries(mapa).map(([nome, valor]) => ({ nome, valor }));
  }, [ordensFiltradas]);

  const limparFiltros = () => {
    setDataIni(inicioPadrao.toISOString().slice(0, 10));
    setDataFim(hoje.toISOString().slice(0, 10));
    setCondId('todos'); setBloco('todos'); setMoradorId('todos');
    setTipo('todos'); setStatus('todos'); setPrioridade('todos');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;

  return (
    <div id="relatorios-content">
      <HowItWorks
        titulo="Relatórios e Gráficos"
        descricao="Visualize relatórios completos do sistema com filtros por período, condomínio, bloco, morador e tipo."
        passos={[
          'Selecione o período, condomínio, bloco, morador e tipo',
          'Os gráficos e contagens se ajustam automaticamente',
          'Compare dados entre condomínios e funcionários',
          'Analise tendências de OS, reclamações e custos',
          'Exporte em PDF ou imprima',
        ]}
      />

      <PageHeader
        titulo="Relatórios"
        subtitulo={`${ordensFiltradas.length} OS · ${reclamacoesFiltradas.length} reclamações no filtro`}
        onCompartilhar={() => compartilharConteudo('Relatórios', 'Relatórios do sistema App Síndico')}
        onImprimir={() => imprimirElemento('relatorios-content')}
        onGerarPdf={() => gerarPdfDeElemento('relatorios-content', 'relatorios')}
      />

      {/* ═══ Filtros ═══ */}
      <Card padding="md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <FilterIcon size={16} style={{ color: 'var(--cor-primaria)' }} />
          <strong style={{ fontSize: 14 }}>Filtros</strong>
          <button onClick={limparFiltros}
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--cor-borda)', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            <RefreshCw size={12} /> Limpar
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            De
            <input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Até
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Condomínio
            <select value={condId} onChange={e => { setCondId(e.target.value); setBloco('todos'); setMoradorId('todos'); }}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }}>
              <option value="todos">Todos</option>
              {condominios.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Bloco
            <select value={bloco} onChange={e => setBloco(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }}>
              <option value="todos">Todos</option>
              {blocosDisponiveis.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Morador
            <select value={moradorId} onChange={e => setMoradorId(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }}>
              <option value="todos">Todos</option>
              {moradoresDisponiveis.map((m: any) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Tipo
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }}>
              <option value="todos">Todos</option>
              {TIPOS_OS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Status
            <select value={status} onChange={e => setStatus(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }}>
              <option value="todos">Todos</option>
              <option value="aberta">Aberta</option>
              <option value="em_andamento">Em andamento</option>
              <option value="aguardando">Aguardando</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 500 }}>
            Prioridade
            <select value={prioridade} onChange={e => setPrioridade(e.target.value)}
              style={{ padding: 6, border: '1px solid var(--cor-borda)', borderRadius: 6, fontSize: 12.5 }}>
              <option value="todos">Todas</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </label>
        </div>
      </Card>

      {/* ═══ KPIs ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, margin: '12px 0' }}>
        {[
          { label: 'Total OS', valor: ordensFiltradas.length, cor: '#1a73e8' },
          { label: 'OS Concluídas', valor: ordensFiltradas.filter((o: any) => o.status === 'concluida').length, cor: '#16a34a' },
          { label: 'OS Abertas', valor: ordensFiltradas.filter((o: any) => o.status === 'aberta').length, cor: '#f59e0b' },
          { label: 'Urgentes', valor: ordensFiltradas.filter((o: any) => o.prioridade === 'urgente').length, cor: '#dc2626' },
          { label: 'Reclamações', valor: reclamacoesFiltradas.length, cor: '#9333ea' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--cor-superficie)', border: '1.5px solid var(--cor-borda)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11.5, color: 'var(--cor-texto-secundario)', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.cor }}>{k.valor}</div>
          </div>
        ))}
      </div>

      <div className={styles.chartsRow}>
        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <BarChart3 size={18} style={{ color: 'var(--cor-primaria)' }} /> OS por Mês
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={osMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="mes" fontSize={12} stroke="var(--cor-texto-secundario)" />
              <YAxis fontSize={12} stroke="var(--cor-texto-secundario)" />
              <Tooltip contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }} />
              <Bar dataKey="limpeza" fill="#1a73e8" radius={[4, 4, 0, 0]} name="Limpeza" />
              <Bar dataKey="manutencao" fill="#00897b" radius={[4, 4, 0, 0]} name="Manutenção" />
              <Bar dataKey="emergencia" fill="#d32f2f" radius={[4, 4, 0, 0]} name="Emergência" />
              <Bar dataKey="preventiva" fill="#7b1fa2" radius={[4, 4, 0, 0]} name="Preventiva" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <PieIcon size={18} style={{ color: 'var(--cor-primaria)' }} /> OS por Tipo
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={porTipo} cx="50%" cy="50%" outerRadius={100} dataKey="valor" nameKey="nome" label={({ nome, valor }: any) => `${nome}: ${valor}`}>
                {porTipo.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className={styles.chartsRow}>
        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <Activity size={18} style={{ color: 'var(--cor-primaria)' }} /> OS por Status
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={porStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="nome" fontSize={12} stroke="var(--cor-texto-secundario)" />
              <YAxis fontSize={12} stroke="var(--cor-texto-secundario)" />
              <Tooltip contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }} />
              <Bar dataKey="valor" fill="#1a73e8" radius={[4, 4, 0, 0]} name="OS" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padding="md">
          <h3 className={styles.chartTitle}>
            <TrendingUp size={18} style={{ color: 'var(--cor-primaria)' }} /> Custos Mensais
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={resumo.custoMensal || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
              <XAxis dataKey="mes" fontSize={12} stroke="var(--cor-texto-secundario)" />
              <YAxis fontSize={12} stroke="var(--cor-texto-secundario)" />
              <Tooltip contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }} formatter={(v: number) => `R$ ${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="custo" fill="var(--cor-primaria-light)" stroke="var(--cor-primaria)" strokeWidth={2} name="Custo" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card padding="md">
        <h3 className={styles.chartTitle}>OS por Condomínio</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={osPorCondominio}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cor-borda)" />
            <XAxis dataKey="nome" fontSize={12} stroke="var(--cor-texto-secundario)" />
            <YAxis fontSize={12} stroke="var(--cor-texto-secundario)" />
            <Tooltip contentStyle={{ background: 'var(--cor-superficie)', border: '1px solid var(--cor-borda)', borderRadius: 8 }} />
            <Bar dataKey="os" fill="#1a73e8" radius={[4, 4, 0, 0]} name="Ordens de Serviço" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default RelatoriosPage;
