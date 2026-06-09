import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth as apiAuth, setToken } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const SsoPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { loginDireto } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const feito = useRef(false);

  useEffect(() => {
    if (feito.current) return;
    feito.current = true;
    const token = params.get('token');
    if (!token) { setErro('Link de acesso inválido.'); return; }
    apiAuth.sso(token)
      .then(({ token: jwt, user }) => {
        setToken(jwt);
        loginDireto({
          id: user.id, email: user.email, nome: user.nome, role: user.role,
          ativo: true, bloqueado: false, criadoPor: '',
          administradorId: user.administradorId, supervisorId: user.supervisorId,
          condominioId: user.condominioId, avatarUrl: user.avatarUrl,
          criadoEm: Date.now(), atualizadoEm: Date.now(),
        } as any);
        navigate('/inicio', { replace: true });
      })
      .catch(() => setErro('Não foi possível validar o acesso. Faça login manualmente.'));
  }, [params, navigate, loginDireto]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cor-fundo)' }}>
      <div style={{ textAlign: 'center' }}>
        {erro ? (
          <>
            <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 14, marginBottom: 12 }}>{erro}</p>
            <button className="btn" onClick={() => navigate('/login', { replace: true })}>Ir para o login</button>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, border: '3px solid var(--cor-borda)', borderTop: '3px solid var(--cor-primaria)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 14 }}>Entrando…</p>
          </>
        )}
      </div>
    </div>
  );
};

export default SsoPage;
