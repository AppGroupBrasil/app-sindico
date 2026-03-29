import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import HowItWorks from '../../components/Common/HowItWorks';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import StatusBadge from '../../components/Common/StatusBadge';
import Modal from '../../components/Common/Modal';
import { compartilharConteudo, imprimirElemento, gerarPdfDeElemento } from '../../utils/exportUtils';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  Plus, QrCode, Search, X, Hash, Trash2, Upload, Eye, Star,
  ChevronRight, ChevronDown, GripVertical, Image, CheckSquare,
  AlertTriangle, MessageCircle, Bell, FileText, BarChart3,
  UserCheck, Building2, Home, Settings, Copy, Download, Mail, Phone, Siren, CalendarPlus, Fingerprint, MapPin, Clock, LogIn, LogOut as LogOutIcon, ClipboardCheck, Hourglass, Play, Square, Flag, PenTool, RotateCcw, Camera, Wrench, Printer, Heart
} from 'lucide-react';
import { useDemo } from '../../contexts/DemoContext';
import { qrcodes as qrcodesApi } from '../../services/api';
import styles from './QRCode.module.css';

/* ═══════════════════════════════════════
   TIPOS
═══════════════════════════════════════ */

const FUNCOES_QR: { id: string; label: string; rota: string }[] = [
  { id: 'dashboard', label: 'Dashboard', rota: '/dashboard' },
  { id: 'quadro-atividades', label: 'Quadro de Atividades', rota: '/quadro-atividades' },
  { id: 'ordens', label: 'Ordens de Serviço', rota: '/ordens-servico' },
  { id: 'checklists', label: 'Checklists', rota: '/checklists' },
  { id: 'vistorias', label: 'Vistorias', rota: '/vistorias' },
  { id: 'reportes', label: 'Reportes', rota: '/reportes' },
  { id: 'tarefas', label: 'Tarefas Agendadas', rota: '/tarefas' },
  { id: 'roteiros', label: 'Roteiro de Execução', rota: '/roteiros' },
  { id: 'materiais', label: 'Controle de Estoque', rota: '/materiais' },
  { id: 'leitor-qrcode', label: 'Leitor QR Code', rota: '/leitor-qrcode' },
  { id: 'escalas', label: 'Escalas', rota: '/escalas' },
  { id: 'vencimentos', label: 'Agenda de Vencimentos', rota: '/vencimentos' },
  { id: 'inspecoes', label: 'Inspeções', rota: '/inspecoes' },
  { id: 'comunicados', label: 'Comunicados / Avisos', rota: '/comunicados' },
  { id: 'moradores', label: 'Cadastro de Moradores', rota: '/moradores' },
  { id: 'condominios', label: 'Condomínios', rota: '/condominios' },
  { id: 'usuarios', label: 'Cadastro de Usuários', rota: '/usuarios' },
  { id: 'geolocalizacao', label: 'Geolocalização', rota: '/geolocalizacao' },
  { id: 'relatorios', label: 'Relatórios', rota: '/relatorios' },
  { id: 'configuracoes', label: 'Configurações', rota: '/configuracoes' },
];
type BlocoTipo =
  | 'titulo' | 'subtitulo' | 'texto' | 'galeria' | 'descricao'
  | 'checklist' | 'status' | 'prioridade' | 'avaliacao_estrela'
  | 'avaliacao_escala' | 'pergunta' | 'aviso' | 'comunicado' | 'feedback' | 'urgencia' | 'agendar_servico' | 'pesquisa_satisfacao' | 'controle_ponto' | 'sla_tempo' | 'assinatura_digital' | 'ocorrencia' | 'manutencao';

interface BlocoConfig {
  id: string;
  tipo: BlocoTipo;
  label: string;
  obrigatorio: boolean;
  opcoes?: string[]; // para checklist, status, prioridade, pergunta
  maxFotos?: number; // para galeria
  maxEstrelas?: number; // para avaliação estrela (1-5)
  escalaMax?: number; // para avaliação escala (0-10)
}

interface QRCodeFormulario {
  id: string;
  nome: string;
  descricao: string;
  logo: string | null;
  blocos: BlocoConfig[];
  dispensarIdentificacao: boolean;
  blocosCadastrados: string[];
  criadoPor: string;
  criadoEm: number;
  respostas: number;
  ativo: boolean;
}

interface Identificacao {
  tipo: 'morador' | 'funcionario' | 'prestador' | '';
  nome: string;
  bloco: string;
  unidade: string;
  anonimo: boolean;
}

interface RespostaBlocos {
  [blocoId: string]: any;
}

/* ═══════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════ */
const BLOCOS_DISPONIVEIS: { tipo: BlocoTipo; label: string; icone: React.ReactNode; cor: string }[] = [
  { tipo: 'titulo', label: 'Título', icone: <FileText size={18} />, cor: '#1565c0' },
  { tipo: 'subtitulo', label: 'Sub-título', icone: <FileText size={18} />, cor: '#1976d2' },
  { tipo: 'texto', label: 'Texto', icone: <FileText size={18} />, cor: '#2196f3' },
  { tipo: 'galeria', label: 'Galeria de Fotos', icone: <Image size={18} />, cor: '#7b1fa2' },
  { tipo: 'descricao', label: 'Descrição', icone: <FileText size={18} />, cor: '#00838f' },
  { tipo: 'checklist', label: 'Checklist', icone: <CheckSquare size={18} />, cor: '#2e7d32' },
  { tipo: 'status', label: 'Status', icone: <BarChart3 size={18} />, cor: '#f57c00' },
  { tipo: 'prioridade', label: 'Prioridade', icone: <AlertTriangle size={18} />, cor: '#d32f2f' },
  { tipo: 'avaliacao_estrela', label: 'Avaliação Estrela (1-5)', icone: <Star size={18} />, cor: '#fbc02d' },
  { tipo: 'avaliacao_escala', label: 'Avaliação Escala (0-10)', icone: <BarChart3 size={18} />, cor: '#e65100' },
  { tipo: 'pergunta', label: 'Perguntas e Respostas', icone: <MessageCircle size={18} />, cor: '#5c6bc0' },
  { tipo: 'aviso', label: 'Avisos', icone: <AlertTriangle size={18} />, cor: '#ff6f00' },
  { tipo: 'comunicado', label: 'Comunicados', icone: <Bell size={18} />, cor: '#00695c' },
  { tipo: 'feedback', label: 'Feedback', icone: <Mail size={18} />, cor: '#0277bd' },
  { tipo: 'urgencia', label: 'Reportar Urgências', icone: <Siren size={18} />, cor: '#b71c1c' },
  { tipo: 'agendar_servico', label: 'Agendar Serviço Extra', icone: <CalendarPlus size={18} />, cor: '#4a148c' },
  { tipo: 'pesquisa_satisfacao', label: 'Pesquisa de Satisfação', icone: <ClipboardCheck size={18} />, cor: '#00695c' },
  { tipo: 'controle_ponto', label: 'Controle de Ponto', icone: <Fingerprint size={18} />, cor: '#1565c0' },
  { tipo: 'sla_tempo', label: 'SLA — Tempo de Resposta', icone: <Hourglass size={18} />, cor: '#e65100' },
  { tipo: 'assinatura_digital', label: 'Assinatura Digital', icone: <PenTool size={18} />, cor: '#4527a0' },
  { tipo: 'ocorrencia', label: 'Informar Ocorrência', icone: <Camera size={18} />, cor: '#c62828' },
  { tipo: 'manutencao', label: 'Problema de Manutenção', icone: <Wrench size={18} />, cor: '#e65100' },
];

const BLOCOS_PADRAO = ['Bloco A', 'Bloco B', 'Bloco C', 'Bloco D', 'Torre 1', 'Torre 2', 'Funcionário', 'Prestador'];



interface RegistroPonto {
  funcionario: { nome: string; email: string; cargo?: string; perfil: string };
  tipo: 'entrada' | 'saida';
  dataHora: string;
  geolocalizacao: { latitude: number; longitude: number } | null;
  endereco: string | null;
  permanencia?: string;
}



function formatarDuracao(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
}

const PERFIL_LABELS: Record<string, string> = { master: 'Master', administrador: 'Administrador', supervisor: 'Supervisor', funcionario: 'Funcionário' };

