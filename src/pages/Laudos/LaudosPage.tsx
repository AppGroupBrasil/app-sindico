import React, { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/Common/PageHeader';
import Card from '../../components/Common/Card';
import Modal from '../../components/Common/Modal';
import HowItWorks from '../../components/Common/HowItWorks';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { laudos as laudosApi, condominios as condominiosApi } from '../../services/api';
import { Plus, FileWarning, FileCheck, Calendar, AlertTriangle, RefreshCw, Trash2, Edit2 } from 'lucide-react';

interface Laudo {
  id: string;
  condominio_id: string;
  condominio_nome?: string;
  tipo: string;
  titulo?: string;
  numero?: string;
  emissor?: string;
  responsavel_tecnico?: string;
  crea_cau?: string;
  data_emissao?: string;
  data_vencimento: string;
  prazo_alerta_dias: number;
  arquivo_url?: string;
  observacoes?: string;
  status: 'vigente' | 'proximo_vencimento' | 'vencido' | 'renovado' | 'cancelado';
  dias_restantes?: number;
}

const STATUS_COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  vigente:             { bg: '#dcfce7', fg: '#166534', label: 'Vigente' },
  proximo_vencimento:  { bg: '#fef3c7', fg: '#92400e', label: 'Próximo do vencimento' },
  vencido:             { bg: '#fee2e2', fg: '#991b1b', label: 'Vencido' },
  renovado:            { bg: '#e0e7ff', fg: '#3730a3', label: 'Renovado' },
  cancelado:           { bg: '#f3f4f6', fg: '#6b7280', label: 'Cancelado' },
};

