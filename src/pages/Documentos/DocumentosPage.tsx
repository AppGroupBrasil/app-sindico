import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText, Search, Plus, Upload, Download, Edit, Trash2,
  Calendar, Building2, AlertTriangle, Cpu, Tag, Eye, Clock
} from 'lucide-react';
import PageHeader from '../../components/Common/PageHeader';
import HowItWorks from '../../components/Common/HowItWorks';
import Modal from '../../components/Common/Modal';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import Pagination from '../../components/Common/Pagination';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDemo } from '../../contexts/DemoContext';
import { usePagination } from '../../hooks/usePagination';
import { compartilharConteudo, imprimirElemento, gerarPdfDeElemento } from '../../utils/exportUtils';
import {
  documentos as docsApi, condominios as condominiosApi,
  equipamentos as equipamentosApi, upload as uploadApi
} from '../../services/api';
import type { DocumentoTecnico, ResumoDocumentos } from '../../types';
import styles from './DocumentosPage.module.css';

const TIPOS_DOC: Record<string, string> = {
  manual: 'Manual', certificado: 'Certificado', garantia: 'Garantia',
  laudo: 'Laudo', projeto: 'Projeto', planta: 'Planta Técnica',
  contrato: 'Contrato', nota_fiscal: 'Nota Fiscal', relatorio_inspecao: 'Rel. Inspeção',
  art: 'ART', alvara: 'Alvará', outro: 'Outro',
};

const STATUS_DOC: Record<string, { label: string; classe: string }> = {
  vigente: { label: 'Vigente', classe: styles.badgeVigente },
  vencido: { label: 'Vencido', classe: styles.badgeVencido },
  revogado: { label: 'Revogado', classe: styles.badgeRevogado },
  rascunho: { label: 'Rascunho', classe: styles.badgeRascunho },
};

const FORM_INICIAL = {
  titulo: '', descricao: '', tipo: 'outro', status: 'vigente',
  arquivoUrl: '', arquivoNome: '', arquivoTamanho: 0, arquivoTipo: '',
  condominioId: '', equipamentoId: '', fornecedorId: '', planoId: '',
  dataEmissao: '', dataValidade: '', tags: '', versao: '1.0', observacoes: '',
};

