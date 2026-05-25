import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Eye, EyeOff, Mail, Lock, MessageCircle, UserPlus } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import styles from './Auth.module.css';

const REMEMBER_KEY = 'app_sindico_remember';

const LoginPage: React.FC = () => {
  const lembrado = (() => {
    try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null'); } catch { return null; }
  })();
  const [email, setEmail] = useState(lembrado?.email || '');
  const [senha, setSenha] = useState(lembrado?.senha || '');
  const [lembrar, setLembrar] = useState(!!lembrado);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const { login } = useAuth();
  const { tema } = useTheme();
  const navigate = useNavigate();

  const logoExibida = tema.logoUrl;
  const tituloExibido = tema.loginTitulo || 'App Síndico';
  const subtituloExibido = tema.loginSubtitulo || 'Faça login para acessar o sistema';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      await login(email, senha);
      if (lembrar) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, senha }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Erro ao fazer login.';
      if (msg.includes('bloqueada') || msg.includes('bloqueado') || msg.includes('desativada') || msg.includes('Desativada')) {
        setErro(msg);
      } else if (msg.includes('inválid') || msg.includes('invalid') || msg.includes('Credenciais') || msg.includes('incorret')) {
        setErro('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (msg.includes('tentativas') || msg.includes('requests') || msg.includes('429') || msg.includes('Muitas')) {
        setErro('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else if (msg.includes('expirada')) {
        setErro('Sua sessão expirou. Faça login novamente.');
      } else if (msg.includes('Sem conexão') || msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('internet')) {
        setErro('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      } else if (msg.includes('demorou') || msg.includes('timeout') || msg.includes('Timeout') || msg.includes('AbortError')) {
        setErro('O servidor demorou para responder. Tente novamente.');
      } else if (msg.includes('indisponível') || msg.includes('500') || msg.includes('503')) {
        setErro('Servidor temporariamente indisponível. Tente novamente em instantes.');
      } else if (msg.includes('negado') || msg.includes('403')) {
        setErro(msg);
      } else {
        setErro('Não foi possível conectar. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const abrirSuporte = () => {
    window.open('https://wa.me/5511933284364?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20App%20S%C3%ADndico', '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          <div className={styles.illustration}>
            <img src={logoImg} alt="App Síndico" className={styles.illustrationLogo} />
          </div>
          <h2>App Síndico</h2>
          <p>Plataforma completa de gestão condominial com 30+ módulos. Manutenção, comunicação, moradores e muito mais.</p>
          <div className={styles.features}>
            <div className={styles.feature}>✓ 30+ Módulos Integrados</div>
            <div className={styles.feature}>✓ Revista Digital Interativa</div>
            <div className={styles.feature}>✓ Portal do Morador</div>
            <div className={styles.feature}>✓ Relatórios e Dashboards</div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <img src={logoExibida || logoImg} alt="Logo" className={logoExibida ? styles.formLogo : styles.formLogoDefault} />
            <h1>{tema.loginTitulo || 'App Síndico'}</h1>
            <p>{subtituloExibido}</p>
          </div>

          {erro && (
            <div className={styles.erro}>{erro}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>E-mail</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Senha</label>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                >
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.forgotRow} style={{ justifyContent: 'flex-start' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={e => setLembrar(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                Lembrar e-mail e senha
              </label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={carregando}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <div className={styles.forgotRow}>
              <Link to="/esqueci-senha" className={styles.forgotLink}>Esqueceu sua senha?</Link>
            </div>
          </form>

          <div className={styles.registerRow}>
            <span>Não tem uma conta?</span>{' '}
            <Link to="/cadastro" className={styles.registerLink}>Criar conta</Link>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, textAlign: 'center' }}>
              Acessos personalizados
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { label: 'Portal do Síndico', to: '/login' },
                { label: 'Portal da Administradora', to: '/login' },
                { label: 'Portal do Funcionário', to: '/login' },
              ].map(c => (
                <Link
                  key={c.label}
                  to={c.to}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '12px 10px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #3b4cca, #2d3aa0)',
                    color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13, lineHeight: 1.15,
                    textAlign: 'center', boxShadow: '0 4px 12px rgba(45,58,160,0.25)',
                  }}
                >
                  ✓ {c.label}
                </Link>
              ))}
            </div>
          </div>

          <button className={styles.supportBtn} onClick={abrirSuporte}>
            <MessageCircle size={18} />
            <span>Suporte</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
