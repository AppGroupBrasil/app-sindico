import React, { useEffect, useState, useMemo } from 'react';
import { ordensServico, planosManutencao, vencimentos as vencimentosApi, escalas as escalasApi } from '../../services/api';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Modal from '../../components/Common/Modal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

  useEffect(() => {
    loadEvents();
  }, [mesAtual]);

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
      <PageHeader titulo="Calendário de Manutenção" subtitulo="Visão unificada de OS, planos, vencimentos e escalas" />

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
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarioPage;
