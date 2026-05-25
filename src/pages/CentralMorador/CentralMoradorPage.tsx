import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { central } from '../../services/api';
import styles from './CentralMoradorPage.module.css';

const CATEGORIAS = [
  { id: 'manutencao', icon: '🛠️', label: 'Problema de Manutenção' },
  { id: 'ocorrencia', icon: '⚠️', label: 'Reclamação / Ocorrência' },
  { id: 'sindico', icon: '👤', label: 'Falar com o Síndico' },
  { id: 'administradora', icon: '🏢', label: 'Falar com a Administradora' },
  { id: 'emergencia', icon: '🚨', label: 'Emergência' },
  { id: 'sugestao', icon: '💡', label: 'Sugestão / Elogio' },
  { id: 'achados', icon: '🔑', label: 'Achados e Perdidos' },
  { id: 'outro', icon: '➕', label: 'Outras solicitações' },
];

const CentralMoradorPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [condo, setCondo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [catSelecionada, setCatSelecionada] = useState<typeof CATEGORIAS[0] | null>(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [nome, setNome] = useState('');
  const [bloco, setBloco] = useState('');
  const [apto, setApto] = useState('');
  const [canal, setCanal] = useState<'whatsapp'|'email'|'ambos'>('ambos');
  const [mostraDetalhes, setMostraDetalhes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState<{ protocolo: string; token: string } | null>(null);

  useEffect(() => {
    central.condominio(slug || '').then(setCondo).catch(() => setCondo(null)).finally(() => setLoading(false));
  }, [slug]);

  const enviar = async () => {
    if (!whatsapp.trim() || !descricao.trim()) { alert('WhatsApp e descrição são obrigatórios'); return; }
    setEnviando(true);
    try {
      const r = await central.criarSolicitacao(slug!, {
        categoria: catSelecionada?.id,
        descricao: `[${catSelecionada?.label}] ${descricao}`,
        nome, bloco, apto, whatsapp, email, canal,
      });
      setSucesso({ protocolo: r.protocolo, token: r.token });
    } catch (e: any) { alert(e.message); }
    finally { setEnviando(false); }
  };

  if (loading) return <div className={styles.page}>Carregando...</div>;
  if (!condo) return <div className={styles.page}><div className={styles.container}>Condomínio não encontrado.</div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>👋 Olá! Como podemos ajudar?</h1>
          <p>{condo.nome}</p>
        </div>

        <div className={styles.grid}>
          {CATEGORIAS.map(c => (
            <button key={c.id} className={styles.card} onClick={() => { setCatSelecionada(c); setSucesso(null); }}>
              <div className={styles.cardIcon}>{c.icon}</div>
              <div className={styles.cardLabel}>{c.label}</div>
            </button>
          ))}
        </div>

        {catSelecionada && (
          <div className={styles.modalBg} onClick={() => { if (!sucesso) setCatSelecionada(null); }}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              {sucesso ? (
                <div className={styles.success}>
                  <div style={{ fontSize: 50 }}>✅</div>
                  <div className={styles.successTitle}>Solicitação enviada!</div>
                  <div style={{ color: '#64748b' }}>Seu número de protocolo:</div>
                  <div className={styles.successProto}>{sucesso.protocolo}</div>
                  <p style={{ color: '#475569', fontSize: 14 }}>
                    Guarde este link para acompanhar a resposta do síndico:
                  </p>
                  <a className={styles.successLink} href={`/c/${sucesso.token}`}>
                    {window.location.origin}/c/{sucesso.token}
                  </a>
                  <div className={styles.actions}>
                    <a href={`/c/${sucesso.token}`} className={styles.btnPrimary} style={{ textDecoration: 'none' }}>Acompanhar</a>
                  </div>
                </div>
              ) : (
                <>
                  <h3>{catSelecionada.icon} {catSelecionada.label}</h3>

                  <div className={styles.field}>
                    <label>📱 WhatsApp (obrigatório)</label>
                    <input type="tel" placeholder="(11) 99999-0000" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
                  </div>

                  <div className={styles.field}>
                    <label>📝 Conte o que aconteceu</label>
                    <textarea placeholder="Descreva sua solicitação..." value={descricao} onChange={e => setDescricao(e.target.value)} />
                  </div>

                  <div className={styles.field}>
                    <label>Como prefere receber a resposta?</label>
                    <div className={styles.radios}>
                      <label><input type="radio" checked={canal === 'ambos'} onChange={() => setCanal('ambos')} /> Ambos</label>
                      <label><input type="radio" checked={canal === 'whatsapp'} onChange={() => setCanal('whatsapp')} /> WhatsApp</label>
                      <label><input type="radio" checked={canal === 'email'} onChange={() => setCanal('email')} /> E-mail</label>
                    </div>
                  </div>

                  <button className={styles.detalhesTog} onClick={() => setMostraDetalhes(v => !v)}>
                    {mostraDetalhes ? '− Esconder' : '+ Adicionar mais detalhes (opcional)'}
                  </button>

                  {mostraDetalhes && (
                    <>
                      <div className={styles.field}>
                        <label>Seu nome</label>
                        <input type="text" value={nome} onChange={e => setNome(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className={styles.field}>
                          <label>Bloco</label>
                          <input type="text" value={bloco} onChange={e => setBloco(e.target.value)} />
                        </div>
                        <div className={styles.field}>
                          <label>Apto</label>
                          <input type="text" value={apto} onChange={e => setApto(e.target.value)} />
                        </div>
                      </div>
                      {(canal === 'email' || canal === 'ambos') && (
                        <div className={styles.field}>
                          <label>E-mail</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                      )}
                    </>
                  )}

                  <div className={styles.actions}>
                    <button className={styles.btnSecondary} onClick={() => setCatSelecionada(null)}>Cancelar</button>
                    <button className={styles.btnPrimary} onClick={enviar} disabled={enviando}>
                      {enviando ? 'Enviando...' : 'Enviar solicitação'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CentralMoradorPage;
