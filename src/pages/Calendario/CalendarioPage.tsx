import React, { useEffect, useState, useMemo } from 'react';
import { ordensServico, planosManutencao, vencimentos as vencimentosApi, escalas as escalasApi, condominios as condominiosApi } from '../../services/api';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Modal from '../../components/Common/Modal';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react';
import styles from './CalendarioPage.module.css';

interface CalendarEvent {
  id: string;
  titulo: string;
  data: string;
  tipo: 'os' | 'plano' | 'vencimento' | 'escala';
  status?: string;
  prioridade?: string;
  extra?: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CalendarioPage: React.FC = () => {
  const [mesAtual, setMesAtual] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filtro, setFiltro] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [condominiosList, setCondominiosList] = useState<any[]>([]);
  const [showNova, setShowNova] = useState(false);
  const novaVazia = { condominioId: '', tipo: 'Equipamento', local: '', ultima: '', proxima: '', proxima2: '', proxima3: '', observacoes: '', imagem: '', email1: '', email2: '', diasAviso: 7 };
  const [novaForm, setNovaForm] = useState(novaVazia);
  const [salvandoNova, setSalvandoNova] = useState(false);
  const [editandoPlanoId, setEditandoPlanoId] = useState<string | null>(null);

  const abrirEditarPlano = async (planoId: string) => {
    try {
      const p: any = await planosManutencao.get(planoId);
      const titulo = String(p.titulo || '');
      const sep = titulo.indexOf(': ');
      const tipo = sep > 0 ? titulo.slice(0, sep) : 'Equipamento';
      const local = sep > 0 ? titulo.slice(sep + 2) : titulo;
      setEditandoPlanoId(planoId);
      setNovaForm({
        condominioId: p.condominioId || '',
        tipo,
        local,
        ultima: p.ultimaExecucao?.slice(0, 10) || p.dataInicio?.slice(0, 10) || '',
        proxima: p.proximaExecucao?.slice(0, 10) || p.vencimento1?.slice(0, 10) || '',
        proxima2: p.vencimento2?.slice(0, 10) || '',
        proxima3: p.vencimento3?.slice(0, 10) || '',
        observacoes: p.observacoes || '',
        imagem: p.imagem || '',
        email1: p.emailAviso1 || '',
        email2: p.emailAviso2 || '',
        diasAviso: p.diasAviso ?? 7,
      });
      setSelectedDay(null);
      setShowNova(true);
    } catch (err: any) {
      alert(err?.message || 'Erro ao carregar manutenção.');
    }
  };

  const excluirPlano = async (planoId: string) => {
    if (!confirm('Excluir esta manutenção?')) return;
    try {
      await planosManutencao.remove(planoId);
      setSelectedDay(null);
      loadEvents();
    } catch (err: any) {
      alert(err?.message || 'Erro ao excluir.');
    }
  };

  const fecharNova = () => {
    setShowNova(false);
    setEditandoPlanoId(null);
    setNovaForm(novaVazia);
  };

  useEffect(() => {
    loadEvents();
  }, [mesAtual]);

  useEffect(() => {
    condominiosApi.list().then((c: any) => setCondominiosList(c || [])).catch(() => setCondominiosList([]));
  }, []);

  const diffDias = (de: string, ate: string) => {
    if (!de || !ate) return null;
    const a = new Date(de + 'T00:00:00');
    const b = new Date(ate + 'T00:00:00');
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  };

  const inferirFrequencia = (dias: number) => {
    if (dias <= 1) return 'diaria';
    if (dias <= 7) return 'semanal';
    if (dias <= 15) return 'quinzenal';
    if (dias <= 35) return 'mensal';
    if (dias <= 70) return 'bimestral';
    if (dias <= 100) return 'trimestral';
    if (dias <= 200) return 'semestral';
    return 'anual';
  };