/* ── Componente Controle de Ponto ── */
const ControlePontoBloco: React.FC<{
  blocoId: string;
  valor: any;
  setRespostas: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}> = ({ blocoId, valor, setRespostas }) => {
  const { usuario } = useAuth();
  const [carregando, setCarregando] = useState(false);
  const [pontoAtivo, setPontoAtivo] = useState<{ entrada: string; lat?: number; lon?: number } | null>(() => {
    try { const v = localStorage.getItem('gestao-ponto-ativo'); return v ? JSON.parse(v) : null; } catch { return null; }
  });
  const [timer, setTimer] = useState('00:00:00');
  const [geo, setGeo] = useState<{ lat: number; lon: number; endereco: string | null } | null>(null);
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    qrcodesApi.listPonto().then((data: any[]) => {
      setRegistros(data.map((r: any) => ({
        funcionario: { nome: r.funcionarioNome, email: r.funcionarioEmail, cargo: r.funcionarioCargo, perfil: '' },
        tipo: r.tipo,
        dataHora: r.dataHora,
        geolocalizacao: r.latitude ? { latitude: r.latitude, longitude: r.longitude } : null,
        endereco: r.endereco,
        permanencia: r.permanencia,
      })));
    }).catch(() => {});
  }, []);

  // Timer
  useEffect(() => {
    if (!pontoAtivo) { setTimer('00:00:00'); return; }
    const atualizar = () => {
      const diff = Date.now() - new Date(pontoAtivo.entrada).getTime();
      setTimer(formatarDuracao(diff));
    };
    atualizar();
    timerRef.current = window.setInterval(atualizar, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pontoAtivo]);

  const capturarGeo = useCallback(async () => {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      );
      let endereco: string | null = null;
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'pt-BR' } }
        );
        if (resp.ok) { const d = await resp.json(); endereco = d.display_name || null; }
      } catch {}
      return { lat: pos.coords.latitude, lon: pos.coords.longitude, endereco };
    } catch { return null; }
  }, []);

  const registrarEntrada = async () => {
    setCarregando(true);
    const geoData = await capturarGeo();
    setGeo(geoData);
    const agora = new Date().toISOString();
    const ativo = { entrada: agora, lat: geoData?.lat, lon: geoData?.lon };
    setPontoAtivo(ativo);
    localStorage.setItem('gestao-ponto-ativo', JSON.stringify(ativo));

    const reg: RegistroPonto = {
      funcionario: {
        nome: usuario?.nome || 'Desconhecido',
        email: usuario?.email || '',
        cargo: usuario?.cargo,
        perfil: PERFIL_LABELS[usuario?.role || 'funcionario'] || '',
      },
      tipo: 'entrada',
      dataHora: agora,
      geolocalizacao: geoData ? { latitude: geoData.lat, longitude: geoData.lon } : null,
      endereco: geoData?.endereco || null,
    };
    try {
      await qrcodesApi.addPonto({
        tipo: 'entrada',
        funcionarioNome: reg.funcionario.nome,
        funcionarioEmail: reg.funcionario.email,
        funcionarioCargo: reg.funcionario.cargo,
        latitude: geoData?.lat,
        longitude: geoData?.lon,
        endereco: geoData?.endereco,
      });
    } catch {}
    setRegistros(prev => [reg, ...prev]);
    setRespostas(prev => ({ ...prev, [blocoId]: { ...reg, tipo: 'entrada' } }));
    setCarregando(false);
  };

  const registrarSaida = async () => {
    setCarregando(true);
    const geoData = await capturarGeo();
    setGeo(geoData);
    const agora = new Date().toISOString();
    const permanencia = pontoAtivo ? formatarDuracao(Date.now() - new Date(pontoAtivo.entrada).getTime()) : '—';

    const reg: RegistroPonto = {
      funcionario: {
        nome: usuario?.nome || 'Desconhecido',
        email: usuario?.email || '',
        cargo: usuario?.cargo,
        perfil: PERFIL_LABELS[usuario?.role || 'funcionario'] || '',
      },
      tipo: 'saida',
      dataHora: agora,
      geolocalizacao: geoData ? { latitude: geoData.lat, longitude: geoData.lon } : null,
      endereco: geoData?.endereco || null,
      permanencia,
    };
    try {
      await qrcodesApi.addPonto({
        tipo: 'saida',
        funcionarioNome: reg.funcionario.nome,
        funcionarioEmail: reg.funcionario.email,
        funcionarioCargo: reg.funcionario.cargo,
        latitude: geoData?.lat,
        longitude: geoData?.lon,
        endereco: geoData?.endereco,
        permanencia,
      });
    } catch {}
    setRegistros(prev => [reg, ...prev]);
    setRespostas(prev => ({ ...prev, [blocoId]: { ...reg, tipo: 'saida', permanencia } }));
    setPontoAtivo(null);
    localStorage.removeItem('gestao-ponto-ativo');
    setCarregando(false);
  };

  const formatarDataHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={styles.pontoFields}>
      <div className={styles.pontoBanner}>
        <Fingerprint size={20} />
        <span>Registre entrada ou saída — o sistema captura localização e tempo automaticamente</span>
      </div>

      {/* Dados do funcionário */}
      <div className={styles.pontoDadosFuncionario}>
        <UserCheck size={16} />
        <div>
          <strong>{usuario?.nome || 'Funcionário'}</strong>
          <span>{usuario?.email}{usuario?.cargo ? ` · ${usuario.cargo}` : ''} · {PERFIL_LABELS[usuario?.role || 'funcionario']}</span>
        </div>
      </div>

      {/* Timer */}
      {pontoAtivo && (
        <div className={styles.pontoTimer}>
          <Clock size={18} />
          <span className={styles.pontoTimerValor}>{timer}</span>
          <span className={styles.pontoTimerLabel}>em serviço</span>
        </div>
      )}

      {/* Botões */}
      <div className={styles.pontoBotoes}>
        <button
          className={`${styles.pontoBtnEntrada} ${pontoAtivo ? styles.pontoBtnDesabilitado : ''}`}
          onClick={registrarEntrada}
          disabled={!!pontoAtivo || carregando}
        >
          <LogIn size={18} />
          {carregando && !pontoAtivo ? 'Registrando...' : 'Registrar Entrada'}
        </button>
        <button
          className={`${styles.pontoBtnSaida} ${!pontoAtivo ? styles.pontoBtnDesabilitado : ''}`}
          onClick={registrarSaida}
          disabled={!pontoAtivo || carregando}
        >
          <LogOutIcon size={18} />
          {carregando && pontoAtivo ? 'Registrando...' : 'Registrar Saída'}
        </button>
      </div>

      {/* Localização atual */}
      {geo && (
        <div className={styles.pontoGeo}>
          <MapPin size={14} />
          <span>{geo.endereco || `${geo.lat.toFixed(6)}, ${geo.lon.toFixed(6)}`}</span>
        </div>
      )}

      {/* Histórico recente */}
      {registros.length > 0 && (
        <div className={styles.pontoHistorico}>
          <h5>Registros Recentes</h5>
          {registros.slice(0, 6).map((r, i) => (
            <div key={i} className={`${styles.pontoRegistro} ${r.tipo === 'entrada' ? styles.pontoRegEntrada : styles.pontoRegSaida}`}>
              <div className={styles.pontoRegIcone}>
                {r.tipo === 'entrada' ? <LogIn size={14} /> : <LogOutIcon size={14} />}
              </div>
              <div className={styles.pontoRegInfo}>
                <strong>{r.tipo === 'entrada' ? 'Entrada' : 'Saída'}</strong>
                <span>{r.funcionario.nome} · {formatarDataHora(r.dataHora)}</span>
                {r.endereco && <span className={styles.pontoRegEndereco}><MapPin size={10} /> {r.endereco.length > 60 ? r.endereco.slice(0, 60) + '...' : r.endereco}</span>}
                {r.permanencia && <span className={styles.pontoRegPermanencia}><Clock size={10} /> Permanência: {r.permanencia}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════
   SLA — TEMPO DE RESPOSTA
═══════════════════════════════════════ */
interface SlaRegistro {
  id: string;
  blocoId: string;
  categoria: string;
  descricao: string;
  abertura: string;
  inicioAtendimento?: string;
  encerramento?: string;
  status: 'aberto' | 'em_atendimento' | 'resolvido';
}

const formatarTempoSla = (ms: number): string => {
  const seg = Math.floor(ms / 1000);
  const min = Math.floor(seg / 60);
  const hrs = Math.floor(min / 60);
  const dias = Math.floor(hrs / 24);
  if (dias > 0) return `${dias}d ${hrs % 24}h ${min % 60}m`;
  if (hrs > 0) return `${hrs}h ${min % 60}m ${seg % 60}s`;
  if (min > 0) return `${min}m ${seg % 60}s`;
  return `${seg}s`;
};

const SlaTempoBloco: React.FC<{
  blocoId: string;
  bloco: { opcoes?: string[] };
  valor: any;
  setRespostas: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}> = ({ blocoId, bloco, valor, setRespostas }) => {
  const [registros, setRegistros] = useState<SlaRegistro[]>([]);
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    qrcodesApi.listSla().then((data: any[]) => {
      setRegistros(data.filter((r: any) => r.blocoId === blocoId).slice(-10));
    }).catch(() => {});
  }, [blocoId]);

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const abrirChamado = async () => {
    if (!categoria) return;
    try {
      const novo = await qrcodesApi.createSla({ blocoId, categoria, descricao, status: 'aberto' });
      const updated = [novo, ...registros].slice(-10);
      setRegistros(updated);
      setCategoria('');
      setDescricao('');
      setRespostas(prev => ({ ...prev, [blocoId]: updated }));
    } catch {}
  };

  const mudarStatus = async (id: string, novoStatus: 'em_atendimento' | 'resolvido') => {
    try {
      const updated = await qrcodesApi.updateSla(id, novoStatus);
      setRegistros(prev => prev.map(r => r.id === id ? {
        ...r,
        status: novoStatus,
        inicioAtendimento: novoStatus === 'em_atendimento' ? (updated.inicioAtendimento || new Date().toISOString()) : r.inicioAtendimento,
        encerramento: novoStatus === 'resolvido' ? (updated.encerramento || new Date().toISOString()) : r.encerramento,
      } : r));
      setRespostas(prev => ({ ...prev, [blocoId]: registros }));
    } catch {}
  };

  const tempoDecorrido = (desde: string): string => formatarTempoSla(agora - new Date(desde).getTime());

  const statusLabel: Record<string, string> = { aberto: 'Aberto', em_atendimento: 'Em Atendimento', resolvido: 'Resolvido' };
  const statusCor: Record<string, string> = { aberto: '#e53935', em_atendimento: '#fb8c00', resolvido: '#43a047' };

  return (
    <div className={styles.slaFields}>
      <div className={styles.slaBanner}>
        <Hourglass size={18} />
        <span>SLA — Tempo de Resposta</span>
      </div>

      <div className={styles.slaNovoChamado}>
        <label className={styles.slaLabel}>Categoria</label>
        <div className={styles.slaOpcoes}>
          {(bloco.opcoes || []).map(op => (
            <button
              key={op}
              type="button"
              className={categoria === op ? styles.slaItemAtivo : styles.slaItem}
              onClick={() => setCategoria(op)}
            >
              {op}
            </button>
          ))}
        </div>

        <label className={styles.slaLabel}>Descrição da ocorrência</label>
        <textarea
          className={styles.slaTextarea}
          rows={3}
          placeholder="Descreva brevemente a ocorrência..."
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
        />

        <button type="button" className={styles.slaBtnAbrir} onClick={abrirChamado} disabled={!categoria}>
          <Flag size={16} /> Abrir Chamado
        </button>
      </div>

      {registros.length > 0 && (
        <div className={styles.slaHistorico}>
          <h4 className={styles.slaHistoricoTitulo}>Chamados Recentes</h4>
          {registros.slice().reverse().map(reg => (
            <div key={reg.id} className={styles.slaRegistro}>
              <div className={styles.slaRegHeader}>
                <span className={styles.slaRegCategoria}>{reg.categoria}</span>
                <span className={styles.slaRegStatus} style={{ background: statusCor[reg.status] }}>
                  {statusLabel[reg.status]}
                </span>
              </div>
              {reg.descricao && <p className={styles.slaRegDescricao}>{reg.descricao}</p>}
              <div className={styles.slaRegTempos}>
                <div className={styles.slaRegTempo}>
                  <Clock size={14} />
                  <span>Aberto: {new Date(reg.abertura).toLocaleString('pt-BR')}</span>
                </div>
                {reg.status === 'aberto' && (
                  <div className={styles.slaRegTimer}>
                    <Hourglass size={14} className={styles.slaTimerPulse} />
                    <span>Aguardando há <strong>{tempoDecorrido(reg.abertura)}</strong></span>
                  </div>
                )}
                {reg.inicioAtendimento && (
                  <div className={styles.slaRegTempo}>
                    <Play size={14} />
                    <span>Atendimento: {new Date(reg.inicioAtendimento).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {reg.status === 'em_atendimento' && reg.inicioAtendimento && (
                  <div className={styles.slaRegTimer}>
                    <Hourglass size={14} className={styles.slaTimerPulse} />
                    <span>Em atendimento há <strong>{tempoDecorrido(reg.inicioAtendimento)}</strong></span>
                  </div>
                )}
                {reg.encerramento && (
                  <div className={styles.slaRegTempo}>
                    <Square size={14} />
                    <span>Encerrado: {new Date(reg.encerramento).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {reg.encerramento && (
                  <div className={styles.slaRegTempoTotal}>
                    Tempo total: <strong>{formatarTempoSla(new Date(reg.encerramento).getTime() - new Date(reg.abertura).getTime())}</strong>
                  </div>
                )}
              </div>
              <div className={styles.slaRegAcoes}>
                {reg.status === 'aberto' && (
                  <button type="button" className={styles.slaBtnAtender} onClick={() => mudarStatus(reg.id, 'em_atendimento')}>
                    <Play size={14} /> Iniciar Atendimento
                  </button>
                )}
                {reg.status === 'em_atendimento' && (
                  <button type="button" className={styles.slaBtnResolver} onClick={() => mudarStatus(reg.id, 'resolvido')}>
                    <Square size={14} /> Marcar Resolvido
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════
   ASSINATURA DIGITAL
═══════════════════════════════════════ */
const AssinaturaDigitalBloco: React.FC<{
  blocoId: string;
  bloco: { opcoes?: string[] };
  valor: any;
  setRespostas: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}> = ({ blocoId, bloco, valor, setRespostas }) => {
  const { usuario } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [desenhando, setDesenhando] = useState(false);
  const [assinado, setAssinado] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [concordo, setConcordo] = useState(false);
  const [dataHora, setDataHora] = useState('');

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext('2d', { willReadFrequently: true });
  }, []);

  const limparCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // linha guia
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 30);
    ctx.lineTo(canvas.width - 20, canvas.height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    setAssinado(false);
    setConfirmado(false);
    setRespostas(prev => ({ ...prev, [blocoId]: undefined }));
  }, [blocoId, getCtx, setRespostas]);

  useEffect(() => {
    limparCanvas();
  }, [limparCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const iniciarDesenho = (e: React.MouseEvent | React.TouchEvent) => {
    if (confirmado) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDesenhando(true);
    setAssinado(true);
  };

  const desenhar = (e: React.MouseEvent | React.TouchEvent) => {
    if (!desenhando || confirmado) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const pararDesenho = () => setDesenhando(false);

  const confirmarAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas || !assinado || !concordo) return;
    const agora = new Date();
    setDataHora(agora.toLocaleString('pt-BR'));
    const imgData = canvas.toDataURL('image/png');
    setConfirmado(true);
    setRespostas(prev => ({
      ...prev,
      [blocoId]: {
        imagem: imgData,
        signatario: usuario?.nome || 'Não identificado',
        email: usuario?.email || '',
        dataHora: agora.toISOString(),
        termoAceito: (bloco.opcoes || ['Serviço executado conforme solicitado'])[0],
      },
    }));
  };

  const termoTexto = (bloco.opcoes || ['Serviço executado conforme solicitado'])[0];

  return (
    <div className={styles.assinaturaFields}>
      <div className={styles.assinaturaBanner}>
        <PenTool size={18} />
        <span>Assinatura Digital</span>
      </div>

      <div className={styles.assinaturaInfo}>
        <div className={styles.assinaturaInfoItem}>
          <UserCheck size={14} />
          <span>{usuario?.nome || 'Não identificado'}</span>
        </div>
        {usuario?.email && (
          <div className={styles.assinaturaInfoItem}>
            <Mail size={14} />
            <span>{usuario.email}</span>
          </div>
        )}
        <div className={styles.assinaturaInfoItem}>
          <Clock size={14} />
          <span>{dataHora || new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <div className={styles.assinaturaCanvasWrapper}>
        <canvas
          ref={canvasRef}
          width={500}
          height={180}
          className={`${styles.assinaturaCanvas} ${confirmado ? styles.assinaturaCanvasConfirmado : ''}`}
          onMouseDown={iniciarDesenho}
          onMouseMove={desenhar}
          onMouseUp={pararDesenho}
          onMouseLeave={pararDesenho}
          onTouchStart={iniciarDesenho}
          onTouchMove={desenhar}
          onTouchEnd={pararDesenho}
        />
        {!confirmado && (
          <button type="button" className={styles.assinaturaBtnLimpar} onClick={limparCanvas} title="Limpar assinatura">
            <RotateCcw size={16} />
          </button>
        )}
        {!assinado && !confirmado && (
          <span className={styles.assinaturaPlaceholder}>Assine aqui</span>
        )}
      </div>

      <label className={styles.assinaturaCheckbox}>
        <input type="checkbox" checked={concordo} onChange={e => setConcordo(e.target.checked)} disabled={confirmado} />
        <span>{termoTexto}</span>
      </label>

      {!confirmado ? (
        <button
          type="button"
          className={styles.assinaturaBtnConfirmar}
          onClick={confirmarAssinatura}
          disabled={!assinado || !concordo}
        >
          <PenTool size={16} /> Confirmar Assinatura
        </button>
      ) : (
        <div className={styles.assinaturaConfirmada}>
          <CheckSquare size={18} />
          <div>
            <strong>Assinatura registrada</strong>
            <span>por {usuario?.nome || 'Não identificado'} em {dataHora}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════
   COMPONENTE PRINCIPAL
═══════════════════════════════════════ */
const QRCodePage: React.FC = () => {
  const { usuario } = useAuth();
  const { roleNivel } = usePermissions();
  const { tentarAcao } = useDemo();
  const role = usuario?.role || 'funcionario';
  const ehMasterOuAdmin = roleNivel >= 3;
  const ehSupervisor = role === 'supervisor';

  const [qrcodes, setQrcodes] = useState<QRCodeFormulario[]>([]);
  const [supervisorAutorizado, setSupervisorAutorizado] = useState(false);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      qrcodesApi.list().catch(() => []),
      qrcodesApi.getSupervisorPerm().catch(() => ({ autorizado: false })),
    ]).then(([qrs, perm]: any) => {
      setQrcodes(qrs.map((q: any) => ({
        id: q.id,
        nome: q.nome,
        descricao: q.descricao || '',
        logo: q.logo,
        blocos: typeof q.blocos === 'string' ? JSON.parse(q.blocos) : (q.blocos || []),
        dispensarIdentificacao: q.dispensarIdentificacao,
        blocosCadastrados: q.blocosCadastrados || [],
        criadoPor: q.criadoPor || 'Sistema',
        criadoEm: q.criadoEm ? new Date(q.criadoEm).getTime() : Date.now(),
        respostas: q.respostas || 0,
        ativo: q.ativo !== false,
      })));
      setSupervisorAutorizado(perm.autorizado);
    }).finally(() => setLoading(false));
  }, []);

  // Modal Criar QR Code
  const [showCriar, setShowCriar] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLogo, setFormLogo] = useState<string | null>(null);
  const [formBlocos, setFormBlocos] = useState<BlocoConfig[]>([]);
  const [formDispensarId, setFormDispensarId] = useState(false);
  const [formBlocosCad, setFormBlocosCad] = useState<string[]>(BLOCOS_PADRAO);
  const [novoBlocoNome, setNovoBlocoNome] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrFuncoesRef = useRef<HTMLDivElement>(null);
  const [showFuncoesQR, setShowFuncoesQR] = useState(false);
  const [toast, setToast] = useState<{ msg: string; cor: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Favoritos (persistência em localStorage)
  const [favoritos, setFavoritos] = useState<BlocoTipo[]>(() => {
    try { const v = localStorage.getItem('gestao-qr-favoritos'); return v ? JSON.parse(v) : []; } catch { return []; }
  });

  const toggleFavorito = useCallback((tipo: BlocoTipo) => {
    setFavoritos(prev => {
      const next = prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo];
      localStorage.setItem('gestao-qr-favoritos', JSON.stringify(next));
      return next;
    });
  }, []);

  const mostrarToast = useCallback((msg: string, cor: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, cor });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  // Modal Preview / Visualizar QR
  const [previewQR, setPreviewQR] = useState<QRCodeFormulario | null>(null);

  // Modal Responder QR Code (simula leitura)
  const [responderQR, setResponderQR] = useState<QRCodeFormulario | null>(null);
  const [etapaResposta, setEtapaResposta] = useState<'identificacao' | 'formulario' | 'enviado'>('identificacao');
  const [identificacao, setIdentificacao] = useState<Identificacao>({ tipo: '', nome: '', bloco: '', unidade: '', anonimo: false });
  const [respostas, setRespostas] = useState<RespostaBlocos>({});

  // Permissão: supervisor pode criar?
  const podeCriarQR = ehMasterOuAdmin || (ehSupervisor && supervisorAutorizado);

  const imprimirQRFuncoes = useCallback(() => {
    const el = qrFuncoesRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>QR Codes - Funções</title><style>
      @page { size: A4 portrait; margin: 10mm; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fff; color: #222; }
      .titulo { text-align: center; font-size: 18px; font-weight: 700; padding: 14px 0 4px; }
      .subtitulo { text-align: center; font-size: 11px; color: #888; margin-bottom: 12px; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 0 4px; }
      .item { border: 1.5px solid #ddd; border-radius: 8px; padding: 8px 4px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .item canvas, .item img { width: 90px !important; height: 90px !important; }
      .item span { font-size: 9px; font-weight: 600; text-align: center; line-height: 1.2; }
      .item small { font-size: 7px; color: #999; word-break: break-all; text-align: center; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style></head><body>`);
    win.document.write('<div class="titulo">QR Codes \u2014 Acesso R\u00e1pido \u00e0s Fun\u00e7\u00f5es</div>');
    win.document.write('<div class="subtitulo">Escaneie o QR Code para acessar a fun\u00e7\u00e3o diretamente no celular</div>');
    win.document.write('<div class="grid">');
    el.querySelectorAll('[data-qr-item]').forEach(item => { win.document.write(item.innerHTML); });
    win.document.write('</div></body></html>');
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  }, []);

  const toggleSupervisorPerm = async () => {
    const novo = !supervisorAutorizado;
    setSupervisorAutorizado(novo);
    try { await qrcodesApi.setSupervisorPerm(novo); } catch {}
  };

  /* ── Filtro ── */
  const filtrados = useMemo(() => {
    if (!busca.trim()) return qrcodes;
    const termos = busca.toLowerCase().split(/\s+/);
    return qrcodes.filter(q => {
      const texto = `${q.nome} ${q.descricao} ${q.id}`.toLowerCase();
      return termos.every(t => texto.includes(t));
    });
  }, [qrcodes, busca]);

  /* ── Logo upload ── */
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (ev.target?.result) setFormLogo(ev.target.result as string); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Adicionar bloco ao formulário ── */
  const adicionarBloco = (tipo: BlocoTipo) => {
    const info = BLOCOS_DISPONIVEIS.find(b => b.tipo === tipo);
    const novo: BlocoConfig = {
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tipo,
      label: info?.label || tipo,
      obrigatorio: false,
      opcoes: tipo === 'checklist' ? ['Item 1'] : tipo === 'status' ? ['Aberto', 'Em andamento', 'Resolvido'] : tipo === 'prioridade' ? ['Baixa', 'Média', 'Alta', 'Urgente'] : tipo === 'pergunta' ? [''] : tipo === 'urgencia' ? ['Vazamento de água', 'Vazamento de gás', 'Vidro quebrado', 'Curto-circuito / Problema elétrico', 'Elevador parado', 'Incêndio', 'Inundação', 'Queda de estrutura', 'Outro'] : tipo === 'agendar_servico' ? ['Limpeza pós-festa', 'Limpeza pós-mudança', 'Limpeza pós-obra', 'Lavagem de garagem', 'Higienização especial', 'Outro'] : tipo === 'pesquisa_satisfacao' ? ['Qualidade da limpeza', 'Pontualidade da equipe', 'Cordialidade dos funcionários', 'Conservação das áreas comuns', 'Atendimento a solicitações'] : tipo === 'controle_ponto' ? ['Entrada', 'Saída'] : tipo === 'sla_tempo' ? ['Limpeza', 'Manutenção', 'Segurança', 'Jardinagem', 'Outros'] : tipo === 'assinatura_digital' ? ['Serviço executado conforme solicitado'] : tipo === 'ocorrencia' ? ['Elétrica', 'Hidráulica', 'Estrutural', 'Pintura', 'Limpeza', 'Jardinagem', 'Elevador', 'Portão / Cerca', 'Iluminação', 'Outro'] : tipo === 'manutencao' ? ['Vazamento de água', 'Problema elétrico', 'Porta / Fechadura quebrada', 'Vidro trincado / quebrado', 'Piso danificado', 'Infiltração / Mofo', 'Elevador com defeito', 'Ar-condicionado', 'Pintura descascando', 'Entupimento', 'Iluminação queimada', 'Outro'] : undefined,
      maxFotos: tipo === 'galeria' ? 5 : undefined,
      maxEstrelas: tipo === 'avaliacao_estrela' ? 5 : undefined,
      escalaMax: tipo === 'avaliacao_escala' ? 10 : undefined,
    };
    setFormBlocos(prev => [...prev, novo]);
    mostrarToast(`✓ s${info?.label || tipo}s adicionado`, info?.cor || '#4caf50');
  };

  const removerBloco = (id: string) => {
    setFormBlocos(prev => prev.filter(b => b.id !== id));
  };

  const atualizarBloco = (id: string, campo: string, valor: any) => {
    setFormBlocos(prev => prev.map(b => b.id === id ? { ...b, [campo]: valor } : b));
  };

  const adicionarOpcao = (blocoId: string) => {
    setFormBlocos(prev => prev.map(b =>
      b.id === blocoId ? { ...b, opcoes: [...(b.opcoes || []), ''] } : b
    ));
  };

  const atualizarOpcao = (blocoId: string, idx: number, valor: string) => {
    setFormBlocos(prev => prev.map(b =>
      b.id === blocoId ? { ...b, opcoes: b.opcoes?.map((o, i) => i === idx ? valor : o) } : b
    ));
  };

  const removerOpcao = (blocoId: string, idx: number) => {
    setFormBlocos(prev => prev.map(b =>
      b.id === blocoId ? { ...b, opcoes: b.opcoes?.filter((_, i) => i !== idx) } : b
    ));
  };

  /* ── Criar QR Code ── */
  const criarQRCode = async () => {
    if (!tentarAcao()) return;
    if (!formNome.trim()) { mostrarToast('Preencha o nome do formulário', '#d32f2f'); return; }
    if (formBlocos.length === 0) { mostrarToast('Adicione pelo menos um bloco', '#d32f2f'); return; }
    let novo: QRCodeFormulario;
    try {
      const created = await qrcodesApi.create({
        nome: formNome.trim(),
        descricao: formDesc.trim(),
        logo: formLogo,
        blocos: formBlocos,
        dispensarIdentificacao: formDispensarId,
        blocosCadastrados: formBlocosCad.filter(b => b.trim()),
      });
      novo = {
        id: created.id,
        nome: created.nome,
        descricao: created.descricao || '',
        logo: created.logo,
        blocos: typeof created.blocos === 'string' ? JSON.parse(created.blocos) : (created.blocos || []),
        dispensarIdentificacao: created.dispensarIdentificacao,
        blocosCadastrados: created.blocosCadastrados || [],
        criadoPor: usuario?.nome || 'Sistema',
        criadoEm: created.criadoEm ? new Date(created.criadoEm).getTime() : Date.now(),
        respostas: 0,
        ativo: true,
      };
    } catch {
      novo = {
        id: `qr-${Date.now()}`,
        nome: formNome.trim(),
        descricao: formDesc.trim(),
        logo: formLogo,
        blocos: formBlocos,
        dispensarIdentificacao: formDispensarId,
        blocosCadastrados: formBlocosCad.filter(b => b.trim()),
        criadoPor: usuario?.nome || 'Sistema',
        criadoEm: Date.now(),
        respostas: 0,
        ativo: true,
      };
    }
    setQrcodes(prev => [novo, ...prev]);
    resetForm();
    setShowCriar(false);
    mostrarToast(`✓ QR Code s${novo.nome}s criado!`, '#2e7d32');
  };

  const resetForm = () => {
    setFormNome(''); setFormDesc(''); setFormLogo(null);
    setFormBlocos([]); setFormDispensarId(false);
    setFormBlocosCad(BLOCOS_PADRAO); setNovoBlocoNome('');
  };

  const toggleAtivoQR = async (id: string) => {
    if (!tentarAcao()) return;
    const qr = qrcodes.find(q => q.id === id);
    if (!qr) return;
    try {
      await qrcodesApi.update(id, { ...qr, blocos: qr.blocos, ativo: !qr.ativo });
      setQrcodes(prev => prev.map(q => q.id === id ? { ...q, ativo: !q.ativo } : q));
    } catch {}
  };

  const excluirQR = async (id: string) => {
    if (!tentarAcao()) return;
    try {
      await qrcodesApi.remove(id);
      setQrcodes(prev => prev.filter(q => q.id !== id));
    } catch {}
  };

  /* ── Abrir responder ── */
  const abrirResponder = (qr: QRCodeFormulario) => {
    setResponderQR(qr);
    setEtapaResposta(qr.dispensarIdentificacao ? 'formulario' : 'identificacao');
    setIdentificacao({ tipo: '', nome: '', bloco: '', unidade: '', anonimo: false });
    setRespostas({});
  };

  const avancarIdentificacao = () => {
    if (!identificacao.anonimo && (!identificacao.tipo || !identificacao.nome || !identificacao.bloco || !identificacao.unidade)) return;
    setEtapaResposta('formulario');
  };

  const enviarRespostas = async () => {
    if (!responderQR) return;
    try {
      await qrcodesApi.addLeitura({ qrConteudo: responderQR.id });
    } catch {}
    setQrcodes(prev => prev.map(q => q.id === responderQR.id ? { ...q, respostas: q.respostas + 1 } : q));
    setEtapaResposta('enviado');
  };

  /* ── Download QR code como imagem ── */
  const downloadQR = (qrId: string) => {
    const canvas = document.querySelector(`#qr-canvas-${qrId} canvas`) as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qrcode-${qrId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  /* ── Render bloco no builder ── */
  const renderBlocoBuilder = (bloco: BlocoConfig) => {
    const info = BLOCOS_DISPONIVEIS.find(b => b.tipo === bloco.tipo);
    return (
      <div key={bloco.id} className={styles.blocoBuilder}>
        <div className={styles.blocoBuilderHeader}>
          <GripVertical size={16} className={styles.blocoGrip} />
          <div className={styles.blocoIcone} style={{ background: info?.cor + '18', color: info?.cor }}>
            {info?.icone}
          </div>
          <input
            className={styles.blocoLabelInput}
            value={bloco.label}
            onChange={e => atualizarBloco(bloco.id, 'label', e.target.value)}
            placeholder="Nome do campo"
          />
          <label className={styles.blocoObrigatorio}>
            <input type="checkbox" checked={bloco.obrigatorio} onChange={e => atualizarBloco(bloco.id, 'obrigatorio', e.target.checked)} />
            <span>Obrigatório</span>
          </label>
          <button className={styles.blocoRemover} onClick={() => removerBloco(bloco.id)}>
            <Trash2 size={14} />
          </button>
        </div>

        {/* Opções para checklist, status, prioridade, pergunta */}
        {bloco.opcoes && (
          <div className={styles.blocoOpcoes}>
            {bloco.opcoes.map((op, idx) => (
              <div key={idx} className={styles.opcaoRow}>
                <input
                  className={styles.opcaoInput}
                  value={op}
                  onChange={e => atualizarOpcao(bloco.id, idx, e.target.value)}
                  placeholder={bloco.tipo === 'pergunta' ? `Pergunta ${idx + 1}` : `Opção ${idx + 1}`}
                />
                {bloco.opcoes!.length > 1 && (
                  <button className={styles.opcaoRemover} onClick={() => removerOpcao(bloco.id, idx)}>
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            <button className={styles.opcaoAdd} onClick={() => adicionarOpcao(bloco.id)}>
              <Plus size={14} /> Adicionar {bloco.tipo === 'pergunta' ? 'Pergunta' : 'Opção'}
            </button>
          </div>
        )}

        {/* Config galeria */}
        {bloco.tipo === 'galeria' && (
          <div className={styles.blocoConfig}>
            <label>Máx. fotos:</label>
            <input type="number" min={1} max={20} value={bloco.maxFotos || 5} onChange={e => atualizarBloco(bloco.id, 'maxFotos', Number(e.target.value))} className={styles.configInput} />
          </div>
        )}
      </div>
    );
  };

  /* ── Render bloco no formulário de resposta ── */
  const renderBlocoResposta = (bloco: BlocoConfig) => {
    const info = BLOCOS_DISPONIVEIS.find(b => b.tipo === bloco.tipo);
    const valor = respostas[bloco.id];

    return (
      <div key={bloco.id} className={styles.blocoResposta}>
        <div className={styles.blocoRespostaHeader}>
          <span className={styles.blocoRespostaIcone} style={{ color: info?.cor }}>{info?.icone}</span>
          <span className={styles.blocoRespostaLabel}>{bloco.label}</span>
          {bloco.obrigatorio && <span className={styles.blocoReq}>*</span>}
        </div>

        {(bloco.tipo === 'titulo' || bloco.tipo === 'subtitulo' || bloco.tipo === 'texto' || bloco.tipo === 'descricao') && (
          <textarea
            className={styles.respostaTextarea}
            placeholder={`Digite ${bloco.label.toLowerCase()}...`}
            value={valor || ''}
            onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: e.target.value }))}
            rows={bloco.tipo === 'titulo' || bloco.tipo === 'subtitulo' ? 1 : 3}
          />
        )}

        {bloco.tipo === 'galeria' && (
          <div className={styles.respostaGaleria}>
            <p className={styles.respostaHint}>Anexe até {bloco.maxFotos || 5} fotos</p>
            <button className={styles.respostaUploadBtn} onClick={() => {
              setRespostas(prev => ({ ...prev, [bloco.id]: [...(prev[bloco.id] || []), `Foto ${((prev[bloco.id] || []).length) + 1}`] }));
            }}>
              <Upload size={16} /> Adicionar Foto
            </button>
            {(valor || []).length > 0 && <span className={styles.respostaFotoCount}>{(valor || []).length} foto(") anexada(")</span>}
          </div>
        )}

        {bloco.tipo === 'checklist' && (
          <div className={styles.respostaChecklist}>
            {bloco.opcoes?.map((op, idx) => (
              <label key={idx} className={styles.checkItem}>
                <input type="checkbox" checked={valor?.[idx] || false} onChange={e => {
                  const arr = [...(valor || bloco.opcoes!.map(() => false))];
                  arr[idx] = e.target.checked;
                  setRespostas(prev => ({ ...prev, [bloco.id]: arr }));
                }} />
                <span>{op}</span>
              </label>
            ))}
          </div>
        )}

        {(bloco.tipo === 'status' || bloco.tipo === 'prioridade') && (
          <select className={styles.respostaSelect} value={valor || ''} onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: e.target.value }))}>
            <option value="">Selecione...</option>
            {bloco.opcoes?.map((op, idx) => <option key={idx} value={op}>{op}</option>)}
          </select>
        )}

        {bloco.tipo === 'avaliacao_estrela' && (
          <div className={styles.respostaEstrelas}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} className={`${styles.estrela} ${(valor || 0) >= n ? styles.estrelaAtiva : ''}`}
                onClick={() => setRespostas(prev => ({ ...prev, [bloco.id]: n }))}>
                <Star size={28} fill={(valor || 0) >= n ? '#fbc02d' : 'none'} />
              </button>
            ))}
            <span className={styles.estrelaTexto}>{valor ? `${valor}/5` : 'Toque para avaliar'}</span>
          </div>
        )}

        {bloco.tipo === 'avaliacao_escala' && (
          <div className={styles.respostaEscala}>
            <div className={styles.escalaNumeros}>
              {Array.from({ length: 11 }, (_, i) => (
                <button key={i} className={`${styles.escalaNum} ${valor === i ? styles.escalaNumAtivo : ''}`}
                  onClick={() => setRespostas(prev => ({ ...prev, [bloco.id]: i }))}>
                  {i}
                </button>
              ))}
            </div>
            <div className={styles.escalaLabels}>
              <span>Muito ruim</span>
              <span>Excelente</span>
            </div>
          </div>
        )}

        {bloco.tipo === 'pergunta' && (
          <div className={styles.respostaPerguntas}>
            {bloco.opcoes?.map((pergunta, idx) => (
              <div key={idx} className={styles.perguntaItem}>
                <label className={styles.perguntaLabel}>{pergunta || `Pergunta ${idx + 1}`}</label>
                <textarea
                  className={styles.respostaTextarea}
                  placeholder="Sua resposta..."
                  value={valor?.[idx] || ''}
                  onChange={e => {
                    const arr = [...(valor || bloco.opcoes!.map(() => ''))];
                    arr[idx] = e.target.value;
                    setRespostas(prev => ({ ...prev, [bloco.id]: arr }));
                  }}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}

        {(bloco.tipo === 'aviso' || bloco.tipo === 'comunicado') && (
          <textarea
            className={styles.respostaTextarea}
            placeholder={bloco.tipo === 'aviso' ? 'Registre o aviso...' : 'Registre o comunicado...'}
            value={valor || ''}
            onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: e.target.value }))}
            rows={3}
          />
        )}

        {bloco.tipo === 'feedback' && (
          <div className={styles.feedbackFields}>
            <p className={styles.feedbackHint}>Informe seu contato para receber um retorno:</p>
            <div className={styles.feedbackRow}>
              <Phone size={16} className={styles.feedbackIcon} />
              <input
                className={styles.formInput}
                placeholder="WhatsApp (ex: 11 99999-9999)"
                value={valor?.whatsapp || ''}
                onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], whatsapp: e.target.value } }))}
              />
            </div>
            <div className={styles.feedbackRow}>
              <Mail size={16} className={styles.feedbackIcon} />
              <input
                className={styles.formInput}
                type="email"
                placeholder="E-mail (ex: nome@email.com)"
                value={valor?.email || ''}
                onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], email: e.target.value } }))}
              />
            </div>
          </div>
        )}

        {bloco.tipo === 'urgencia' && (
          <div className={styles.urgenciaFields}>
            <div className={styles.urgenciaBanner}>
              <Siren size={20} />
              <span>Selecione o tipo de urgência e descreva o ocorrido</span>
            </div>
            <div className={styles.urgenciaOpcoes}>
              {bloco.opcoes?.map((op, idx) => (
                <label key={idx} className={`${styles.urgenciaItem} ${valor?.tipo === op ? styles.urgenciaItemAtivo : ''}`}>
                  <input
                    type="radio"
                    name={`urgencia-${bloco.id}`}
                    checked={valor?.tipo === op}
                    onChange={() => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], tipo: op } }))}
                    hidden
                  />
                  <AlertTriangle size={14} />
                  <span>{op}</span>
                </label>
              ))}
            </div>
            <textarea
              className={styles.respostaTextarea}
              placeholder="Descreva a urgência com detalhe (local, gravidade, etc.)..."
              value={valor?.descricao || ''}
              onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], descricao: e.target.value } }))}
              rows={3}
            />
            <div className={styles.urgenciaAlerta}>
              <AlertTriangle size={14} />
              <span>Ao enviar, uma notificação será disparada imediatamente para os responsáveis.</span>
            </div>
          </div>
        )}

        {bloco.tipo === 'agendar_servico' && (
          <div className={styles.agendarFields}>
            <div className={styles.agendarBanner}>
              <CalendarPlus size={20} />
              <span>Solicite limpeza fora do horário (pós-festa, mudança, etc.)</span>
            </div>
            <div className={styles.agendarOpcoes}>
              {bloco.opcoes?.map((op, idx) => (
                <label key={idx} className={`${styles.agendarItem} ${valor?.tipoServico === op ? styles.agendarItemAtivo : ''}`}>
                  <input
                    type="radio"
                    name={`agendar-${bloco.id}`}
                    checked={valor?.tipoServico === op}
                    onChange={() => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], tipoServico: op } }))}
                    hidden
                  />
                  <span>{op}</span>
                </label>
              ))}
            </div>
            <div className={styles.agendarCampos}>
              <div className={styles.agendarRow}>
                <label>Data desejada</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={valor?.data || ''}
                  onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], data: e.target.value } }))}
                />
              </div>
              <div className={styles.agendarRow}>
                <label>Horário preferido</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={valor?.horario || ''}
                  onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], horario: e.target.value } }))}
                />
              </div>
            </div>
            <textarea
              className={styles.respostaTextarea}
              placeholder="Observaçõe (local, detalhes adicionais, etc.)..."
              value={valor?.observacoes || ''}
              onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], observacoes: e.target.value } }))}
              rows={3}
            />
          </div>
        )}

        {bloco.tipo === 'pesquisa_satisfacao' && (
          <div className={styles.pesquisaFields}>
            <div className={styles.pesquisaBanner}>
              <ClipboardCheck size={20} />
              <span>Avalie o serviço geral da empresa</span>
            </div>
            <div className={styles.pesquisaCriterios}>
              {bloco.opcoes?.map((criterio, idx) => (
                <div key={idx} className={styles.pesquisaCriterio}>
                  <span className={styles.pesquisaCriterioLabel}>{criterio}</span>
                  <div className={styles.pesquisaEstrelas}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        className={`${styles.pesquisaEstrela} ${(valor?.[idx] || 0) >= n ? styles.pesquisaEstrelaAtiva : ''}`}
                        onClick={() => {
                          const arr = [...(valor || bloco.opcoes!.map(() => 0))];
                          arr[idx] = n;
                          setRespostas(prev => ({ ...prev, [bloco.id]: arr }));
                        }}
                      >
                        <Star size={20} fill={(valor?.[idx] || 0) >= n ? '#00897b' : 'none'} />
                      </button>
                    ))}
                    <span className={styles.pesquisaNota}>{valor?.[idx] ? `${valor[idx]}/5` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
            <textarea
              className={styles.respostaTextarea}
              placeholder="Comentário ou sugestões (opcional)..."
              value={valor?.comentario || (typeof valor === 'object' && !Array.isArray(valor) ? valor?.comentario : '') || ''}
              onChange={e => {
                const notas = Array.isArray(valor) ? valor : (bloco.opcoes || []).map(() => 0);
                setRespostas(prev => ({ ...prev, [bloco.id]: { notas, comentario: e.target.value } }));
              }}
              rows={2}
            />
          </div>
        )}

        {bloco.tipo === 'controle_ponto' && (
          <ControlePontoBloco blocoId={bloco.id} valor={valor} setRespostas={setRespostas} />
        )}

        {bloco.tipo === 'sla_tempo' && (
          <SlaTempoBloco blocoId={bloco.id} bloco={bloco} valor={valor} setRespostas={setRespostas} />
        )}

        {bloco.tipo === 'assinatura_digital' && (
          <AssinaturaDigitalBloco blocoId={bloco.id} bloco={bloco} valor={valor} setRespostas={setRespostas} />
        )}

        {bloco.tipo === 'ocorrencia' && (
          <div className={styles.ocorrenciaFields}>
            <div className={styles.ocorrenciaBanner}>
              <Camera size={20} />
              <span>Informe a ocorrência com foto e descrição</span>
            </div>
            <div className={styles.ocorrenciaCategoria}>
              <label className={styles.ocorrenciaCatLabel}>Categoria do problema:</label>
              <div className={styles.ocorrenciaOpcoes}>
                {bloco.opcoes?.map((op, idx) => (
                  <label key={idx} className={`${styles.ocorrenciaItem} ${valor?.categoria === op ? styles.ocorrenciaItemAtivo : ''}`}>
                    <input
                      type="radio"
                      name={`ocorrencia-${bloco.id}`}
                      checked={valor?.categoria === op}
                      onChange={() => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], categoria: op } }))}
                      hidden
                    />
                    <AlertTriangle size={14} />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.ocorrenciaLocal}>
              <label className={styles.ocorrenciaCatLabel}>Local da ocorrência:</label>
              <input
                className={styles.formInput}
                placeholder="Ex: Hall do Bloco A, Garagem 2, Piscina..."
                value={valor?.local || ''}
                onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], local: e.target.value } }))}
              />
            </div>
            <div className={styles.ocorrenciaDescricao}>
              <label className={styles.ocorrenciaCatLabel}>Descrição detalhada:</label>
              <textarea
                className={styles.respostaTextarea}
                placeholder="Descreva o problema encontrado com o máximo de detalhe (o que aconteceu, quando percebeu, gravidade)..."
                value={valor?.descricao || ''}
                onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], descricao: e.target.value } }))}
                rows={4}
              />
            </div>
            <div className={styles.ocorrenciaFotos}>
              <label className={styles.ocorrenciaCatLabel}>Fotos do problema:</label>
              <div className={styles.ocorrenciaFotoGrid}>
                {(valor?.fotos || []).map((foto: string, idx: number) => (
                  <div key={idx} className={styles.ocorrenciaFotoThumb}>
                    <img src={foto} alt={`Foto ${idx + 1}`} />
                    <button
                      type="button"
                      className={styles.ocorrenciaFotoRemover}
                      onClick={() => {
                        const novasFotos = (valor?.fotos || []).filter((_: any, i: number) => i !== idx);
                        setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], fotos: novasFotos } }));
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {(valor?.fotos || []).length < 5 && (
                  <label className={styles.ocorrenciaFotoAdd}>
                    <Camera size={24} />
                    <span>Adicionar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          if (ev.target?.result) {
                            const novasFotos = [...(valor?.fotos || []), ev.target.result as string];
                            setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], fotos: novasFotos } }));
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <span className={styles.ocorrenciaFotoHint}>{(valor?.fotos || []).length}/5 fotos — tire fotos claras do problema</span>
            </div>
            <div className={styles.ocorrenciaAlerta}>
              <AlertTriangle size={14} />
              <span>A ocorrência será registrada e encaminhada à equipe de manutenção.</span>
            </div>
          </div>
        )}

        {bloco.tipo === 'manutencao' && (
          <div className={styles.manutencaoFields}>
            <div className={styles.manutencaoBanner}>
              <Wrench size={20} />
              <span>Reportar problema de manutenção com foto e descrição</span>
            </div>
            <div className={styles.manutencaoSecao}>
              <label className={styles.manutencaoLabel}>Tipo do problema:</label>
              <div className={styles.manutencaoOpcoes}>
                {bloco.opcoes?.map((op, idx) => (
                  <label key={idx} className={`${styles.manutencaoItem} ${valor?.tipo === op ? styles.manutencaoItemAtivo : ''}`}>
                    <input
                      type="radio"
                      name={`manutencao-${bloco.id}`}
                      checked={valor?.tipo === op}
                      onChange={() => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], tipo: op } }))}
                      hidden
                    />
                    <Wrench size={14} />
                    <span>{op}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.manutencaoSecao}>
              <label className={styles.manutencaoLabel}>Prioridade:</label>
              <div className={styles.manutencaoPrioridades}>
                {['Baixa', 'Média', 'Alta', 'Urgente'].map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.manutencaoPri} ${styles[`manutencaoPri${p}`]} ${valor?.prioridade === p ? styles.manutencaoPriAtivo : ''}`}
                    onClick={() => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], prioridade: p } }))}
                  >
                    <Flag size={14} />
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.manutencaoSecao}>
              <label className={styles.manutencaoLabel}>Local exato:</label>
              <input
                className={styles.formInput}
                placeholder="Ex: Banheiro do 3º andar, Garagem subsolo, Portaria..."
                value={valor?.local || ''}
                onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], local: e.target.value } }))}
              />
            </div>
            <div className={styles.manutencaoSecao}>
              <label className={styles.manutencaoLabel}>Descrição do problema:</label>
              <textarea
                className={styles.respostaTextarea}
                placeholder="Descreva o que está quebrado, vazando ou com defeito. Inclua detalhe como há quanto tempo o problema existe e se está piorando..."
                value={valor?.descricao || ''}
                onChange={e => setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], descricao: e.target.value } }))}
                rows={4}
              />
            </div>
            <div className={styles.manutencaoSecao}>
              <label className={styles.manutencaoLabel}>Fotos do problema:</label>
              <div className={styles.manutencaoFotoGrid}>
                {(valor?.fotos || []).map((foto: string, idx: number) => (
                  <div key={idx} className={styles.manutencaoFotoThumb}>
                    <img src={foto} alt={`Foto ${idx + 1}`} />
                    <button
                      type="button"
                      className={styles.manutencaoFotoRemover}
                      onClick={() => {
                        const novasFotos = (valor?.fotos || []).filter((_: any, i: number) => i !== idx);
                        setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], fotos: novasFotos } }));
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {(valor?.fotos || []).length < 5 && (
                  <label className={styles.manutencaoFotoAdd}>
                    <Camera size={24} />
                    <span>Tirar / anexar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          if (ev.target?.result) {
                            const novasFotos = [...(valor?.fotos || []), ev.target.result as string];
                            setRespostas(prev => ({ ...prev, [bloco.id]: { ...prev[bloco.id], fotos: novasFotos } }));
                          }
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
              <span className={styles.manutencaoFotoHint}>{(valor?.fotos || []).length}/5 fotos — registre o estado atual do problema</span>
            </div>
            <div className={styles.manutencaoAlerta}>
              <Wrench size={14} />
              <span>O chamado será aberto automaticamente e encaminhado à equipe de manutenção responsável.</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;

  return (
    <div id="qrcode-content">
      <HowItWorks
        titulo="Criar QR Code"
        descricao="Monte formulário personalizados e gere QR Codes para moradores, funcionários e prestadores responderem."
        passos={[
          'Crie um formulário adicionando blocos: título, fotos, checklist, avaliações, etc.',
          'Opcionalmente importe a logo da empresa para aparecer no QR Code',
          'Defina se deseja dispensar a identificação do respondente',
          'Gere o QR Code e compartilhe — qualquer pessoa pode escanear e responder',
          'Acompanhe as respostas recebidas em cada QR Code',
        ]}
      />

      <PageHeader
        titulo="Criar QR Code"
        subtitulo={`${filtrados.length} formulários`}
        onCompartilhar={() => compartilharConteudo('QR Codes', 'Listagem de QR Codes')}
        onImprimir={() => imprimirElemento('qrcode-content')}
        onGerarPdf={() => gerarPdfDeElemento('qrcode-content', 'qrcodes')}
        acoes={
          podeCriarQR ? (
            <button className={styles.addBtn} onClick={() => { resetForm(); setShowCriar(true); }}>
              <Plus size={18} /> <span>Novo QR Code</span>
            </button>
          ) : ehSupervisor ? (
            <div className={styles.semPermissao}>
              <AlertTriangle size={16} />
              <span>Aguardando autorização do administrador</span>
            </div>
          ) : undefined
        }
      />

      {/* Controle de permissão do supervisor (visível só para admin/master) */}
      {ehMasterOuAdmin && (
        <div className={styles.permCard}>
          <div className={styles.permInfo}>
            <Settings size={18} />
            <div>
              <strong>Permissão do Supervisor</strong>
              <span>Autorizar supervisores a criar QR Codes</span>
            </div>
          </div>
          <button className={`${styles.permToggle} ${supervisorAutorizado ? styles.permToggleOn : ''}`} onClick={toggleSupervisorPerm}>
            <span className={styles.permToggleDot} />
            <span>{supervisorAutorizado ? 'Autorizado' : 'Bloqueado'}</span>
          </button>
        </div>
      )}

      {/* QR Codes das Funções */}
      {ehMasterOuAdmin && (
        <div className={styles.funcQrPanel}>
          <button className={styles.funcQrToggle} onClick={() => setShowFuncoesQR(v => !v)}>
            <div className={styles.funcQrToggleLeft}>
              <QrCode size={18} />
              <div>
                <strong>QR Codes das Funções</strong>
                <span>{FUNCOES_QR.length} funções disponíveis — escaneie para ir direto à página</span>
              </div>
            </div>
            <div className={styles.funcQrToggleRight}>
              {showFuncoesQR && (
                <button className={styles.funcQrPrintBtn} onClick={e => { e.stopPropagation(); imprimirQRFuncoes(); }}>
                  <Printer size={15} /> Imprimir A4
                </button>
              )}
              {showFuncoesQR ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
          </button>
          {showFuncoesQR && (
            <div className={styles.funcQrGrid} ref={qrFuncoesRef}>
              {FUNCOES_QR.map(f => (
                <div key={f.id} className={styles.funcQrItem} data-qr-item>
                  <QRCodeCanvas value={`${window.location.origin}${f.rota}`} size={90} level="M" includeMargin={false} />
                  <span className={styles.funcQrLabel}>{f.label}</span>
                  <small className={styles.funcQrUrl}>{f.rota}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Busca */}
      <div className={styles.buscaArea}>
        <Search size={18} className={styles.buscaIcon} />
        <input className={styles.buscaInput} placeholder="Buscar QR Codes..." value={busca} onChange={e => setBusca(e.target.value)} />
        {busca && <button className={styles.buscaLimpar} onClick={() => setBusca('')}><X size={16} /></button>}
      </div>

      {/* Lista de QR Codes */}
      <div className={styles.list}>
        {filtrados.length === 0 ? (
          <div className={styles.vazio}>
            <QrCode size={44} strokeWidth={1.2} />
            <span>{qrcodes.length === 0 ? 'Nenhum QR Code criado ainda' : 'Nenhum resultado encontrado'}</span>
          </div>
        ) : filtrados.map(qr => (
          <Card key={qr.id} padding="md" hover>
            <div className={styles.qrCard}>
              <div className={styles.qrCardTop}>
                <div className={styles.qrCardInfo}>
                  <div className={styles.qrCardHeader}>
                    <span className={styles.qrId}><Hash size={12} />{qr.id}</span>
                    <StatusBadge texto={qr.ativo ? 'Ativo' : 'Inativo'} variante={qr.ativo ? 'sucesso' : 'neutro'} />
                  </div>
                  <h4 className={styles.qrNome}>{qr.nome}</h4>
                  {qr.descricao && <p className={styles.qrDesc}>{qr.descricao}</p>}
                  <div className={styles.qrMeta}>
                    <span>{qr.blocos.length} blocos</span>
                    <span>•</span>
                    <span>{qr.respostas} respostas</span>
                    <span>•</span>
                    <span>Por {qr.criadoPor}</span>
                  </div>
                  <div className={styles.qrTags}>
                    {qr.blocos.slice(0, 4).map(b => {
                      const info = BLOCOS_DISPONIVEIS.find(bd => bd.tipo === b.tipo);
                      return <span key={b.id} className={styles.qrTag} style={{ background: info?.cor + '15', color: info?.cor }}>{b.label}</span>;
                    })}
                    {qr.blocos.length > 4 && <span className={styles.qrTag}>+{qr.blocos.length - 4}</span>}
                  </div>
                </div>
                <div className={styles.qrCardPreview} id={`qr-canvas-${qr.id}`}>
                  <QRCodeCanvas
                    value={`${window.location.origin}/qrcode/responder/${qr.id}`}
                    size={110}
                    level="H"
                    imageSettings={qr.logo ? { src: qr.logo, height: 24, width: 24, excavate: true } : undefined}
                  />
                </div>
              </div>
              <div className={styles.qrCardActions}>
                <button className={styles.btnResponder} onClick={() => abrirResponder(qr)}>
                  <Eye size={14} /> Responder
                </button>
                <button className={styles.btnPreview} onClick={() => setPreviewQR(qr)}>
                  <QrCode size={14} /> Ver QR Code
                </button>
                <button className={styles.btnDownload} onClick={() => downloadQR(qr.id)}>
                  <Download size={14} /> Baixar
                </button>
                {podeCriarQR && (
                  <>
                    <button className={styles.btnToggle} onClick={() => toggleAtivoQR(qr.id)}>
                      {qr.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    <button className={styles.btnExcluir} onClick={() => excluirQR(qr.id)}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ═══ MODAL: Criar QR Code ═══ */}
      <Modal aberto={showCriar} onFechar={() => setShowCriar(false)} titulo="Criar QR Code" largura="lg">
        <div className={styles.criarForm}>
          {/* Informações básicas */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Informações</h4>
            <div className={styles.formGrid}>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Nome do Formulário *</label>
                <input className={styles.formInput} placeholder="Ex: Pesquisa de Satisfação" value={formNome} onChange={e => setFormNome(e.target.value)} />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Descrição</label>
                <input className={styles.formInput} placeholder="Descrição breve..." value={formDesc} onChange={e => setFormDesc(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Logo da Empresa</h4>
            <div className={styles.logoArea}>
              {formLogo ? (
                <div className={styles.logoPreview}>
                  <img src={formLogo} alt="Logo" />
                  <button className={styles.logoRemover} onClick={() => setFormLogo(null)}><X size={14} /></button>
                </div>
              ) : (
                <button className={styles.logoUploadBtn} onClick={() => logoInputRef.current?.click()}>
                  <Upload size={20} />
                  <span>Importar Logo</span>
                  <small>Insira sua logo para personalizar o QR Code</small>
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
            </div>
          </div>

          {/* Identificação */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Identificação do Respondente</h4>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={formDispensarId} onChange={e => setFormDispensarId(e.target.checked)} />
              <span>Dispensar identificação do usuário</span>
            </label>
            <p className={styles.formHint}>Se desmarcado, o respondente deverá se identificar (morador/funcionário/prestador, bloco, unidade) antes de acessar o formulário.</p>
          </div>

          {/* Blocos cadastrados */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Blocos do Condomínio</h4>
            <p className={styles.formHint} style={{ background: '#fff3e0', padding: '10px 14px', borderRadius: 'var(--raio-borda-sm)', border: '1px solid #ffe0b2', color: '#e65100' }}>
              <strong>Atenção:</strong> Só é necessário cadastrar os blocos caso exija a identificação do usuário. Se a identificação estiver dispensada, não precisa cadastrar os blocos.
            </p>
            <div className={styles.blocosTagList}>
              {formBlocosCad.map((b, i) => (
                <span key={i} className={styles.blocoTag}>
                  {b}
                  <button onClick={() => setFormBlocosCad(prev => prev.filter((_, j) => j !== i))}><X size={10} /></button>
                </span>
              ))}
              <div className={styles.blocosAddRow}>
                <input className={styles.formInputSm} placeholder="Novo bloco..." value={novoBlocoNome} onChange={e => setNovoBlocoNome(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && novoBlocoNome.trim()) { setFormBlocosCad(prev => [...prev, novoBlocoNome.trim()]); setNovoBlocoNome(''); } }} />
                <button className={styles.blocosAddBtn} onClick={() => { if (novoBlocoNome.trim()) { setFormBlocosCad(prev => [...prev, novoBlocoNome.trim()]); setNovoBlocoNome(''); } }}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Criar QR Code */}
          <div className={styles.formSection}>
            <h4 className={styles.formSectionTitle}>Criar QR Code</h4>
            <p className={styles.formHint}>Adicione os campos que deseja no formulário. O respondente preencherá nessa ordem.</p>

            {/* Favoritos */}
            {favoritos.length > 0 && (
              <div className={styles.favSection}>
                <h5 className={styles.favTitulo}><Heart size={14} /> Favoritos</h5>
                <div className={styles.favGrid}>
                  {favoritos.map(tipo => {
                    const bd = BLOCOS_DISPONIVEIS.find(b => b.tipo === tipo);
                    if (!bd) return null;
                    return (
                      <button key={bd.tipo} className={styles.blocoAddCard} onClick={() => adicionarBloco(bd.tipo)}>
                        <button
                          type="button"
                          className={`${styles.favBtn} ${styles.favBtnAtivo}`}
                          onClick={e => { e.stopPropagation(); toggleFavorito(bd.tipo); }}
                          title="Remover do favoritos"
                        >
                          <Heart size={12} />
                        </button>
                        <span className={styles.blocoAddIcon} style={{ background: bd.cor + '18', color: bd.cor }}>{bd.icone}</span>
                        <span>{bd.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={styles.blocosGrid}>
              {BLOCOS_DISPONIVEIS.map(bd => (
                <button key={bd.tipo} className={styles.blocoAddCard} onClick={() => adicionarBloco(bd.tipo)}>
                  <button
                    type="button"
                    className={`${styles.favBtn} ${favoritos.includes(bd.tipo) ? styles.favBtnAtivo : ''}`}
                    onClick={e => { e.stopPropagation(); toggleFavorito(bd.tipo); }}
                    title={favoritos.includes(bd.tipo) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Heart size={12} />
                  </button>
                  <span className={styles.blocoAddIcon} style={{ background: bd.cor + '18', color: bd.cor }}>{bd.icone}</span>
                  <span>{bd.label}</span>
                </button>
              ))}
            </div>

            {formBlocos.length > 0 && (
              <div className={styles.blocosBuildList}>
                <h5 className={styles.blocosSubtitle}>{formBlocos.length} blocos adicionados</h5>
                {formBlocos.map(renderBlocoBuilder)}
              </div>
            )}
          </div>

          {/* Botão criar */}
          <button className={styles.formSubmit} onClick={criarQRCode} disabled={!formNome.trim() || formBlocos.length === 0}>
            <QrCode size={18} /> Gerar QR Code
          </button>
        </div>
      </Modal>

      {/* ═══ MODAL: Preview QR Code ═══ */}
      <Modal aberto={!!previewQR} onFechar={() => setPreviewQR(null)} titulo="QR Code" largura="sm">
        {previewQR && (
          <div className={styles.previewModal}>
            <div className={styles.previewQR}>
              <QRCodeCanvas
                value={`${window.location.origin}/qrcode/responder/${previewQR.id}`}
                size={240}
                level="H"
                imageSettings={previewQR.logo ? { src: previewQR.logo, height: 40, width: 40, excavate: true } : undefined}
              />
            </div>
            <h4 className={styles.previewNome}>{previewQR.nome}</h4>
            {previewQR.descricao && <p className={styles.previewDesc}>{previewQR.descricao}</p>}
            <div className={styles.previewUrl}>
              <code>{`${window.location.origin}/qrcode/responder/${previewQR.id}`}</code>
              <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/qrcode/responder/${previewQR.id}`)}><Copy size={14} /></button>
            </div>
            <div className={styles.previewActions}>
              <button className={styles.btnResponder} onClick={() => { setPreviewQR(null); abrirResponder(previewQR); }}>
                <Eye size={14} /> Testar Resposta
              </button>
              <button className={styles.btnDownload} onClick={() => {
                const canvas = document.querySelector(`.${styles.previewQR} canvas`) as HTMLCanvasElement;
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `qrcode-${previewQR.id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              }}>
                <Download size={14} /> Baixar PNG
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ MODAL: Responder QR Code ═══ */}
      <Modal aberto={!!responderQR} onFechar={() => setResponderQR(null)} titulo={responderQR?.nome || 'Formulário'} largura="md">
        {responderQR && etapaResposta === 'identificacao' && (
          <div className={styles.idForm}>
            <h4 className={styles.idTitulo}>Identificação</h4>
            <p className={styles.idDesc}>Por favor, identifique-se antes de continuar.</p>

            {/* Tipo */}
            <label className={styles.formLabel}>Você é:</label>
            <div className={styles.idTipoGrid}>
              {([
                { val: 'morador', label: 'Morador', icon: <Home size={20} /> },
                { val: 'funcionario', label: 'Funcionário', icon: <UserCheck size={20} /> },
                { val: 'prestador', label: 'Prestador', icon: <Building2 size={20} /> },
              ] as const).map(t => (
                <button key={t.val}
                  className={`${styles.idTipoBtn} ${identificacao.tipo === t.val ? styles.idTipoBtnAtivo : ''}`}
                  onClick={() => setIdentificacao(prev => ({ ...prev, tipo: t.val }))}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Nome */}
            <label className={styles.formLabel}>Seu Nome</label>
            <input className={styles.formInput} placeholder="Digite seu nome completo..." value={identificacao.nome} onChange={e => setIdentificacao(prev => ({ ...prev, nome: e.target.value }))} />

            {/* Bloco */}
            <label className={styles.formLabel}>Bloco</label>
            <select className={styles.formSelect} value={identificacao.bloco} onChange={e => setIdentificacao(prev => ({ ...prev, bloco: e.target.value }))}>
              <option value="">Selecione o bloco...</option>
              {responderQR.blocosCadastrados.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Unidade */}
            <label className={styles.formLabel}>Apartamento / Casa</label>
            <input className={styles.formInput} placeholder="Ex: 204, Casa 12..." value={identificacao.unidade} onChange={e => setIdentificacao(prev => ({ ...prev, unidade: e.target.value }))} />

            {/* Anônimo */}
            <label className={`${styles.checkboxLabel} ${styles.checkboxDestaque}`}>
              <input type="checkbox" checked={identificacao.anonimo}
                onChange={e => setIdentificacao(prev => ({ ...prev, anonimo: e.target.checked, tipo: e.target.checked ? '' : prev.tipo, nome: e.target.checked ? '' : prev.nome, bloco: e.target.checked ? '' : prev.bloco, unidade: e.target.checked ? '' : prev.unidade }))} />
              <span>Não quero me identificar</span>
            </label>

            <button className={styles.formSubmit}
              onClick={avancarIdentificacao}
              disabled={!identificacao.anonimo && (!identificacao.tipo || !identificacao.nome || !identificacao.bloco || !identificacao.unidade)}>
              Continuar <ChevronRight size={16} />
            </button>
          </div>
        )}

        {responderQR && etapaResposta === 'formulario' && (
          <div className={styles.respForm}>
            {responderQR.logo && (
              <div className={styles.respLogo}>
                <img src={responderQR.logo} alt="Logo" />
              </div>
            )}
            {responderQR.descricao && <p className={styles.respDesc}>{responderQR.descricao}</p>}

            <div className={styles.respBlocos}>
              {responderQR.blocos.map(renderBlocoResposta)}
            </div>

            <button className={styles.formSubmit} onClick={enviarRespostas}>
              Enviar Respostas
            </button>
          </div>
        )}

        {responderQR && etapaResposta === 'enviado' && (
          <div className={styles.enviadoMsg}>
            <div className={styles.enviadoIcone}>
              <CheckSquare size={48} />
            </div>
            <h4>Respostas enviadas!</h4>
            <p>Obrigado por participar. Suas respostas foram registradas com sucesso.</p>
            <button className={styles.formSubmit} onClick={() => setResponderQR(null)}>Fechar</button>
          </div>
        )}
      </Modal>
      {/* Toast de feedback */}
      {toast && (
        <div className={styles.toast} style={{ borderLeftColor: toast.cor }}>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default QRCodePage;
