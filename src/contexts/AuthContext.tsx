import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth as apiAuth, setToken, getToken } from '../services/api';
import type { User, UserRole } from '../types';

interface AuthContextData {
  usuario: User | null;
  firebaseUser: null;
  carregando: boolean;
  erro: string | null;
  login: (email: string, senha: string) => Promise<void>;
  cadastrar: (email: string, senha: string, nome: string, role: UserRole, extras?: { administradorId?: string; supervisorId?: string; condominioId?: string }) => Promise<void>;
  logout: () => Promise<void>;
  atualizarUsuario: (dados: Partial<User>) => Promise<void>;
  loginDireto: (user: User) => void;
  limparErro: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const MOCK_USERS: Record<string, User> = {
  'eduardodominikus@hotmail.com': {
    id: 'eduardo-001', email: 'eduardodominikus@hotmail.com', nome: 'Eduardo Dominikus',
    role: 'master', ativo: true, bloqueado: false, criadoPor: 'system',
    criadoEm: Date.now(), atualizadoEm: Date.now(),
  },
  'master@manutencao.com': {
    id: 'master-001', email: 'master@manutencao.com', nome: 'Master Admin',
    role: 'master', ativo: true, bloqueado: false, criadoPor: 'system',
    criadoEm: Date.now(), atualizadoEm: Date.now(),
  },
  'admin@manutencao.com': {
    id: 'admin-001', email: 'admin@manutencao.com', nome: 'Administrador',
    role: 'administrador', ativo: true, bloqueado: false, criadoPor: 'master-001',
    administradorId: 'master-001', condominioId: 'c1',
    criadoEm: Date.now(), atualizadoEm: Date.now(),
  },
  'supervisor@manutencao.com': {
    id: 'sup-001', email: 'supervisor@manutencao.com', nome: 'Supervisor Silva',
    role: 'supervisor', ativo: true, bloqueado: false, criadoPor: 'admin-001',
    administradorId: 'admin-001', supervisorId: 'admin-001', condominioId: 'c1',
    criadoEm: Date.now(), atualizadoEm: Date.now(),
  },
  'func@manutencao.com': {
    id: 'func-001', email: 'func@manutencao.com', nome: 'João Funcionário',
    role: 'funcionario', ativo: true, bloqueado: false, criadoPor: 'sup-001',
    administradorId: 'admin-001', supervisorId: 'sup-001', condominioId: 'c1',
    cargo: 'Auxiliar de Manutenção', criadoEm: Date.now(), atualizadoEm: Date.now(),
  },
};

const useApiMode = () => {
  try { return !!import.meta.env.VITE_API_URL; } catch { return false; }
};
const useMockMode = () => !useApiMode();

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const mockMode = useMockMode();
  const apiMode = useApiMode();

  const limparErro = useCallback(() => setErro(null), []);

  const apiToUser = (data: any): User => ({
    id: data.id,
    email: data.email,
    nome: data.nome,
    role: data.role,
    ativo: data.ativo ?? true,
    bloqueado: data.bloqueado ?? false,
    motivoBloqueio: data.motivoBloqueio || data.motivo_bloqueio,
    criadoPor: data.criadoPor || data.criado_por || '',
    administradorId: data.administradorId || data.administrador_id,
    supervisorId: data.supervisorId || data.supervisor_id,
    condominioId: data.condominioId || data.condominio_id,
    avatarUrl: data.avatarUrl || data.avatar_url,
    telefone: data.telefone,
    cargo: data.cargo,
    criadoEm: data.criadoEm || data.criado_em || Date.now(),
    atualizadoEm: data.atualizadoEm || data.atualizado_em || Date.now(),
  });

  useEffect(() => {
    if (apiMode) {
      const token = getToken();
      if (token) {
        const tryRestore = (attempts: number) => {
          apiAuth.me()
            .then(data => { setUsuario(apiToUser(data)); setCarregando(false); })
            .catch((err) => {
              if (err.message?.includes('expirada') || err.message?.includes('401')) {
                setToken(null); setCarregando(false); return;
              }
              if (attempts > 0) setTimeout(() => tryRestore(attempts - 1), 2000);
              else { setToken(null); setCarregando(false); }
            });
        };
        tryRestore(2);
      } else {
        setCarregando(false);
      }
      return;
    }

    // Mock mode (dev local sem backend)
    const saved = localStorage.getItem('manutencao_user');
    if (saved) {
      try { setUsuario(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setCarregando(false);
  }, [apiMode]);

  const login = async (email: string, senha: string) => {
    setErro(null);
    setCarregando(true);
    try {
      if (apiMode) {
        const { token, user } = await apiAuth.login(email, senha);
        setToken(token);
        setUsuario(apiToUser(user));
      } else {
        const mockUser = MOCK_USERS[email.toLowerCase()];
        if (mockUser && senha.length >= 6) {
          if (mockUser.bloqueado) throw new Error(mockUser.motivoBloqueio || 'Conta bloqueada.');
          setUsuario(mockUser);
          localStorage.setItem('manutencao_user', JSON.stringify(mockUser));
          if (mockUser.condominioId) localStorage.setItem('manutencao-ultimo-condo', mockUser.condominioId);
        } else {
          throw new Error('E-mail ou senha inválidos.');
        }
      }
    } catch (e: any) {
      const msg = e.message || 'Erro ao fazer login.';
      setErro(msg);
      throw new Error(msg);
    } finally {
      setCarregando(false);
    }
  };

  const cadastrar = async (email: string, senha: string, nome: string, role: UserRole, extras?: { administradorId?: string; supervisorId?: string; condominioId?: string }) => {
    setErro(null);
    setCarregando(true);
    try {
      if (apiMode) {
        await apiAuth.register({ email, senha, nome, role, condominioId: extras?.condominioId, supervisorId: extras?.supervisorId });
      } else {
        const newUser: User = {
          id: `user-${Date.now()}`, email, nome, role,
          ativo: true, bloqueado: false,
          criadoPor: usuario?.id || 'system',
          administradorId: extras?.administradorId || (usuario?.role === 'administrador' ? usuario.id : usuario?.administradorId),
          supervisorId: extras?.supervisorId || (usuario?.role === 'supervisor' ? usuario.id : undefined),
          condominioId: extras?.condominioId || usuario?.condominioId,
          criadoEm: Date.now(), atualizadoEm: Date.now(),
        };
        MOCK_USERS[email.toLowerCase()] = newUser;
      }
    } catch (e: any) {
      const msg = e.message || 'Erro ao cadastrar.';
      setErro(msg);
      throw new Error(msg);
    } finally {
      setCarregando(false);
    }
  };

  const loginDireto = (user: User) => {
    setUsuario(user);
    localStorage.setItem('manutencao_user', JSON.stringify(user));
    setCarregando(false);
  };

  const logout = async () => {
    setUsuario(null);
    if (apiMode) setToken(null);
    else localStorage.removeItem('manutencao_user');
  };

  const atualizarUsuario = async (dados: Partial<User>) => {
    if (!usuario) return;
    const updated = { ...usuario, ...dados, atualizadoEm: Date.now() };
    setUsuario(updated);
    if (!apiMode) localStorage.setItem('manutencao_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ usuario, firebaseUser: null, carregando, erro, login, cadastrar, logout, atualizarUsuario, loginDireto, limparErro }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx.login) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
