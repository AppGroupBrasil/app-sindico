import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Building2, Building, ArrowLeft, Check } from 'lucide-react';
import { auth as authApi } from '../../services/api';
import logoImg from '../../assets/logo.png';

type Perfil = null | 'sindico' | 'administradora';

const CadastroPage: React.FC = () => {
  const [perfil, setPerfil] = useState<Perfil>(null);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
    // Síndico
    nomeCondominio: '',
    enderecoCondominio: '',
    // Administradora
    nomeEmpresa: '',
    cnpj: '',
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!form.nome.trim() || !form.email || !form.senha) {
      setErro('Preencha todos os campos obrigatórios.');
      return;
    }
    if (form.senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    if (perfil === 'sindico' && !form.nomeCondominio.trim()) {
      setErro('Informe o nome do condomínio.');
      return;
    }
    if (perfil === 'administradora' && !form.nomeEmpresa.trim()) {
      setErro('Informe o nome da empresa.');
      return;
    }

    setCarregando(true);
    try {
      const payload: any = {
        email: form.email,
        senha: form.senha,
        nome: form.nome.trim(),
        telefone: form.telefone.trim() || undefined,
        perfil,
        ...(perfil === 'sindico' && {
          nomeCondominio: form.nomeCondominio.trim(),
          enderecoCondominio: form.enderecoCondominio.trim() || undefined,
        }),
        ...(perfil === 'administradora' && {
          nomeEmpresa: form.nomeEmpresa.trim(),
          cnpj: form.cnpj.trim() || undefined,
        }),
      };
      const res = await authApi.selfRegister(payload);
      setSucesso(res.message);
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  };

  const inputClass = 'cadastro-input';
  const labelClass = 'cadastro-label';

  /* ===================== SUCESSO ===================== */
  if (sucesso) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-card" style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div className="cadastro-success-icon">
            <Check size={40} />
          </div>
          <h1 className="cadastro-title">Cadastro Realizado!</h1>
          <p className="cadastro-subtitle" style={{ marginBottom: 32 }}>
            {perfil === 'sindico'
              ? 'Seu condomínio já está pronto. Acesse o painel para começar.'
              : 'Sua conta de administradora foi criada. Gerencie seus condomínios no painel.'}
          </p>
          <Link to="/login" className="cadastro-btn cadastro-btn-primary">
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  /* ===================== SELEÇÃO DE PERFIL ===================== */
  if (!perfil) {
    return (
      <div className="cadastro-page">
        <div className="cadastro-card" style={{ maxWidth: 680 }}>
          <div className="cadastro-header-logo">
            <img src={logoImg} alt="App Síndico" className="cadastro-logo" />
          </div>
          <h1 className="cadastro-title">Criar Conta</h1>
          <p className="cadastro-subtitle">Selecione o tipo de cadastro</p>

          <div className="cadastro-perfil-grid">
            {/* SÍNDICO */}
            <button
              className="cadastro-perfil-card cadastro-perfil-sindico"
              onClick={() => setPerfil('sindico')}
            >
              <div className="cadastro-perfil-icon cadastro-perfil-icon-sindico">
                <Building2 size={28} />
              </div>
              <h2 className="cadastro-perfil-title">CADASTRO SÍNDICO</h2>
              <p className="cadastro-perfil-desc">
                Para síndicos que administram um único condomínio
              </p>
              <ul className="cadastro-perfil-features">
                {['1 condomínio', 'Gestão completa', 'Ordens de serviço', 'Portal do morador', 'QR Code'].map(f => (
                  <li key={f}><Check size={14} /> {f}</li>
                ))}
              </ul>
              <div className="cadastro-perfil-price">
                <span className="cadastro-price-currency">R$</span>
                <span className="cadastro-price-value">199</span>
                <span className="cadastro-price-period">/mês</span>
              </div>
            </button>

            {/* ADMINISTRADORA */}
            <button
              className="cadastro-perfil-card cadastro-perfil-admin"
            onClick={() => setPerfil('administradora')}
            >
              <div className="cadastro-perfil-badge">POPULAR</div>
              <div className="cadastro-perfil-icon cadastro-perfil-icon-admin">
                <Building size={28} />
              </div>
              <h2 className="cadastro-perfil-title">CADASTRO ADMINISTRADORA</h2>
              <p className="cadastro-perfil-desc">
                Para administradoras que gerenciam múltiplos condomínios
              </p>
              <ul className="cadastro-perfil-features">
                {['Condomínios ilimitados', 'Todas as funcionalidades', 'Gestão de síndicos', 'Relatórios e analytics', 'Suporte prioritário'].map(f => (
                  <li key={f}><Check size={14} /> {f}</li>
                ))}
              </ul>
              <div className="cadastro-perfil-price">
                <span className="cadastro-price-currency">R$</span>
                <span className="cadastro-price-value">350</span>
                <span className="cadastro-price-period">/mês</span>
              </div>
            </button>
          </div>

          <p className="cadastro-login-link">
            Já tem uma conta?{' '}
            <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ===================== FORMULÁRIO ===================== */
  const isSindico = perfil === 'sindico';

  return (
    <div className="cadastro-page">
      <div className="cadastro-card" style={{ maxWidth: 560 }}>
        <button className="cadastro-voltar" onClick={() => { setPerfil(null); setErro(''); }}>
          <ArrowLeft size={16} /> Voltar à seleção
        </button>

        <div className={`cadastro-form-header ${isSindico ? 'cadastro-header-sindico' : 'cadastro-header-admin'}`}>
          <span className="cadastro-form-header-icon">{isSindico ? <Building2 size={28} /> : <Building size={28} />}</span>
          <div>
            <h2>{isSindico ? 'Cadastro Síndico' : 'Cadastro Administradora'}</h2>
            <p>{isSindico ? 'Plano Síndico — R$ 199/mês' : 'Plano Administradora — R$ 350/mês'}</p>
          </div>
        </div>

        {erro && <div className="cadastro-erro">{erro}</div>}

        <form onSubmit={handleSubmit} className="cadastro-form">
          {/* Dados pessoais */}
          <div className="cadastro-section">
            <h3 className="cadastro-section-title">
              <span className={`cadastro-step ${isSindico ? 'step-sindico' : 'step-admin'}`}>1</span>
              Dados Pessoais
            </h3>
            <div className="cadastro-grid">
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <input type="text" required className={inputClass} placeholder="Seu nome" value={form.nome} onChange={e => update('nome', e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className={labelClass}>Telefone *</label>
                <input type="tel" required className={inputClass} placeholder="(11) 99999-9999" value={form.telefone} onChange={e => update('telefone', e.target.value)} autoComplete="tel" />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input type="email" required className={inputClass} placeholder="seu@email.com" value={form.email} onChange={e => update('email', e.target.value)} autoComplete="email" />
              </div>
              <div>
                <label className={labelClass}>Senha *</label>
                <div className="cadastro-input-wrapper">
                  <input type={mostrarSenha ? 'text' : 'password'} required className={inputClass} placeholder="Mínimo 6 caracteres" value={form.senha} onChange={e => update('senha', e.target.value)} autoComplete="new-password" />
                  <button type="button" className="cadastro-eye" onClick={() => setMostrarSenha(!mostrarSenha)}>
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirmar Senha *</label>
                <input type={mostrarSenha ? 'text' : 'password'} required className={inputClass} placeholder="Repita sua senha" value={form.confirmarSenha} onChange={e => update('confirmarSenha', e.target.value)} autoComplete="new-password" />
              </div>
            </div>
          </div>

          {/* Dados do condomínio (síndico) */}
          {isSindico && (
            <div className="cadastro-section">
              <h3 className="cadastro-section-title">
                <span className="cadastro-step step-sindico">2</span>
                Dados do Condomínio
              </h3>
              <div className="cadastro-grid">
                <div>
                  <label className={labelClass}>Nome do Condomínio *</label>
                  <input type="text" required className={inputClass} placeholder="Residencial Exemplo" value={form.nomeCondominio} onChange={e => update('nomeCondominio', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Endereço</label>
                  <input type="text" className={inputClass} placeholder="Rua, número, bairro" value={form.enderecoCondominio} onChange={e => update('enderecoCondominio', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Dados da empresa (administradora) */}
          {!isSindico && (
            <div className="cadastro-section">
              <h3 className="cadastro-section-title">
                <span className="cadastro-step step-admin">2</span>
                Dados da Empresa
              </h3>
              <div className="cadastro-grid">
                <div>
                  <label className={labelClass}>Nome da Empresa *</label>
                  <input type="text" required className={inputClass} placeholder="Administradora Exemplo Ltda." value={form.nomeEmpresa} onChange={e => update('nomeEmpresa', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input type="text" className={inputClass} placeholder="00.000.000/0001-00" value={form.cnpj} onChange={e => update('cnpj', e.target.value)} />
                </div>
              </div>
              <div className="cadastro-info-box">
                💡 Após o cadastro, você poderá adicionar seus condomínios no painel da administradora.
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`cadastro-btn cadastro-btn-submit ${isSindico ? 'btn-sindico' : 'btn-admin'}`}
            disabled={carregando}
          >
            {carregando ? 'Cadastrando...' : `Criar Conta ${isSindico ? 'Síndico' : 'Administradora'}`}
          </button>

          <p className="cadastro-terms">
            Ao criar sua conta, você concorda com os Termos de Uso e a Política de Privacidade.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CadastroPage;