const DocumentosPage: React.FC = () => {
  const { roleNivel } = usePermissions();
  const { usuario } = useAuth();
  const { tentarAcao } = useDemo();
  const ehGestor = roleNivel >= 2;

  const [docs, setDocs] = useState<DocumentoTecnico[]>([]);
  const [resumo, setResumo] = useState<ResumoDocumentos>({ total: 0, porTipo: [], vencidos: 0, aVencer30: 0 });
  const [condominiosList, setCondominiosList] = useState<any[]>([]);
  const [equipamentosList, setEquipamentosList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroCondo, setFiltroCondo] = useState('todos');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<DocumentoTecnico | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const carregar = async () => {
    setLoading(true);
    const [listaRes, resumoRes, condsRes, eqsRes] = await Promise.allSettled([
      docsApi.list() as Promise<DocumentoTecnico[]>,
      docsApi.resumo() as Promise<ResumoDocumentos>,
      condominiosApi.list(),
      equipamentosApi.list(),
    ]);

    if (listaRes.status === 'fulfilled') setDocs(listaRes.value);
    else { console.error('Erro lista documentos:', listaRes.reason); setDocs([]); }

    if (resumoRes.status === 'fulfilled') setResumo(resumoRes.value);
    else {
      console.error('Erro resumo documentos:', resumoRes.reason);
      const docsAtuais = listaRes.status === 'fulfilled' ? listaRes.value : [];
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const em30 = new Date(hoje); em30.setDate(em30.getDate() + 30);
      const vencidos = docsAtuais.filter(d => d.dataValidade && new Date(d.dataValidade) < hoje).length;
      const aVencer30 = docsAtuais.filter(d => d.dataValidade && new Date(d.dataValidade) >= hoje && new Date(d.dataValidade) <= em30).length;
      const porTipoMap: Record<string, number> = {};
      docsAtuais.forEach(d => { porTipoMap[d.tipo] = (porTipoMap[d.tipo] || 0) + 1; });
      setResumo({
        total: docsAtuais.length,
        vencidos,
        aVencer30,
        porTipo: Object.entries(porTipoMap).map(([tipo, quantidade]) => ({ tipo, quantidade })),
      } as ResumoDocumentos);
    }

    setCondominiosList(condsRes.status === 'fulfilled' ? (condsRes.value as any[]) : []);
    setEquipamentosList(eqsRes.status === 'fulfilled' ? (eqsRes.value as any[]) : []);

    if (listaRes.status === 'rejected') {
      console.warn('[Documentos] Falha ao carregar lista — exibindo página vazia. Detalhes:', (listaRes.reason as any)?.message);
    }

    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    let lista = docs;
    if (filtroTipo !== 'todos') lista = lista.filter(d => d.tipo === filtroTipo);
    if (filtroStatus !== 'todos') lista = lista.filter(d => d.status === filtroStatus);
    if (filtroCondo !== 'todos') lista = lista.filter(d => d.condominioId === filtroCondo);
    if (busca.trim()) {
      const termos = busca.toLowerCase().split(/\s+/);
      lista = lista.filter(d => {
        const texto = `${d.titulo} ${d.descricao || ''} ${d.equipamentoNome || ''} ${d.condominioNome || ''} ${d.fornecedorNome || ''} ${(d.tags || []).join(' ')}`.toLowerCase();
        return termos.every(t => texto.includes(t));
      });
    }
    return lista;
  }, [docs, filtroTipo, filtroStatus, filtroCondo, busca]);

  const pag = usePagination(filtrados, { pageSize: 12 });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!tentarAcao()) return;
    setUploading(true);
    try {
      const url = await uploadApi.document(file);
      setForm(f => ({
        ...f,
        arquivoUrl: url,
        arquivoNome: file.name,
        arquivoTamanho: file.size,
        arquivoTipo: file.type,
      }));
    } catch (err: any) {
      console.error('Erro no upload:', err);
      alert('Falha no upload do arquivo: ' + (err?.message || 'tente novamente'));
    } finally {
      setUploading(false);
    }
  };

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...FORM_INICIAL, condominioId: condominiosList[0]?.id || '' });
    setShowModal(true);
  };

  const abrirEditar = (doc: DocumentoTecnico) => {
    setEditando(doc);
    setForm({
      titulo: doc.titulo,
      descricao: doc.descricao || '',
      tipo: doc.tipo,
      status: doc.status,
      arquivoUrl: doc.arquivoUrl,
      arquivoNome: doc.arquivoNome,
      arquivoTamanho: doc.arquivoTamanho,
      arquivoTipo: doc.arquivoTipo || '',
      condominioId: doc.condominioId,
      equipamentoId: doc.equipamentoId || '',
      fornecedorId: doc.fornecedorId || '',
      planoId: doc.planoId || '',
      dataEmissao: doc.dataEmissao ? doc.dataEmissao.slice(0, 10) : '',
      dataValidade: doc.dataValidade ? doc.dataValidade.slice(0, 10) : '',
      tags: (doc.tags || []).join(', '),
      versao: doc.versao || '1.0',
      observacoes: doc.observacoes || '',
    });
    setShowModal(true);
  };

  const salvar = async () => {
    if (!form.titulo.trim() || !form.arquivoUrl) return;
    if (!tentarAcao()) return;
    setSalvando(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        equipamentoId: form.equipamentoId || null,
        fornecedorId: form.fornecedorId || null,
        planoId: form.planoId || null,
      };
      if (editando) {
        await docsApi.update(editando.id, payload);
      } else {
        await docsApi.create(payload);
      }
      setShowModal(false);
      carregar();
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      alert('Falha ao salvar documento: ' + (err?.message || 'tente novamente'));
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: string) => {
    if (!tentarAcao()) return;
    if (!confirm('Excluir este documento?')) return;
    await docsApi.remove(id);
    carregar();
  };

  const fmtTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isVencido = (d: DocumentoTecnico) => d.dataValidade && new Date(d.dataValidade) < new Date();
  const isAVencer = (d: DocumentoTecnico) => {
    if (!d.dataValidade) return false;
    const v = new Date(d.dataValidade);
    const agora = new Date();
    const em30 = new Date();
    em30.setDate(em30.getDate() + 30);
    return v >= agora && v <= em30;
  };

  if (loading) return <LoadingSpinner texto="Carregando documentos..." />;

  return (
    <div id="docs-content" className={styles.page}>
      <PageHeader
        titulo="Documentação Técnica"
        subtitulo="Gestão de documentos técnicos de manutenção"
        acoes={ehGestor ? <button className={styles.btnPrimary} onClick={abrirNovo}><Plus size={16} /> Novo Documento</button> : undefined}
        onCompartilhar={() => compartilharConteudo('Documentação Técnica', `${resumo.total} documentos cadastrados`)}
        onImprimir={() => imprimirElemento('docs-content')}
        onGerarPdf={() => gerarPdfDeElemento('docs-content', 'documentos-tecnicos')}
      />

      <HowItWorks
        titulo="Documentação Técnica"
        descricao="Centralize manuais, certificados, garantias, laudos e outros documentos técnicos dos seus equipamentos e condomínios."
        passos={[
          'Faça upload de PDFs, imagens ou documentos técnicos',
          'Vincule documentos a equipamentos, fornecedores ou planos de manutenção',
          'Acompanhe validades — certificados e garantias que estão vencendo',
          'Busque rapidamente qualquer documento por título, tipo ou tags',
        ]}
      />

      {/* Alertas de vencimento */}
      {resumo.vencidos > 0 && (
        <div className={`${styles.alertBox} ${styles.alertDanger}`}>
          <AlertTriangle size={18} />
          <strong>{resumo.vencidos} documento(s) vencido(s)</strong> — atualize os certificados e garantias expirados.
        </div>
      )}
      {resumo.aVencer30 > 0 && (
        <div className={`${styles.alertBox} ${styles.alertWarning}`}>
          <Clock size={18} />
          <strong>{resumo.aVencer30} documento(s) a vencer nos próximos 30 dias</strong> — providencie a renovação.
        </div>
      )}

      {/* Resumo */}
      <div className={styles.resumoGrid}>
        <div className={styles.resumoCard}>
          <div className={`${styles.resumoIcon} ${styles.azul}`}><FileText size={20} /></div>
          <div className={styles.resumoInfo}>
            <h4>{resumo.total}</h4>
            <span>Total</span>
          </div>
        </div>
        <div className={styles.resumoCard}>
          <div className={`${styles.resumoIcon} ${styles.verde}`}><Eye size={20} /></div>
          <div className={styles.resumoInfo}>
            <h4>{resumo.total - resumo.vencidos}</h4>
            <span>Vigentes</span>
          </div>
        </div>
        <div className={styles.resumoCard}>
          <div className={`${styles.resumoIcon} ${styles.vermelho}`}><AlertTriangle size={20} /></div>
          <div className={styles.resumoInfo}>
            <h4>{resumo.vencidos}</h4>
            <span>Vencidos</span>
          </div>
        </div>
        <div className={styles.resumoCard}>
          <div className={`${styles.resumoIcon} ${styles.laranja}`}><Clock size={20} /></div>
          <div className={styles.resumoInfo}>
            <h4>{resumo.aVencer30}</h4>
            <span>A vencer (30d)</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input placeholder="Buscar documentos..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos os tipos</option>
          {Object.entries(TIPOS_DOC).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_DOC).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
        <select value={filtroCondo} onChange={e => setFiltroCondo(e.target.value)}>
          <option value="todos">Todos os condomínios</option>
          {condominiosList.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* Grid de documentos */}
      {pag.items.length > 0 ? (
        <>
          <div className={styles.docGrid}>
            {pag.items.map((doc: DocumentoTecnico) => {
              const st = STATUS_DOC[doc.status] || STATUS_DOC.vigente;
              return (
                <div key={doc.id} className={styles.docCard}>
                  <div className={styles.docHeader}>
                    <h4>{doc.titulo}</h4>
                    <span className={`${styles.docBadge} ${st.classe}`}>{st.label}</span>
                  </div>

                  <span className={styles.docTipo}>
                    <FileText size={12} /> {TIPOS_DOC[doc.tipo] || doc.tipo}
                  </span>

                  <div className={styles.docMeta}>
                    {doc.condominioNome && <span><Building2 size={12} /> {doc.condominioNome}</span>}
                    {doc.equipamentoNome && <span><Cpu size={12} /> {doc.equipamentoNome}</span>}
                    {doc.dataValidade && (
                      <span style={{ color: isVencido(doc) ? '#dc2626' : isAVencer(doc) ? '#ea580c' : undefined }}>
                        <Calendar size={12} /> Val: {new Date(doc.dataValidade).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    <span><Tag size={12} /> v{doc.versao}</span>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className={styles.docTags}>
                      {doc.tags.map((t, i) => <span key={i}>{t}</span>)}
                    </div>
                  )}

                  <div className={styles.docActions}>
                    <button onClick={() => window.open(doc.arquivoUrl, '_blank')}>
                      <Download size={13} /> {fmtTamanho(doc.arquivoTamanho)}
                    </button>
                    {ehGestor && (
                      <>
                        <button onClick={() => abrirEditar(doc)}><Edit size={13} /> Editar</button>
                        <button className={styles.btnDanger} onClick={() => excluir(doc.id)}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={pag.page}
            totalPages={pag.totalPages}
            totalItems={pag.totalItems}
            pageSize={pag.pageSize}
            onPageChange={pag.goToPage}
            hasNext={pag.hasNext}
            hasPrev={pag.hasPrev}
          />
        </>
      ) : (
        <div className={styles.empty}>
          <FileText size={48} />
          <h4>Nenhum documento encontrado</h4>
          <p>Adicione manuais, certificados, garantias e outros documentos técnicos para centralizar a documentação.</p>
        </div>
      )}

      {/* Modal de criação/edição */}
      <Modal aberto={showModal} onFechar={() => setShowModal(false)} titulo={editando ? 'Editar Documento' : 'Novo Documento'} largura="lg">
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Título *</label>
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Nome do documento" />
          </div>
          <div className={styles.formGroup}>
            <label>Tipo *</label>
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {Object.entries(TIPOS_DOC).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className={`${styles.formGroup} ${styles.full}`}>
            <label>Descrição</label>
            <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descrição do documento..." rows={2} />
          </div>

          {/* Upload */}
          <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} />
          <div className={`${styles.uploadArea} ${form.arquivoUrl ? styles.hasFile : ''}`} onClick={() => fileRef.current?.click()}>
            {uploading ? (
              <span>Enviando arquivo...</span>
            ) : form.arquivoUrl ? (
              <span className={styles.uploadFileName}>
                <FileText size={18} /> {form.arquivoNome} ({fmtTamanho(form.arquivoTamanho)})
              </span>
            ) : (
              <>
                <Upload size={24} />
                <p style={{ margin: '8px 0 0', fontSize: 13 }}>Clique para fazer upload do documento (PDF, imagem)</p>
              </>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Condomínio *</label>
            <select value={form.condominioId} onChange={e => setForm(f => ({ ...f, condominioId: e.target.value }))}>
              <option value="">Selecione</option>
              {condominiosList.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Equipamento</label>
            <select value={form.equipamentoId} onChange={e => setForm(f => ({ ...f, equipamentoId: e.target.value }))}>
              <option value="">Nenhum</option>
              {equipamentosList.filter((eq: any) => !form.condominioId || eq.condominioId === form.condominioId).map((eq: any) => <option key={eq.id} value={eq.id}>{eq.nome} ({eq.codigo})</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {Object.entries(STATUS_DOC).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Versão</label>
            <input value={form.versao} onChange={e => setForm(f => ({ ...f, versao: e.target.value }))} placeholder="1.0" />
          </div>
          <div className={styles.formGroup}>
            <label>Data de Emissão</label>
            <input type="date" value={form.dataEmissao} onChange={e => setForm(f => ({ ...f, dataEmissao: e.target.value }))} />
          </div>
          <div className={styles.formGroup}>
            <label>Data de Validade</label>
            <input type="date" value={form.dataValidade} onChange={e => setForm(f => ({ ...f, dataValidade: e.target.value }))} />
          </div>
          <div className={`${styles.formGroup} ${styles.full}`}>
            <label>Tags (separadas por vírgula)</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="elevador, certificado, anual" />
          </div>
          <div className={`${styles.formGroup} ${styles.full}`}>
            <label>Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancelar</button>
          <button className={styles.btnPrimary} onClick={salvar} disabled={salvando || !form.titulo.trim() || !form.arquivoUrl}>
            {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentosPage;