  const salvarNovaManutencao = async () => {
    if (!novaForm.condominioId || !novaForm.local.trim() || !novaForm.proxima) {
      alert('Preencha condomínio, local e a próxima manutenção.');
      return;
    }
    setSalvandoNova(true);
    try {
      const dias = novaForm.ultima ? diffDias(novaForm.ultima, novaForm.proxima) : null;
      const freq = dias && dias > 0 ? inferirFrequencia(dias) : 'mensal';
      const payload: any = {
        titulo: `${novaForm.tipo}: ${novaForm.local}`,
        descricao: novaForm.observacoes || `${novaForm.tipo} — ${novaForm.local}`,
        frequencia: freq,
        condominioId: novaForm.condominioId,
        dataInicio: novaForm.ultima || novaForm.proxima,
        observacoes: novaForm.observacoes,
        imagem: novaForm.imagem || null,
        emailAviso1: novaForm.email1 || null,
        emailAviso2: novaForm.email2 || null,
        diasAviso: Number(novaForm.diasAviso) || 0,
        vencimento1: novaForm.proxima || null,
        vencimento2: novaForm.proxima2 || null,
        vencimento3: novaForm.proxima3 || null,
        status: 'ativo',
      };
      if (editandoPlanoId) {
        await planosManutencao.update(editandoPlanoId, payload);
      } else {
        await planosManutencao.create(payload);
      }
      fecharNova();
      loadEvents();
    } catch (err: any) {
      alert(err?.message || 'Erro ao salvar manutenção.');
    } finally {
      setSalvandoNova(false);
    }
  };

  const hojeStr = new Date().toISOString().slice(0, 10);
  const diasDesdeUltima = novaForm.ultima ? diffDias(novaForm.ultima, hojeStr) : null;
  const diasAteProxima = novaForm.proxima ? diffDias(hojeStr, novaForm.proxima) : null;

  const loadEvents = async () => {
    setLoading(true);
    const evts: CalendarEvent[] = [];

    try {
      // OS
      const osData = await ordensServico.list();
      const osList = Array.isArray(osData) ? osData : (osData as any)?.data || [];
      for (const os of osList) {
        if (os.dataAbertura) {
          evts.push({ id: os.id, titulo: os.titulo, data: os.dataAbertura.slice(0, 10), tipo: 'os', status: os.status, prioridade: os.prioridade });
        }
        if (os.dataPrevisao) {
          evts.push({ id: `${os.id}-prev`, titulo: `[Previsão] ${os.titulo}`, data: os.dataPrevisao.slice(0, 10), tipo: 'os', status: os.status });
        }
      }
    } catch { /* ignore */ }

    try {
      // Planos preventivos
      const planos = await planosManutencao.list();
      for (const p of planos) {
        if (p.proximaExecucao) {
          evts.push({ id: p.id, titulo: p.titulo, data: p.proximaExecucao.slice(0, 10), tipo: 'plano', extra: p.frequencia });
        }
      }
    } catch { /* ignore */ }

    try {
      // Vencimentos
      const vencs = await vencimentosApi.list();
      for (const v of vencs) {
        if (v.dataVencimento) {
          evts.push({ id: v.id, titulo: v.titulo || v.descricao, data: v.dataVencimento.slice(0, 10), tipo: 'vencimento', status: v.status });
        }
      }
    } catch { /* ignore */ }

    try {
      // Escalas
      const escs = await escalasApi.list();
      for (const e of escs) {
        if (e.data) {
          evts.push({ id: e.id, titulo: e.titulo || `Escala - ${e.funcionarioNome || ''}`, data: e.data.slice(0, 10), tipo: 'escala' });
        }
      }
    } catch { /* ignore */ }

    setEvents(evts);
    setLoading(false);
  };

  const diasDoMes = useMemo(() => {
    const { year, month } = mesAtual;
    const primeiroDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasAntes = primeiroDia.getDay();
    const totalDias = ultimoDia.getDate();
    const dias: { date: Date; currentMonth: boolean }[] = [];

    // Dias do mês anterior
    for (let i = diasAntes - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      dias.push({ date: d, currentMonth: false });
    }
    // Dias do mês
    for (let i = 1; i <= totalDias; i++) {
      dias.push({ date: new Date(year, month, i), currentMonth: true });
    }
    // Dias do próximo mês (completar grid)
    const restante = 42 - dias.length;
    for (let i = 1; i <= restante; i++) {
      dias.push({ date: new Date(year, month + 1, i), currentMonth: false });
    }
    return dias;
  }, [mesAtual]);

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const today = formatDate(new Date());

