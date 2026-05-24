import React, { useState, useRef, useEffect } from 'react';
import HowItWorks from '../../components/Common/HowItWorks';
import PageHeader from '../../components/Common/PageHeader';
import Coachmark from '../../components/Common/Coachmark';
import Card from '../../components/Common/Card';
import StatusBadge from '../../components/Common/StatusBadge';
import Modal from '../../components/Common/Modal';
import { validarImagem } from '../../utils/imageUtils';
import { compartilharConteudo, imprimirElemento, gerarPdfDeElemento } from '../../utils/exportUtils';
import type { ChecklistLimpeza } from '../../types';
import { Plus, CheckCircle2, ClipboardCheck, MoreVertical, AlertTriangle, Camera, X, Upload, ChevronRight, MessageCircle, Settings, Save, Trash2, Hash, Search, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useDemo } from '../../contexts/DemoContext';
import { checklists as checklistsApi, reportes as reportesApi, moradores as moradoresApi, condominios as condominiosApi, checklistTemplates as templatesApi } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import EmptyState from '../../components/Common/EmptyState';
import Pagination from '../../components/Common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import styles from './Checklists.module.css';

interface ProblemaReport {
  itemId: string;
  checklistId: string;
  descricao: string;
  status: string;
  prioridade: string;
  imagens: string[];
}

interface AntesDepois {
  itemId: string;
  checklistId: string;
  fotoAntes: string | null;
  descAntes: string;
  fotoDepois: string | null;
  descDepois: string;
}

interface ContatoWhats {
  id: string;
  nome: string;
  telefone: string;
}

function gerarProtocolo(): string {
  const agora = new Date();
  const ano = agora.getFullYear().toString().slice(2);
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `RPT-${ano}${mes}${dia}-${seq}`;
}

const CORES = ['#2e7d32', '#f57c00', '#9e9e9e'];

