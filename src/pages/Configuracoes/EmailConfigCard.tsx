import React, { useEffect, useState } from 'react';
import Card from '../../components/Common/Card';
import { Mail, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Provider = 'resend' | 'gmail' | 'disabled';

interface UsageStat { date: string; sent: number; failed: number; limit: number; }
interface EmailConfigDTO {
  provider: Provider;
  fromName: string;
  fromAddress: string;
  resendApiKeyMask: string;
  resendConfigured: boolean;
  gmailUser: string;
  gmailConfigured: boolean;
  usage: { resend: UsageStat; gmail: UsageStat };
}

const API = (import.meta.env.VITE_API_URL || '/api') as string;

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('manutencao_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EmailConfigCard: React.FC = () => {
  const [cfg, setCfg] = useState<EmailConfigDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');

  const [provider, setProvider] = useState<Provider>('disabled');
  const [fromName, setFromName] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');

  const carregar = async () => {
    try {
      const res = await fetch(`${API}/configuracoes/email`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data: EmailConfigDTO = await res.json();
      setCfg(data);
      setProvider(data.provider);
      setFromName(data.fromName);
      setFromAddress(data.fromAddress);
      setGmailUser(data.gmailUser);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    setSalvando(true); setErro(''); setMsg('');
    try {
      const body: any = { provider, fromName, fromAddress, gmailUser };
      if (resendApiKey) body.resendApiKey = resendApiKey;
      if (gmailAppPassword) body.gmailAppPassword = gmailAppPassword;
      const res = await fetch(`${API}/configuracoes/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || `Erro ${res.status}`);
      setMsg('Configuração salva.');
      setResendApiKey(''); setGmailAppPassword('');
      carregar();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const testar = async () => {
    setErro(''); setMsg('Enviando teste...');
    try {
      const res = await fetch(`${API}/configuracoes/email/teste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Falha');
      setMsg(`Teste enviado para ${data.to}.`);
      carregar();
    } catch (e: any) {
      setErro(e.message);
    }
  };

  if (carregando) return <Card padding="md"><p>Carregando configuração de e-mail...</p></Card>;
  if (!cfg) return null;

  const u = cfg.usage;
  const pct = (s: UsageStat) => Math.min(100, Math.round((s.sent / s.limit) * 100));

  return (
    <Card padding="md">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Mail size={22} color="#2563eb" />
        <div>
          <h3 style={{ margin: 0 }}>Configuração de E-mail</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            Escolha o provedor usado para envio (reset de senha, alertas, OS, etc.).
          </p>
        </div>
      </div>

      {erro && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginBottom: 12 }}>{erro}</div>}
      {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: 10, borderRadius: 8, marginBottom: 12 }}>{msg}</div>}

      <div style={{ display: 'grid', gap: 14 }}>
        <label style={{ display: 'block' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Provedor ativo</span>
          <select
            value={provider}
            onChange={e => setProvider(e.target.value as Provider)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', marginTop: 4 }}
          >
            <option value="disabled">Desativado (logs no servidor)</option>
            <option value="resend">Resend — free 100/dia</option>
            <option value="gmail">Gmail SMTP — 500/dia</option>
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Nome do remetente</span>
            <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="App Síndico"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', marginTop: 4 }} />
          </label>
          <label>
            <span style={{ fontSize: 13, fontWeight: 600 }}>E-mail do remetente</span>
            <input value={fromAddress} onChange={e => setFromAddress(e.target.value)} placeholder="noreply@appsindico.com.br"
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', marginTop: 4 }} />
          </label>
        </div>

        {/* Resend */}
        <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
          <legend style={{ fontWeight: 700, padding: '0 6px' }}>Resend {cfg.resendConfigured && <CheckCircle2 size={14} color="#16a34a" />}</legend>
          <label>
            <span style={{ fontSize: 13 }}>API key</span>
            <input
              type="password"
              value={resendApiKey}
              onChange={e => setResendApiKey(e.target.value)}
              placeholder={cfg.resendApiKeyMask || 're_xxxxxxxxxxxx'}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', marginTop: 4 }}
            />
            <small style={{ color: '#6b7280' }}>
              {cfg.resendConfigured ? `Chave atual: ${cfg.resendApiKeyMask} — deixe em branco para manter.` : 'Cole sua API key da Resend.'}
            </small>
          </label>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <strong>Hoje:</strong> {u.resend.sent}/{u.resend.limit} enviados
            {u.resend.failed > 0 && <span style={{ color: '#dc2626' }}> • {u.resend.failed} falhas</span>}
            <div style={{ background: '#e5e7eb', height: 6, borderRadius: 4, marginTop: 4 }}>
              <div style={{ background: pct(u.resend) >= 90 ? '#dc2626' : '#2563eb', width: `${pct(u.resend)}%`, height: '100%', borderRadius: 4 }} />
            </div>
            {pct(u.resend) >= 90 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#b45309', marginTop: 6 }}>
                <AlertTriangle size={14} /> Próximo do limite — troque para Gmail no dropdown acima.
              </div>
            )}
          </div>
        </fieldset>

        {/* Gmail */}
        <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
          <legend style={{ fontWeight: 700, padding: '0 6px' }}>Gmail SMTP {cfg.gmailConfigured && <CheckCircle2 size={14} color="#16a34a" />}</legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label>
              <span style={{ fontSize: 13 }}>Usuário (e-mail Gmail)</span>
              <input value={gmailUser} onChange={e => setGmailUser(e.target.value)} placeholder="seuemail@gmail.com"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', marginTop: 4 }} />
            </label>
            <label>
              <span style={{ fontSize: 13 }}>App Password (16 chars)</span>
              <input type="password" value={gmailAppPassword} onChange={e => setGmailAppPassword(e.target.value)}
                placeholder={cfg.gmailConfigured ? '•••• •••• •••• ••••' : 'xxxx xxxx xxxx xxxx'}
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', marginTop: 4 }} />
            </label>
          </div>
          <small style={{ color: '#6b7280', display: 'block', marginTop: 6 }}>
            Crie em myaccount.google.com → Segurança → Senhas de app (precisa de 2FA ativado).
          </small>
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <strong>Hoje:</strong> {u.gmail.sent}/{u.gmail.limit} enviados
            {u.gmail.failed > 0 && <span style={{ color: '#dc2626' }}> • {u.gmail.failed} falhas</span>}
            <div style={{ background: '#e5e7eb', height: 6, borderRadius: 4, marginTop: 4 }}>
              <div style={{ background: pct(u.gmail) >= 90 ? '#dc2626' : '#2563eb', width: `${pct(u.gmail)}%`, height: '100%', borderRadius: 4 }} />
            </div>
          </div>
        </fieldset>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={salvar} disabled={salvando}
            style={{ padding: '10px 18px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={testar} disabled={provider === 'disabled'}
            style={{ padding: '10px 18px', background: '#16a34a', color: '#fff', border: 0, borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Send size={16} /> Enviar teste para o meu e-mail
          </button>
        </div>
      </div>
    </Card>
  );
};

export default EmailConfigCard;