  const filteredEvents = useMemo(() => {
    if (filtro === 'todos') return events;
    return events.filter(e => e.tipo === filtro);
  }, [events, filtro]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const e of filteredEvents) {
      if (!map[e.data]) map[e.data] = [];
      map[e.data].push(e);
    }
    return map;
  }, [filteredEvents]);

  const mesLabel = new Date(mesAtual.year, mesAtual.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const dayEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

  return (
    <div className={styles.calendarPage}>
      <PageHeader
        titulo="Calendário de Manutenção"
        subtitulo="Visão unificada de OS, planos, vencimentos e escalas"
        acoes={
          <button
            onClick={() => setShowNova(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--cor-primaria)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            <Plus size={16} /> Nova Manutenção
          </button>
        }
      />

      <Card>
        <div className={styles.controls}>
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={() => setMesAtual(p => {
              const d = new Date(p.year, p.month - 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
              <ChevronLeft size={16} />
            </button>
            <span className={styles.monthLabel}>{mesLabel}</span>
            <button className={styles.navBtn} onClick={() => setMesAtual(p => {
              const d = new Date(p.year, p.month + 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            })}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className={styles.filterGroup}>
            {['todos', 'os', 'plano', 'vencimento', 'escala'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filtro === f ? styles.filterBtnActive : ''}`}
                onClick={() => setFiltro(f)}
              >
                {f === 'todos' ? 'Todos' : f === 'os' ? 'OS' : f === 'plano' ? 'Planos' : f === 'vencimento' ? 'Vencimentos' : 'Escalas'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--cor-texto-secundario)' }}>Carregando...</div>
        ) : (
          <div className={styles.calendar}>
            {DIAS_SEMANA.map(d => <div key={d} className={styles.dayHeader}>{d}</div>)}
            {diasDoMes.map(({ date, currentMonth }, i) => {
              const dateStr = formatDate(date);
              const dayEvts = eventsByDate[dateStr] || [];
              const isToday = dateStr === today;
              return (
                <div
                  key={i}
                  className={`${styles.dayCell} ${!currentMonth ? styles.dayCellOther : ''} ${isToday ? styles.dayCellToday : ''}`}
                  onClick={() => { if (dayEvts.length > 0) setSelectedDay(dateStr); }}
                >
                  <div className={isToday ? styles.dayNumberToday : styles.dayNumber}>
                    {date.getDate()}
                  </div>
                  <div className={styles.eventList}>
                    {dayEvts.slice(0, 3).map(e => (
                      <div
                        key={e.id}
                        className={`${styles.event} ${
                          e.tipo === 'os' ? styles.eventOS :
                          e.tipo === 'plano' ? styles.eventPlano :
                          e.tipo === 'vencimento' ? styles.eventVencimento : styles.eventEscala
                        }`}
                      >
                        {e.titulo}
                      </div>
                    ))}
                    {dayEvts.length > 3 && <div className={styles.more}>+{dayEvts.length - 3} mais</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.legend}>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#dbeafe' }} /> OS</div>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#dcfce7' }} /> Planos Preventivos</div>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#fef3c7' }} /> Vencimentos</div>
          <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: '#ede9fe' }} /> Escalas</div>
        </div>
      </Card>

      {showNova && (
        <Modal aberto={true} titulo={editandoPlanoId ? 'Editar Manutenção' : 'Nova Manutenção'} largura="md" onFechar={fecharNova}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500, gridColumn: '1 / -1' }}>
              Condomínio (local) *
              <select value={novaForm.condominioId} onChange={e => setNovaForm({ ...novaForm, condominioId: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                <option value="">Selecione...</option>
                {condominiosList.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Tipo *
              <select value={novaForm.tipo} onChange={e => setNovaForm({ ...novaForm, tipo: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }}>
                <option value="Máquina">Máquina</option>
                <option value="Equipamento">Equipamento</option>
                <option value="Rotina">Rotina</option>
                <option value="Predial">Predial</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Hidráulica">Hidráulica</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Local / item *
              <input value={novaForm.local} onChange={e => setNovaForm({ ...novaForm, local: e.target.value })}
                placeholder="Ex: Bomba d'água, Elevador Bloco A"
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Última manutenção
              <input type="date" value={novaForm.ultima} onChange={e => setNovaForm({ ...novaForm, ultima: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              Próxima manutenção (1º vencimento) *
              <input type="date" value={novaForm.proxima} onChange={e => setNovaForm({ ...novaForm, proxima: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              2º vencimento (opcional)
              <input type="date" value={novaForm.proxima2} onChange={e => setNovaForm({ ...novaForm, proxima2: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              3º vencimento (opcional)
              <input type="date" value={novaForm.proxima3} onChange={e => setNovaForm({ ...novaForm, proxima3: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500, gridColumn: '1 / -1' }}>
              Imagem (opcional)
              <input type="file" accept="image/*" onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setNovaForm(p => ({ ...p, imagem: reader.result as string }));
                reader.readAsDataURL(file);
              }} style={{ fontSize: 13 }} />
              {novaForm.imagem && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={novaForm.imagem} alt="Pré-visualização" style={{ maxHeight: 90, maxWidth: 140, borderRadius: 6, border: '1px solid var(--cor-borda)' }} />
                  <button type="button" onClick={() => setNovaForm(p => ({ ...p, imagem: '' }))}
                    style={{ padding: '4px 10px', border: '1px solid var(--cor-borda)', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                    Remover
                  </button>
                </div>
              )}
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              E-mail para aviso (1)
              <input type="email" value={novaForm.email1} onChange={e => setNovaForm({ ...novaForm, email1: e.target.value })}
                placeholder="email@exemplo.com"
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500 }}>
              E-mail para aviso (2, opcional)
              <input type="email" value={novaForm.email2} onChange={e => setNovaForm({ ...novaForm, email2: e.target.value })}
                placeholder="email@exemplo.com"
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500, gridColumn: '1 / -1' }}>
              Avisar quantos dias antes da próxima manutenção
              <input type="number" min={0} max={365} value={novaForm.diasAviso}
                onChange={e => setNovaForm({ ...novaForm, diasAviso: Number(e.target.value) })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, fontSize: 13, maxWidth: 140 }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12.5, fontWeight: 500, gridColumn: '1 / -1' }}>
              Observações
              <textarea value={novaForm.observacoes} onChange={e => setNovaForm({ ...novaForm, observacoes: e.target.value })}
                style={{ padding: 8, border: '1.5px solid var(--cor-borda)', borderRadius: 8, minHeight: 60, fontSize: 13 }} />
            </label>
          </div>
          {(diasDesdeUltima !== null || diasAteProxima !== null) && (
            <div style={{ marginTop: 12, padding: 10, background: '#f1f5f9', borderRadius: 8, fontSize: 12.5, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {diasDesdeUltima !== null && diasDesdeUltima >= 0 && (
                <span><strong>{diasDesdeUltima}</strong> dia(s) desde a última</span>
              )}
              {diasAteProxima !== null && (
                <span style={{ color: diasAteProxima < 0 ? '#dc2626' : (diasAteProxima <= 7 ? '#d97706' : '#059669') }}>
                  {diasAteProxima < 0
                    ? <><strong>{Math.abs(diasAteProxima)}</strong> dia(s) em atraso</>
                    : <><strong>{diasAteProxima}</strong> dia(s) até a próxima</>}
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={fecharNova} style={{ padding: '8px 14px', border: '1px solid var(--cor-borda)', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={salvarNovaManutencao} disabled={salvandoNova}
              style={{ padding: '8px 14px', background: 'var(--cor-primaria)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {salvandoNova ? 'Salvando...' : (editandoPlanoId ? 'Salvar' : 'Cadastrar')}
            </button>
          </div>
        </Modal>
      )}

      {selectedDay && (
        <Modal aberto={true} titulo={`Eventos — ${new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR')}`} largura="md" onFechar={() => setSelectedDay(null)}>
          <div className={styles.detailList}>
            {dayEvents.map(e => (
              <div key={e.id} className={styles.detailItem}>
                <div className={styles.detailTitle}>
                  <span className={`${styles.event} ${
                    e.tipo === 'os' ? styles.eventOS :
                    e.tipo === 'plano' ? styles.eventPlano :
                    e.tipo === 'vencimento' ? styles.eventVencimento : styles.eventEscala
                  }`} style={{ display: 'inline-block', marginRight: 8 }}>
                    {e.tipo === 'os' ? 'OS' : e.tipo === 'plano' ? 'Plano' : e.tipo === 'vencimento' ? 'Vencimento' : 'Escala'}
                  </span>
                  {e.titulo}
                </div>
                {e.status && <div className={styles.detailMeta}>Status: {e.status}</div>}
                {e.prioridade && <div className={styles.detailMeta}>Prioridade: {e.prioridade}</div>}
                {e.extra && <div className={styles.detailMeta}>{e.extra}</div>}
                {e.tipo === 'plano' && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button onClick={() => abrirEditarPlano(e.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid var(--cor-borda)', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      <Pencil size={12} /> Editar
                    </button>
                    <button onClick={() => excluirPlano(e.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      <Trash2 size={12} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarioPage;
