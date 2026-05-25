import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Pencil, Trash2, Plus, Image as ImageIcon, Eye, BookOpen, Save, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { revistas as revistasApi, condominios as condominiosApi, upload as uploadApi } from '../../services/api';
import { categories } from './data/categories';
import styles from './PainelRevistaPage.module.css';

interface Pagina {
  id: string;
  categoria: string;
  ordem: number;
  titulo: string;
  texto: string;
  fotos: string[];
}

interface Revista {
  id: string;
  condominio_id: string;
  titulo: string;
  subtitulo: string | null;
  capa_url: string | null;
  cor_capa: string;
  efeitos: string[];
  publicada: boolean;
  paginas: Pagina[];
}

const EFEITOS = [
  { id: 'sombra-titulo', label: 'Sombra no título' },
  { id: 'negrito-caps', label: 'Negrito + caixa alta' },
  { id: 'faixa-topo', label: 'Faixa colorida no topo' },
  { id: 'borda', label: 'Borda destacada' },
  { id: 'gradiente', label: 'Gradiente sobre a foto' },
  { id: 'filtro-escuro', label: 'Filtro escuro' },
];

const PainelRevistaPage: React.FC = () => {
  const [condId, setCondId] = useState<string | null>(null);
  const [revista, setRevista] = useState<Revista | null>(null);
  const [loading, setLoading] = useState(true);
  const [editPaginaId, setEditPaginaId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Pagina>>({});
  const [addModal, setAddModal] = useState<{ open: boolean; fromCategoria?: string; mode: 'choose' | 'pickCategory' }>({ open: false, mode: 'choose' });
  // -1 = capa, 0..N-1 = página correspondente
  const [paginaIdx, setPaginaIdx] = useState<number>(-1);
  const capaFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const conds = await condominiosApi.list();
        const first = (conds as any[])[0];
        if (!first) { setLoading(false); return; }
        setCondId(first.id);
        const r = await revistasApi.getByCondominio(first.id);
        setRevista(r);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const salvarCapa = useCallback(async (patch: Partial<Revista>) => {
    if (!revista) return;
    const next = { ...revista, ...patch };
    setRevista(next);
    try {
      await revistasApi.updateCapa(revista.id, patch);
    } catch (e) { console.error(e); }
  }, [revista]);

  const toggleEfeito = (id: string) => {
    if (!revista) return;
    const atuais = revista.efeitos || [];
    const next = atuais.includes(id) ? atuais.filter(e => e !== id) : [...atuais, id];
    salvarCapa({ efeitos: next });
  };

  const uploadCapa = async (file: File) => {
    try {
      const url = await uploadApi.image(file, 'revista');
      salvarCapa({ capa_url: url });
    } catch (e) { alert('Falha no upload da capa'); }
  };

  const addPagina = async (categoria: string) => {
    if (!revista) return;
    try {
      const nova = await revistasApi.addPagina(revista.id, { categoria, titulo: '', texto: '', fotos: [] });
      const novasPaginas = [...revista.paginas, nova];
      setRevista({ ...revista, paginas: novasPaginas });
      setPaginaIdx(novasPaginas.length - 1);
      setEditPaginaId(nova.id);
      setEditDraft({ titulo: '', texto: '', fotos: [] });
      setAddModal({ open: false, mode: 'choose' });
    } catch { alert('Falha ao criar página'); }
  };

  const salvarEdicao = async () => {
    if (!revista || !editPaginaId) return;
    try {
      const updated = await revistasApi.updatePagina(editPaginaId, editDraft);
      setRevista({
        ...revista,
        paginas: revista.paginas.map(p => p.id === editPaginaId ? updated : p),
      });
      setEditPaginaId(null);
      setEditDraft({});
    } catch { alert('Falha ao salvar'); }
  };

  const excluirPagina = async (id: string) => {
    if (!revista) return;
    if (!confirm('Excluir esta página?')) return;
    try {
      await revistasApi.removePagina(id);
      setRevista({ ...revista, paginas: revista.paginas.filter(p => p.id !== id) });
    } catch { alert('Falha ao excluir'); }
  };

  const uploadFotoPagina = async (file: File) => {
    try {
      const url = await uploadApi.image(file, 'revista-pagina');
      setEditDraft(d => ({ ...d, fotos: [...(d.fotos || []), url] }));
    } catch { alert('Falha no upload'); }
  };

  const publicar = () => salvarCapa({ publicada: !revista?.publicada });

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Carregando...</div>;
  if (!revista) return <div style={{ padding: 40, textAlign: 'center' }}>Cadastre um condomínio antes de criar a revista.</div>;

  const efeitos = revista.efeitos || [];
  const coverStyle: React.CSSProperties = {
    background: revista.capa_url
      ? `url(${revista.capa_url}) center/cover no-repeat`
      : revista.cor_capa,
  };
  const titleStyle: React.CSSProperties = {
    textShadow: efeitos.includes('sombra-titulo') ? '2px 3px 12px rgba(0,0,0,0.7)' : 'none',
    fontWeight: efeitos.includes('negrito-caps') ? 900 : 800,
    textTransform: efeitos.includes('negrito-caps') ? 'uppercase' : 'none',
    border: efeitos.includes('borda') ? '3px solid #fff' : 'none',
    padding: efeitos.includes('borda') ? '8px 14px' : 0,
    borderRadius: efeitos.includes('borda') ? 8 : 0,
    display: efeitos.includes('borda') ? 'inline-block' : 'block',
  };
  const overlayStyle: React.CSSProperties = {
    background: efeitos.includes('gradiente')
      ? 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)'
      : efeitos.includes('filtro-escuro')
        ? 'rgba(0,0,0,0.55)'
        : 'rgba(0,0,0,0.25)',
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topBar}>
          <div className={styles.topTitle}><BookOpen size={22} style={{ verticalAlign: -4, marginRight: 8 }} />Revista do Síndico</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className={styles.bigAddBtn}
              style={{ padding: '12px 20px', fontSize: 14 }}
              onClick={() => setAddModal({ open: true, mode: 'pickCategory' })}
            >
              <Plus size={16} style={{ verticalAlign: -3, marginRight: 6 }} /> Adicionar nova página
            </button>
            <button className={`${styles.publishBtn} ${revista.publicada ? styles.published : ''}`} onClick={publicar}>
              <Eye size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
              {revista.publicada ? 'Despublicar' : 'Publicar revista'}
            </button>
          </div>
        </div>

        {/* NAVEGADOR DE PÁGINAS */}
        <div className={styles.navBar}>
          <button
            className={styles.navBtn}
            onClick={() => setPaginaIdx(i => Math.max(-1, i - 1))}
            disabled={paginaIdx <= -1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <div className={styles.navLabel}>
            {paginaIdx === -1
              ? `Capa · ${revista.paginas.length} ${revista.paginas.length === 1 ? 'página' : 'páginas'}`
              : `Página ${paginaIdx + 1} de ${revista.paginas.length}`}
          </div>
          <button
            className={styles.navBtn}
            onClick={() => setPaginaIdx(i => Math.min(revista.paginas.length - 1, i + 1))}
            disabled={paginaIdx >= revista.paginas.length - 1}
            aria-label="Próxima página"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* CAPA */}
        {paginaIdx === -1 && (
        <div className={styles.cover}>
          <div className={styles.coverPreview} style={coverStyle}>
            {efeitos.includes('faixa-topo') && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: revista.cor_capa }} />
            )}
            <div className={styles.coverOverlay} style={overlayStyle} />
            <div className={styles.coverContent}>
              <h1 className={styles.coverTitle} style={titleStyle}>{revista.titulo || 'Título da revista'}</h1>
              {revista.subtitulo && <p className={styles.coverSubtitle}>{revista.subtitulo}</p>}
            </div>
          </div>
          <div className={styles.coverFields}>
            <div className={styles.field}>
              <label>Título da revista</label>
              <input
                type="text"
                value={revista.titulo}
                onChange={e => setRevista({ ...revista, titulo: e.target.value })}
                onBlur={e => salvarCapa({ titulo: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Subtítulo (opcional)</label>
              <input
                type="text"
                value={revista.subtitulo || ''}
                onChange={e => setRevista({ ...revista, subtitulo: e.target.value })}
                onBlur={e => salvarCapa({ subtitulo: e.target.value })}
                placeholder="Ex.: Edição março 2026"
              />
            </div>
            <div className={styles.field}>
              <label>Cor de fundo (caso não tenha foto)</label>
              <input
                type="color"
                value={revista.cor_capa}
                onChange={e => salvarCapa({ cor_capa: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Foto de capa</label>
              <label className={styles.uploadBtn}>
                <ImageIcon size={16} />
                {revista.capa_url ? 'Trocar foto' : 'Enviar foto'}
                <input
                  ref={capaFileRef}
                  type="file"
                  accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadCapa(f); }}
                />
              </label>
            </div>
            <div className={styles.field}>
              <label>Efeitos visuais da capa</label>
              <div className={styles.chipsRow}>
                {EFEITOS.map(ef => (
                  <button
                    key={ef.id}
                    type="button"
                    className={`${styles.chip} ${efeitos.includes(ef.id) ? styles.active : ''}`}
                    onClick={() => toggleEfeito(ef.id)}
                  >
                    {ef.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* PÁGINAS — uma por vez */}
        {paginaIdx >= 0 && revista.paginas[paginaIdx] && (() => {
          const pagina = revista.paginas[paginaIdx];
          const cat = categories.find(c => c.id === pagina.categoria);
          const isEditing = editPaginaId === pagina.id;
            return (
              <div key={pagina.id} className={`${styles.pageCard} ${styles.pageCardFull}`} style={{ borderLeftColor: cat?.color || '#1E88E5' }}>
                <div className={styles.pageHead}>
                  <span className={styles.pageCategory} style={{ background: (cat?.color || '#1E88E5') + '22', color: cat?.color || '#0D47A1' }}>
                    {cat?.name || pagina.categoria}
                  </span>
                </div>

                {isEditing ? (
                  <>
                    <div className={styles.field}>
                      <label>Título da página</label>
                      <input
                        type="text"
                        value={editDraft.titulo || ''}
                        onChange={e => setEditDraft({ ...editDraft, titulo: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>Texto</label>
                      <textarea
                        rows={6}
                        value={editDraft.texto || ''}
                        onChange={e => setEditDraft({ ...editDraft, texto: e.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>Fotos</label>
                      <div className={styles.pageFotos}>
                        {(editDraft.fotos || []).map((url, i) => (
                          <div key={i} style={{ position: 'relative' }}>
                            <img src={url} alt="" />
                            <button
                              type="button"
                              onClick={() => setEditDraft(d => ({ ...d, fotos: (d.fotos || []).filter((_, idx) => idx !== i) }))}
                              style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer' }}
                            >×</button>
                          </div>
                        ))}
                        <label className={styles.uploadBtn} style={{ width: 80, height: 80, justifyContent: 'center' }}>
                          <Plus size={18} />
                          <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFotoPagina(f); }} />
                        </label>
                      </div>
                    </div>
                    <div className={styles.pageActions}>
                      <button className={`${styles.actionBtn} ${styles.actionAdd}`} onClick={salvarEdicao}><Save size={14} /> Salvar</button>
                      <button className={styles.actionBtn} style={{ background: '#f1f5f9' }} onClick={() => { setEditPaginaId(null); setEditDraft({}); }}><X size={14} /> Cancelar</button>
                    </div>
                  </>
                ) : (
                  <>
                    {pagina.titulo && <div className={styles.pageTitle}>{pagina.titulo}</div>}
                    {pagina.texto && <div className={styles.pageText}>{pagina.texto}</div>}
                    {pagina.fotos.length > 0 && (
                      <div className={styles.pageFotos}>
                        {pagina.fotos.map((url, i) => <img key={i} src={url} alt="" />)}
                      </div>
                    )}
                    <div className={styles.pageActions}>
                      <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => { setEditPaginaId(pagina.id); setEditDraft({ titulo: pagina.titulo, texto: pagina.texto, fotos: pagina.fotos }); }}>
                        <Pencil size={14} /> Editar
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => excluirPagina(pagina.id)}>
                        <Trash2 size={14} /> Excluir
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionAdd}`} onClick={() => setAddModal({ open: true, fromCategoria: pagina.categoria, mode: 'choose' })}>
                        <Plus size={14} /> Adicionar
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })()}

        {paginaIdx === -1 && revista.paginas.length === 0 && (
          <div className={styles.emptyState}>
            <h3>Sua revista ainda não tem páginas</h3>
            <p>Use o botão <strong>Adicionar nova página</strong> no topo para começar — cada categoria escolhida vira uma página.</p>
          </div>
        )}

      </div>

      {/* MODAL ADICIONAR */}
      {addModal.open && (
        <div className={styles.modalBg} onClick={() => setAddModal({ open: false, mode: 'choose' })}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {addModal.mode === 'choose' && addModal.fromCategoria ? (
              <>
                <h3 className={styles.modalTitle}>O que deseja adicionar?</h3>
                <div className={styles.modalGrid}>
                  <button onClick={() => addPagina(addModal.fromCategoria!)}>
                    ➕ Outra página em<br />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {categories.find(c => c.id === addModal.fromCategoria)?.name}
                    </span>
                  </button>
                  <button onClick={() => setAddModal({ open: true, mode: 'pickCategory' })}>
                    📂 Página de outra<br />categoria
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.modalTitle}>Escolha a categoria da página</h3>
                <p style={{ margin: '0 0 14px', color: '#475569', fontSize: 14, lineHeight: 1.5 }}>
                  Cada página é uma seção da sua revista. Escolha abaixo o tema dela.
                  Depois você poderá <strong>editar o título</strong>, escrever o <strong>texto</strong> e <strong>enviar fotos</strong>.
                  Use o botão <strong>Adicionar</strong> em cada página para criar mais páginas da mesma seção ou de outra categoria.
                </p>
                <div className={styles.categoryGrid}>
                  {categories.map(cat => (
                    <button key={cat.id} onClick={() => addPagina(cat.id)} style={{ borderColor: cat.color }}>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setAddModal({ open: false, mode: 'choose' })}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelRevistaPage;