const LaudosPage: React.FC = () => {
  const [list, setList] = useState<Laudo[]>([]);
  const [tipos, setTipos] = useState<{ key: string; label: string }[]>([]);
  const [condos, setCondos] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [renovarFrom, setRenovarFrom] = useState<Laudo | null>(null);
  const [editing, setEditing] = useState<Laudo | null>(null);

  // form
  const [form, setForm] = useState<any>({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  // filtros
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroCondo, setFiltroCondo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const carregar = async () => {
    setLoading(true);
    try {
      const [l, t, c, r] = await Promise.all([
        laudosApi.list({
          status: filtroStatus || undefined,
          condominioId: filtroCondo || undefined,
          tipo: filtroTipo || undefined,
        }),
        laudosApi.tipos(),
        condominiosApi.list(),
        laudosApi.resumo(),
      ]);
      setList(l); setTipos(t); setCondos(c); setResumo(r);
    } catch (e: any) {
      setErro(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { carregar(); /* eslint-disable-next-line */ }, [filtroStatus, filtroCondo, filtroTipo]);

  const abrirNovo = () => {
    setEditing(null);
    setRenovarFrom(null);
    setForm({
      condominioId: condos[0]?.id || '',
      tipo: tipos[0]?.key || 'avcb',
      prazoAlertaDias: 30,
    });
    setModalOpen(true);
  };

  const abrirEditar = (l: Laudo) => {
    setEditing(l);
    setRenovarFrom(null);
    setForm({
      condominioId: l.condominio_id,
      tipo: l.tipo,
      titulo: l.titulo, numero: l.numero,
      emissor: l.emissor, responsavelTecnico: l.responsavel_tecnico, creaCau: l.crea_cau,
      dataEmissao: l.data_emissao?.slice(0, 10),
      dataVencimento: l.data_vencimento?.slice(0, 10),
      prazoAlertaDias: l.prazo_alerta_dias,
      arquivoUrl: l.arquivo_url, observacoes: l.observacoes,
    });
    setModalOpen(true);
  };

  const abrirRenovar = (l: Laudo) => {
    setEditing(null);
    setRenovarFrom(l);
    setForm({
      condominioId: l.condominio_id,
      tipo: l.tipo,
      titulo: l.titulo,
      emissor: l.emissor, responsavelTecnico: l.responsavel_tecnico, creaCau: l.crea_cau,
      dataEmissao: new Date().toISOString().slice(0, 10),
      prazoAlertaDias: l.prazo_alerta_dias,
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    setSalvando(true); setErro('');
    try {
      if (renovarFrom) {
        await laudosApi.renovar(renovarFrom.id, form);
      } else if (editing) {
        await laudosApi.update(editing.id, form);
      } else {
        await laudosApi.create(form);
      }
      setModalOpen(false);
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally { setSalvando(false); }
  };

  const excluir = async (l: Laudo) => {
    if (!confirm(`Excluir laudo "${l.titulo || l.tipo}"? Esta ação não pode ser desfeita.`)) return;
    try { await laudosApi.remove(l.id); carregar(); }
    catch (e: any) { alert(e.message); }
  };

  const tiposMap = useMemo(() => Object.fromEntries(tipos.map(t => [t.key, t.label])), [tipos]);

  return (
    <div id="laudos-content">
      <HowItWorks
        titulo="Laudos Obrigatórios"
        descricao="Centralize os laudos técnicos exigidos por lei (AVCB, SPDA, elevador, potabilidade, PMOC, etc.). O sistema envia alertas por e-mail quando estão próximos do vencimento."
        passos={[
          'Cadastre cada laudo com a data de vencimento e o prazo para alerta',
          'Anexe o arquivo PDF (opcional)',
          'O sistema dispara e-mails automáticos em D-30, D-15, D-7, D-3, D-1 e no dia do vencimento',
          'Use "Renovar" ao receber um novo laudo: o anterior fica como histórico',
        ]}
      />

      <PageHeader
        titulo="Laudos Obrigatórios"
        subtitulo="AVCB, SPDA, elevador e demais laudos com alerta de vencimento"
      />

      {/* KPIs */}
      {resumo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
          <KpiBox label="Total" valor={resumo.total} icon={<FileCheck size={18} />} cor="#2563eb" />
          <KpiBox label="Vigentes" valor={resumo.vigentes} icon={<FileCheck size={18} />} cor="#16a34a" />
          <KpiBox label="Próximos 30 dias" valor={resumo.proximos_30} icon={<AlertTriangle size={18} />} cor="#d97706" />
          <KpiBox label="Vencidos" valor={resumo.vencidos} icon={<FileWarning size={18} />} cor="#dc2626" />
        </div>
      )}

      {/* Filtros + botão novo */}
      <Card padding="md">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={selectStyle}>
            <option value="">Todos os status</option>
            <option value="vigente">Vigentes</option>
            <option value="proximo_vencimento">Próximos do vencimento</option>
            <option value="vencido">Vencidos</option>
            <option value="renovado">Renovados (histórico)</option>
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={selectStyle}>
            <option value="">Todos os tipos</option>
            {tipos.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <select value={filtroCondo} onChange={e => setFiltroCondo(e.target.value)} style={selectStyle}>
            <option value="">Todos os condomínios</option>
            {condos.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button onClick={abrirNovo} style={btnPrimary}><Plus size={16} /> Novo laudo</button>
        </div>
      </Card>

      {/* Lista */}
      {loading ? <LoadingSpinner /> : (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {list.length === 0 && (
            <Card padding="md"><p style={{ margin: 0, color: '#6b7280' }}>Nenhum laudo cadastrado com os filtros atuais.</p></Card>
          )}
          {list.map(l => {
            const st = STATUS_COLOR[l.status];
            const dias = l.dias_restantes ?? 0;
            return (
              <Card key={l.id} padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 15 }}>{l.titulo || tiposMap[l.tipo] || l.tipo}</strong>
                      <span style={{ background: st.bg, color: st.fg, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{st.label}</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                      {tiposMap[l.tipo] || l.tipo} · {l.condominio_nome || '—'}
                      {l.numero && ` · nº ${l.numero}`}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13 }}>
                      <Calendar size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                      Vence em <strong>{new Date(l.data_vencimento).toLocaleDateString('pt-BR')}</strong>
                      {l.status !== 'renovado' && l.status !== 'cancelado' && (
                        <span style={{ marginLeft: 8, color: dias < 0 ? '#dc2626' : dias <= 30 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                          ({dias < 0 ? `vencido há ${Math.abs(dias)} dia(s)` : `${dias} dia(s) restantes`})
                        </span>
                      )}
                    </div>
                    {l.emissor && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>Emissor: {l.emissor}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                    {l.arquivo_url && <a href={l.arquivo_url} target="_blank" rel="noreferrer" style={btnGhost}>Ver PDF</a>}
                    <button onClick={() => abrirRenovar(l)} style={btnSecondary} title="Renovar"><RefreshCw size={14} /></button>
                    <button onClick={() => abrirEditar(l)} style={btnSecondary} title="Editar"><Edit2 size={14} /></button>
                    <button onClick={() => excluir(l)} style={btnDanger} title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <Modal aberto onFechar={() => setModalOpen(false)} titulo={renovarFrom ? 'Renovar laudo' : editing ? 'Editar laudo' : 'Novo laudo'}>
          <div style={{ display: 'grid', gap: 12 }}>
            {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 }}>{erro}</div>}

            <Field label="Tipo">
              <select value={form.tipo || ''} onChange={e => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                {tipos.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Condomínio">
              <select value={form.condominioId || ''} onChange={e => setForm({ ...form, condominioId: e.target.value })} style={inputStyle}>
                <option value="">Selecione...</option>
                {condos.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Título (opcional)"><input value={form.titulo || ''} onChange={e => setForm({ ...form, titulo: e.target.value })} style={inputStyle} placeholder={`Ex: ${tiposMap[form.tipo] || ''}`} /></Field>
              <Field label="Número"><input value={form.numero || ''} onChange={e => setForm({ ...form, numero: e.target.value })} style={inputStyle} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Emissor / Órgão"><input value={form.emissor || ''} onChange={e => setForm({ ...form, emissor: e.target.value })} style={inputStyle} /></Field>
              <Field label="Responsável técnico"><input value={form.responsavelTecnico || ''} onChange={e => setForm({ ...form, responsavelTecnico: e.target.value })} style={inputStyle} /></Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Field label="CREA/CAU"><input value={form.creaCau || ''} onChange={e => setForm({ ...form, creaCau: e.target.value })} style={inputStyle} /></Field>
              <Field label="Data de emissão"><input type="date" value={form.dataEmissao || ''} onChange={e => setForm({ ...form, dataEmissao: e.target.value })} style={inputStyle} /></Field>
              <Field label="Data de vencimento *"><input type="date" value={form.dataVencimento || ''} onChange={e => setForm({ ...form, dataVencimento: e.target.value })} style={inputStyle} /></Field>
            </div>
            <Field label="Avisar quantos dias antes?">
              <input type="number" min={1} max={365} value={form.prazoAlertaDias || 30} onChange={e => setForm({ ...form, prazoAlertaDias: parseInt(e.target.value, 10) })} style={inputStyle} />
            </Field>
            <Field label="URL do arquivo (PDF)">
              <input value={form.arquivoUrl || ''} onChange={e => setForm({ ...form, arquivoUrl: e.target.value })} style={inputStyle} placeholder="https://..." />
            </Field>
            <Field label="Observações">
              <textarea value={form.observacoes || ''} onChange={e => setForm({ ...form, observacoes: e.target.value })} style={{ ...inputStyle, minHeight: 70 }} />
            </Field>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} style={btnGhost}>Cancelar</button>
              <button onClick={salvar} disabled={salvando} style={btnPrimary}>{salvando ? 'Salvando...' : (renovarFrom ? 'Renovar' : editing ? 'Salvar' : 'Cadastrar')}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'block' }}>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
    <div style={{ marginTop: 4 }}>{children}</div>
  </label>
);

const KpiBox: React.FC<{ label: string; valor: number | string; icon: React.ReactNode; cor: string }> = ({ label, valor, icon, cor }) => (
  <Card padding="sm">
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ background: `${cor}22`, color: cor, padding: 8, borderRadius: 10, display: 'flex' }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{valor ?? 0}</div>
      </div>
    </div>
  </Card>
);

const inputStyle: React.CSSProperties = { width: '100%', padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 };
const selectStyle: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, background: '#fff' };
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, fontWeight: 600, cursor: 'pointer' };
const btnSecondary: React.CSSProperties = { padding: '8px 10px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, cursor: 'pointer' };
const btnDanger: React.CSSProperties = { padding: '8px 10px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '8px 12px', background: 'transparent', color: '#374151', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };

export default LaudosPage;