const ChecklistsPage: React.FC = () => {
  const { tentarAcao } = useDemo();
  const [checklists, setChecklists] = useState<ChecklistLimpeza[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [busca, setBusca] = useState('');

  // Modal Novo Checklist
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoLocal, setNovoLocal] = useState('');
  const [novoTipo, setNovoTipo] = useState<'diaria' | 'semanal' | 'mensal' | 'especial'>('diaria');
  const [novoCond, setNovoCond] = useState('');
  const [novosItens, setNovosItens] = useState<string[]>(['']);
  const [condosOpcoes, setCondosOpcoes] = useState<Array<{ id: string; nome: string }>>([]);
  const [erroNovo, setErroNovo] = useState('');
  const [novoNomeModelo, setNovoNomeModelo] = useState('');
  const [salvarComoModelo, setSalvarComoModelo] = useState(false);

  // Aba ativa: realizados vs modelos
  const [aba, setAba] = useState<'realizados' | 'modelos'>('realizados');
  const [modelos, setModelos] = useState<any[]>([]);

  const adicionarItem = () => setNovosItens(prev => [...prev, '']);
  const removerItem = (idx: number) => setNovosItens(prev => prev.filter((_, i) => i !== idx));
  const atualizarItem = (idx: number, val: string) => setNovosItens(prev => prev.map((v, i) => i === idx ? val : v));

  const criarChecklist = async () => {
    if (!tentarAcao()) return;
    setErroNovo('');
    if (!novoCond) { setErroNovo('Selecione um condomínio.'); return; }
    if (!novoLocal.trim()) { setErroNovo('Informe o local.'); return; }
    if (novosItens.every(i => !i.trim())) { setErroNovo('Adicione pelo menos um item.'); return; }
    const payload = {
      condominioId: novoCond,
      local: novoLocal.trim(),
      tipo: novoTipo,
      itens: novosItens.filter(i => i.trim()).map((desc, idx) => ({ id: String(idx + 1), descricao: desc.trim(), concluido: false })),
      data: new Date().toISOString().split('T')[0],
      status: 'pendente',
    };
    try {
      const criado = await checklistsApi.create(payload) as ChecklistLimpeza;
      setChecklists(prev => [criado, ...prev]);

      // Salvar também como modelo reutilizável, se marcado
      if (salvarComoModelo) {
        try {
          await templatesApi.create({
            nome: novoNomeModelo.trim() || novoLocal.trim() || 'Modelo sem nome',
            condominioId: novoCond,
            local: novoLocal.trim(),
            tipo: novoTipo,
            itens: payload.itens.map((i: any) => ({ descricao: i.descricao })),
          });
          carregarModelos();
        } catch (e: any) {
          alert('Checklist criado, mas falhou salvar como modelo: ' + (e?.message || ''));
        }
      }

      setNovoLocal('');
      setNovoTipo('diaria');
      setNovoCond(condosOpcoes[0]?.id || '');
      setNovosItens(['']);
      setSalvarComoModelo(false);
      setNovoNomeModelo('');
      setShowNovoModal(false);
    } catch (err: any) {
      setErroNovo(err?.message || 'Erro ao salvar checklist.');
    }
  };


  // Reportar Problema
  const [problemaModal, setProblemaModal] = useState<{ ckId: string; itemId: string; itemDesc: string } | null>(null);
  const [problema, setProblema] = useState<ProblemaReport>({ itemId: '', checklistId: '', descricao: '', status: 'aberto', prioridade: 'media', imagens: [] });
  const [protocolo, setProtocolo] = useState('');
  const problemaInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp Contatos
  const [contatosWhats, setContatosWhats] = useState<ContatoWhats[]>([]);
  const [contatoSelecionado, setContatoSelecionado] = useState<string>('');
  const [whatsNome, setWhatsNome] = useState('');
  const [whatsTelefone, setWhatsTelefone] = useState('');
  const [showWhatsConfig, setShowWhatsConfig] = useState(false);

  const carregarModelos = () => templatesApi.list().then(setModelos).catch(() => setModelos([]));

  useEffect(() => {
    Promise.all([
      checklistsApi.list(),
      moradoresApi.listWhatsContatos().catch(() => []),
      condominiosApi.list().catch(() => []),
      templatesApi.list().catch(() => []),
    ]).then(([cks, contatos, condos, tpls]) => {
      setChecklists(cks as ChecklistLimpeza[]);
      setContatosWhats(contatos as ContatoWhats[]);
      const lista = (condos as Array<{ id: string; nome: string }>);
      setCondosOpcoes(lista);
      if (lista.length > 0) setNovoCond(lista[0].id);
      if ((contatos as ContatoWhats[]).length > 0) setContatoSelecionado((contatos as ContatoWhats[])[0].id);
      setModelos(tpls as any[]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const usarModelo = async (modeloId: string) => {
    try {
      const exec: any = await templatesApi.usar(modeloId);
      setChecklists(prev => [exec, ...prev]);
      setAba('realizados');
      alert('Checklist criado a partir do modelo!');
    } catch (err: any) {
      alert('Falha ao usar modelo: ' + (err?.message || 'erro desconhecido'));
    }
  };

  const excluirModelo = async (modeloId: string, nome: string) => {
    if (!confirm(`Excluir o modelo "${nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await templatesApi.remove(modeloId);
      setModelos(prev => prev.filter(m => m.id !== modeloId));
    } catch (err: any) {
      alert('Falha ao excluir modelo: ' + (err?.message || 'erro desconhecido'));
    }
  };

  const salvarNovoContato = async () => {
    if (!whatsNome.trim() || !whatsTelefone.trim()) return;
    try {
      const novo = await moradoresApi.addWhatsContato({ nome: whatsNome.trim(), telefone: whatsTelefone.trim() }) as ContatoWhats;
      setContatosWhats(prev => [...prev, novo]);
      if (!contatoSelecionado) setContatoSelecionado(novo.id);
    } catch (err) { console.error(err); }
    setWhatsNome('');
    setWhatsTelefone('');
  };

  const removerContato = async (id: string) => {
    try {
      await moradoresApi.removeWhatsContato(id);
      setContatosWhats(prev => prev.filter(c => c.id !== id));
      if (contatoSelecionado === id) setContatoSelecionado(contatosWhats.filter(c => c.id !== id)[0]?.id || '');
    } catch (err) { console.error(err); }
  };

  const formatarTelefone = (value: string) => {
    let v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
    else if (v.length > 0) v = `(${v}`;
    return v;
  };

  // Antes/Depois
  const [antesDepoisModal, setAntesDepoisModal] = useState<{ ckId: string; itemId: string; itemDesc: string } | null>(null);
  const [antesDepois, setAntesDepois] = useState<AntesDepois>({ itemId: '', checklistId: '', fotoAntes: null, descAntes: '', fotoDepois: null, descDepois: '' });
  const antesInputRef = useRef<HTMLInputElement>(null);
  const depoisInputRef = useRef<HTMLInputElement>(null);

  const enviarReporte = async () => {
    if (!tentarAcao()) return;
    const reporte = {
      protocolo,
      itemDesc: problemaModal?.itemDesc || '',
      checklistId: problema.checklistId,
      descricao: problema.descricao,
      status: problema.status,
      prioridade: problema.prioridade,
      imagens: problema.imagens,
      data: new Date().toISOString(),
    };
    try {
      await reportesApi.create(reporte);
    } catch { /* ignore */ }
    alert('Problema reportado com sucesso! Protocolo: ' + protocolo);
    setProblemaModal(null);
  };

  const abrirProblema = (ckId: string, itemId: string, itemDesc: string) => {
    setProblema({ itemId, checklistId: ckId, descricao: '', status: 'aberto', prioridade: 'media', imagens: [] });
    setProtocolo(gerarProtocolo());
    setProblemaModal({ ckId, itemId, itemDesc });
  };

  const abrirAntesDepois = (ckId: string, itemId: string, itemDesc: string) => {
    setAntesDepois({ itemId, checklistId: ckId, fotoAntes: null, descAntes: '', fotoDepois: null, descDepois: '' });
    setAntesDepoisModal({ ckId, itemId, itemDesc });
  };

  const handleImagemProblema = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const erro = validarImagem(file);
      if (erro) { alert(erro); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setProblema(prev => ({ ...prev, imagens: [...prev.imagens, ev.target!.result as string] }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removerImagemProblema = (idx: number) => {
    setProblema(prev => ({ ...prev, imagens: prev.imagens.filter((_, i) => i !== idx) }));
  };

  const handleFoto = (tipo: 'antes' | 'depois', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const erro = validarImagem(file);
    if (erro) { alert(erro); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        if (tipo === 'antes') {
          setAntesDepois(prev => ({ ...prev, fotoAntes: ev.target!.result as string }));
        } else {
          setAntesDepois(prev => ({ ...prev, fotoDepois: ev.target!.result as string }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filtered = checklists.filter(c => {
    if (filtro !== 'todos' && c.status !== filtro) return false;
    if (busca.trim()) {
      const termos = busca.toLowerCase().split(/\s+/);
      const texto = `${c.local} ${c.tipo} ${c.id} ${c.itens.map(i => i.descricao).join(' ')}`.toLowerCase();
      return termos.every(t => texto.includes(t));
    }
    return true;
  });

  const pag = usePagination(filtered, { pageSize: 15 });

  if (loading) return <LoadingSpinner texto="Carregando checklists..." />;

  return (
    <div id="checklists-content">
      <HowItWorks
        titulo="Checklist de Manutenção"
        descricao="Crie e gerencie checklist para controle de qualidade da limpeza em cada área do condomínio."
        passos={[
          'Crie um novo checklist definindo o local e tipo (diário, semanal, mensal)',
          'Adicione os itens a serem verificados',
          'Atribua o responsável pelo checklist',
          'O funcionário marca cada item conforme vai concluindo',
          'Clique no ícone de ações para reportar problemas ou registrar fotos antes/depois',
          'Ao concluir, o checklist fica registrado no histórico',
        ]}
      />

      <PageHeader
        titulo="Checklist de Manutenção"
        subtitulo={aba === 'realizados' ? `${checklists.length} realizados` : `${modelos.length} modelos salvos`}
        onCompartilhar={() => compartilharConteudo('Checklists', 'Listagem de checklists')}
        onImprimir={() => imprimirElemento('checklists-content')}
        onGerarPdf={() => gerarPdfDeElemento('checklists-content', 'checklists')}
        acoes={
          <button className={styles.addBtn} onClick={() => setShowNovoModal(true)}>
            <Plus size={18} /> <span>Novo Checklist</span>
          </button>
        }
      />

      {/* Tabs Realizados / Modelos */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
        <button
          onClick={() => setAba('realizados')}
          style={{
            padding: '10px 18px', border: 0, background: 'transparent',
            borderBottom: aba === 'realizados' ? '3px solid #2563eb' : '3px solid transparent',
            color: aba === 'realizados' ? '#2563eb' : '#6b7280',
            fontWeight: 600, cursor: 'pointer', marginBottom: -2,
          }}
        >
          Checklists realizados ({checklists.length})
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAba('modelos')}
            style={{
              padding: '10px 18px', border: 0, background: 'transparent',
              borderBottom: aba === 'modelos' ? '3px solid #2563eb' : '3px solid transparent',
              color: aba === 'modelos' ? '#2563eb' : '#6b7280',
              fontWeight: 600, cursor: 'pointer', marginBottom: -2,
            }}
          >
            Modelos salvos ({modelos.length})
          </button>
          <Coachmark
            id="checklist-modelos-intro"
            posicao="abaixo"
            alinhamento="centro"
            largura={300}
            mensagem={
              <span>
                <strong>Modelos reutilizáveis.</strong> Salve um checklist como modelo
                marcando a opção <em>"Salvar como modelo"</em> ao criar. Depois é só clicar
                em <strong>Usar modelo</strong> que ele vira uma execução nova com a data de hoje.
                <br /><br />
                <strong>Sem condomínio fixo:</strong> se o modelo for criado sem vincular
                a um condomínio específico, ele fica disponível para todos os condomínios
                que você administra — útil para checklists genéricos (limpeza padrão,
                vistoria semanal, etc.).
              </span>
            }
          />
        </div>
      </div>

      {aba === 'modelos' && (
        <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
          {modelos.length === 0 && (
            <Card padding="md"><p style={{ margin: 0, color: '#6b7280' }}>
              Nenhum modelo salvo ainda. Ao criar um novo checklist, marque a opção <strong>"Salvar como modelo reutilizável"</strong>.
            </p></Card>
          )}
          {modelos.map((m: any) => (
            <Card key={m.id} padding="md">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <strong style={{ fontSize: 15 }}>{m.nome}</strong>
                  <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                    {m.tipo} · {m.condominio_nome || 'Sem condomínio fixo'} · {(m.itens?.length || 0)} {m.itens?.length === 1 ? 'item' : 'itens'}
                    {m.vezes_usado > 0 && ` · usado ${m.vezes_usado}x`}
                  </div>
                  {m.local && <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>Local: {m.local}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => usarModelo(m.id)}
                    style={{ padding: '8px 14px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={14} /> Usar modelo
                  </button>
                  <button
                    onClick={() => excluirModelo(m.id, m.nome)}
                    style={{ padding: '8px 10px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer' }}
                    title="Excluir modelo"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {aba === 'realizados' && (
      <>
      <div className={styles.buscaArea}>
        <Search size={18} className={styles.buscaIcon} />
        <input
          type="text"
          className={styles.buscaInput}
          placeholder="Buscar checklist por local, tipo, item..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
        {busca && (
          <button className={styles.buscaLimpar} onClick={() => setBusca('')}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className={styles.filters}>
        {(['todos', 'pendente', 'em_andamento', 'concluido'] as const).map(f => {
          const baseClass = f === 'todos' ? styles.tabTodos : f === 'pendente' ? styles.tabPendente : f === 'em_andamento' ? styles.tabAndamento : styles.tabConcluido;
          const activeClass = f === 'todos' ? styles.tabTodosActive : f === 'pendente' ? styles.tabPendenteActive : f === 'em_andamento' ? styles.tabAndamentoActive : styles.tabConcluidoActive;
          return (
            <button
              key={f}
              className={`${styles.filterTab} ${baseClass} ${filtro === f ? activeClass : ''}`}
              onClick={() => setFiltro(f)}
            >
              {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pendentes' : f === 'em_andamento' ? 'Em Andamento' : 'Concluídos'}
            </button>
          );
        })}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={48} strokeWidth={1.5} />}
            titulo="Nenhum checklist encontrado"
            descricao="Crie um checklist para começar a acompanhar a limpeza."
          />
        ) : pag.items.map(ck => {
          const concluidos = ck.itens.filter(i => i.concluido).length;
          const total = ck.itens.length;
          const pct = total > 0 ? Math.round((concluidos / total) * 100) : 0;
          return (
            <Card key={ck.id} hover padding="md">
              <div className={styles.ckCard}>
                <div className={styles.ckTop}>
                  <div className={styles.ckId}>{ck.id}</div>
                  <StatusBadge
                    texto={ck.status === 'concluido' ? 'Concluído' : ck.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                    variante={ck.status === 'concluido' ? 'sucesso' : ck.status === 'em_andamento' ? 'aviso' : 'neutro'}
                  />
                </div>
                <h4 className={styles.ckLocal}>{ck.local}</h4>
                <span className={styles.ckTipo}>{ck.tipo.charAt(0).toUpperCase() + ck.tipo.slice(1)}</span>

                <div className={styles.progress}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.progressText}>{concluidos}/{total} ({pct}%)</span>
                </div>

                <div className={styles.itemsList}>
                  {ck.itens.map(item => (
                    <div key={item.id} className={`${styles.item} ${item.concluido ? styles.itemDone : ''}`}>
                      <div className={styles.itemCheck}>
                        {item.concluido ? <CheckCircle2 size={16} color="#2e7d32" /> : <div className={styles.unchecked} />}
                      </div>
                      <span className={styles.itemText}>{item.descricao}</span>
                      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                        <button
                          className={styles.itemAction}
                          onClick={() => abrirProblema(ck.id, item.id, item.descricao)}
                          title="Reportar um problema"
                          style={{ background: '#fff3e0', color: '#e65100', borderRadius: 8, padding: 6, border: 0, cursor: 'pointer', display: 'inline-flex' }}
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button
                          className={styles.itemAction}
                          onClick={() => abrirAntesDepois(ck.id, item.id, item.descricao)}
                          title="Antes e Depois"
                          style={{ background: '#e8f5e9', color: '#2e7d32', borderRadius: 8, padding: 6, border: 0, cursor: 'pointer', display: 'inline-flex' }}
                        >
                          <Camera size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Pagination page={pag.page} totalPages={pag.totalPages} totalItems={pag.totalItems} pageSize={pag.pageSize} onPageChange={pag.goToPage} hasNext={pag.hasNext} hasPrev={pag.hasPrev} />

      <div style={{ marginTop: '1cm' }}>
        <Card padding="md">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--cor-texto)', margin: '0 0 20px' }}>Status dos Checklists</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={[
                { nome: 'Concluídos', valor: checklists.filter(c => c.status === 'concluido').length || 0 },
                { nome: 'Em Andamento', valor: checklists.filter(c => c.status === 'em_andamento').length || 0 },
                { nome: 'Pendentes', valor: checklists.filter(c => c.status === 'pendente').length || 0 },
              ]} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="valor" nameKey="nome" label>
                {[0, 1, 2].map(i => <Cell key={i} fill={CORES[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      </>
      )}

      {/* ===== MODAL REPORTAR PROBLEMA ===== */}
      <Modal aberto={!!problemaModal} onFechar={() => setProblemaModal(null)} titulo="Reportar Problema" largura="md">
        <div className={styles.problemaForm}>
          <div className={styles.protocoloHeader}>
            <div className={styles.protocoloTag}>
              <Hash size={14} />
              <span>{protocolo}</span>
            </div>
          </div>
          <p className={styles.modalItemDesc}>Item: <strong>{problemaModal?.itemDesc}</strong></p>

          <label className={styles.formLabel}>Imagens</label>
          <div className={styles.imagensArea}>
            {problema.imagens.map((img, i) => (
              <div key={i} className={styles.imagemThumb}>
                <img src={img} alt={`Imagem ${i + 1}`} />
                <button className={styles.imagemRemover} onClick={() => removerImagemProblema(i)}>
                  <X size={14} />
                </button>
              </div>
            ))}
            <button className={styles.imagemAdd} onClick={() => problemaInputRef.current?.click()}>
              <Upload size={20} />
              <span>Adicionar</span>
            </button>
            <input ref={problemaInputRef} type="file" accept="image/*" multiple hidden onChange={handleImagemProblema} />
          </div>

          <label className={styles.formLabel}>Descrição do Problema</label>
          <textarea
            className={styles.formTextarea}
            placeholder="Descreva o problema encontrado..."
            value={problema.descricao}
            onChange={e => setProblema(prev => ({ ...prev, descricao: e.target.value }))}
            rows={4}
          />

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <select className={styles.formSelect} value={problema.status} onChange={e => setProblema(prev => ({ ...prev, status: e.target.value }))}>
                <option value="aberto">Aberto</option>
                <option value="em_analise">Em Análise</option>
                <option value="resolvido">Resolvido</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Prioridade</label>
              <select className={styles.formSelect} value={problema.prioridade} onChange={e => setProblema(prev => ({ ...prev, prioridade: e.target.value }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <button className={styles.formSubmit} onClick={enviarReporte}>
            <AlertTriangle size={16} /> Enviar Reporte
          </button>

          <div className={styles.whatsSection}>
            <div className={styles.whatsHeader}>
              <button
                className={styles.whatsBtn}
                onClick={() => {
                  const contato = contatosWhats.find(c => c.id === contatoSelecionado);
                  if (!contato) { setShowWhatsConfig(true); return; }
                  const num = contato.telefone.replace(/\D/g, '');
                  const texto = encodeURIComponent(`*Problema Reportado*\n*Protocolo:* ${protocolo}\n\n*Item:* ${problemaModal?.itemDesc}\n*Descrição:* ${problema.descricao || 'N/A'}\n*Status:* ${problema.status}\n*Prioridade:* ${problema.prioridade}\n*Enviado para:* ${contato.nome}`);
                  window.open(`https://wa.me/55${num}?text=${texto}`, '_blank');
                }}
              >
                <MessageCircle size={18} /> Enviar para WhatsApp
              </button>
              <button
                className={`${styles.whatsConfigBtn} ${showWhatsConfig ? styles.whatsConfigBtnActive : ''}`}
                onClick={() => setShowWhatsConfig(prev => !prev)}
                title="Configurar Contatos"
              >
                <Settings size={18} />
              </button>
            </div>

            {/* Dropdown de contatos salvos */}
            {contatosWhats.length > 0 && (
              <div className={styles.whatsContatoSelect}>
                <label className={styles.formLabel}>Enviar para:</label>
                <select
                  className={styles.formSelect}
                  value={contatoSelecionado}
                  onChange={e => setContatoSelecionado(e.target.value)}
                >
                  {contatosWhats.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} — {c.telefone}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Painel de config para adicionar/remover contatos */}
            {showWhatsConfig && (
              <div className={styles.whatsConfigPanel}>
                <h5 className={styles.whatsConfigTitle}>Adicionar Contato</h5>
                <div className={styles.whatsConfigFields}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Nome</label>
                    <input
                      className={styles.formInput}
                      placeholder="Nome do contato"
                      value={whatsNome}
                      onChange={e => setWhatsNome(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>WhatsApp</label>
                    <input
                      className={styles.formInput}
                      placeholder="(00) 00000-0000"
                      value={whatsTelefone}
                      maxLength={15}
                      onChange={e => setWhatsTelefone(formatarTelefone(e.target.value))}
                    />
                  </div>
                  <button className={styles.whatsSaveBtn} onClick={salvarNovoContato}>
                    <Save size={15} /> Salvar
                  </button>
                </div>

                {/* Lista de contatos salvos */}
                {contatosWhats.length > 0 && (
                  <div className={styles.whatsContatosList}>
                    <h5 className={styles.whatsConfigTitle}>Contatos Salvos</h5>
                    {contatosWhats.map((c, i) => (
                      <div key={c.id} className={styles.whatsContatoItem}>
                        <div className={styles.whatsContatoInfo}>
                          <strong>{c.nome}</strong>
                          <span>{c.telefone}</span>
                          {i === 0 && <span className={styles.whatsContatoBadge}>Padrão</span>}
                        </div>
                        <button className={styles.whatsContatoRemover} onClick={() => removerContato(c.id)} title="Remover">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ===== MODAL ANTES E DEPOIS ===== */}
      <Modal aberto={!!antesDepoisModal} onFechar={() => setAntesDepoisModal(null)} titulo="Ante e Depois" largura="lg">
        <div className={styles.antesDepoisForm}>
          <p className={styles.modalItemDesc}>Item: <strong>{antesDepoisModal?.itemDesc}</strong></p>

          <div className={styles.antesDepoisGrid}>
            {/* ANTES */}
            <div className={styles.adColuna}>
              <h4 className={styles.adTitulo}>
                <span className={styles.adBadgeAntes}>ANTES</span>
              </h4>
              {antesDepois.fotoAntes ? (
                <div className={styles.adFotoContainer}>
                  <img src={antesDepois.fotoAntes} alt="Antes" className={styles.adFoto} />
                  <button className={styles.adFotoRemover} onClick={() => setAntesDepois(prev => ({ ...prev, fotoAntes: null }))}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className={styles.adUploadArea} onClick={() => antesInputRef.current?.click()}>
                  <Camera size={32} />
                  <span>Tirar / Selecionar Foto</span>
                </button>
              )}
              <input ref={antesInputRef} type="file" accept="image/*" hidden onChange={e => handleFoto('antes', e)} />
              <textarea
                className={styles.formTextarea}
                placeholder="Descrição do estado antes..."
                value={antesDepois.descAntes}
                onChange={e => setAntesDepois(prev => ({ ...prev, descAntes: e.target.value }))}
                rows={3}
              />
            </div>

            {/* DEPOIS */}
            <div className={styles.adColuna}>
              <h4 className={styles.adTitulo}>
                <span className={styles.adBadgeDepois}>DEPOIS</span>
              </h4>
              {antesDepois.fotoDepois ? (
                <div className={styles.adFotoContainer}>
                  <img src={antesDepois.fotoDepois} alt="Depois" className={styles.adFoto} />
                  <button className={styles.adFotoRemover} onClick={() => setAntesDepois(prev => ({ ...prev, fotoDepois: null }))}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button className={styles.adUploadArea} onClick={() => depoisInputRef.current?.click()}>
                  <Camera size={32} />
                  <span>Tirar / Selecionar Foto</span>
                </button>
              )}
              <input ref={depoisInputRef} type="file" accept="image/*" hidden onChange={e => handleFoto('depois', e)} />
              <textarea
                className={styles.formTextarea}
                placeholder="Descrição do estado depois..."
                value={antesDepois.descDepois}
                onChange={e => setAntesDepois(prev => ({ ...prev, descDepois: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          {/* Preview lado a lado quando ambas fotos existem */}
          {antesDepois.fotoAntes && antesDepois.fotoDepois && (
            <div className={styles.adComparacao}>
              <h4 className={styles.adCompTitulo}>Comparação</h4>
              <div className={styles.adCompGrid}>
                <div className={styles.adCompItem}>
                  <span className={styles.adBadgeAntes}>ANTES</span>
                  <img src={antesDepois.fotoAntes} alt="Antes" />
                  <p>{antesDepois.descAntes || 'Sem descrição'}</p>
                </div>
                <div className={styles.adCompItem}>
                  <span className={styles.adBadgeDepois}>DEPOIS</span>
                  <img src={antesDepois.fotoDepois} alt="Depois" />
                  <p>{antesDepois.descDepois || 'Sem descrição'}</p>
                </div>
              </div>
            </div>
          )}

          <button className={styles.formSubmit} onClick={() => { alert('Registro salvo com sucesso!'); setAntesDepoisModal(null); }}>
            <Camera size={16} /> Salvar Registro
          </button>
        </div>
      </Modal>

      {/* Modal Novo Checklist */}
      <Modal aberto={showNovoModal} onFechar={() => setShowNovoModal(false)} titulo="Novo Checklist" largura="md">
        <div className={styles.novoForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Local</label>
              <input className={styles.formInput} placeholder="Ex: Hall de Entrada - Bloco A" value={novoLocal} onChange={e => setNovoLocal(e.target.value)} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo</label>
              <select className={styles.formSelect} value={novoTipo} onChange={e => setNovoTipo(e.target.value as any)}>
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
                <option value="especial">Especial</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Condomínio</label>
              <select className={styles.formSelect} value={novoCond} onChange={e => setNovoCond(e.target.value)}>
                <option value="">Selecione um condomínio...</option>
                {condosOpcoes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {condosOpcoes.length === 0 && (
                <small style={{ color: '#dc2626', marginTop: 4, display: 'block' }}>
                  Nenhum condomínio cadastrado. Vá em "Cadastro de Condomínios" e crie um antes.
                </small>
              )}
            </div>
          </div>
          {erroNovo && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, margin: '8px 0' }}>
              {erroNovo}
            </div>
          )}

          <label className={styles.formLabel}>Itens do Checklist</label>
          <div className={styles.itensLista}>
            {novosItens.map((item, idx) => (
              <div key={idx} className={styles.itemRow}>
                <input
                  className={styles.formInput}
                  placeholder={`Item ${idx + 1}`}
                  value={item}
                  onChange={e => atualizarItem(idx, e.target.value)}
                />
                {novosItens.length > 1 && (
                  <button className={styles.itemRemoveBtn} onClick={() => removerItem(idx)}>
                    <Minus size={16} />
                  </button>
                )}
              </div>
            ))}
            <button className={styles.itemAddBtn} onClick={adicionarItem}>
              <Plus size={16} /> Adicionar Item
            </button>
          </div>

          <div style={{ marginTop: 14, padding: 12, background: '#f3f4f6', borderRadius: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={salvarComoModelo}
                onChange={e => setSalvarComoModelo(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              Salvar também como modelo reutilizável
            </label>
            <small style={{ display: 'block', color: '#6b7280', marginTop: 4, marginLeft: 24 }}>
              O modelo fica em "Modelos salvos" e pode ser usado quantas vezes precisar em outros dias ou condomínios.
            </small>
            {salvarComoModelo && (
              <input
                type="text"
                value={novoNomeModelo}
                onChange={e => setNovoNomeModelo(e.target.value)}
                placeholder="Nome do modelo (opcional — usa o local se vazio)"
                style={{ marginTop: 10, marginLeft: 24, width: 'calc(100% - 24px)', padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
              />
            )}
          </div>

          <button className={styles.formSubmit} onClick={criarChecklist}>
            <Plus size={18} /> Criar Checklist
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ChecklistsPage;
