import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { menuItems } from '../../components/Layout/Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import styles from './HomeAppPage.module.css';

const FAVORITOS_KEY = 'manutencao-sidebar-favoritos';
const OCULTOS_KEY = 'manutencao-sidebar-ocultos';
const MODO_MENU_KEY = 'manutencao-sidebar-modo';

const HomeAppPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { roleNivel, podeVer } = usePermissions();

  const [modoMenu, setModoMenu] = useState<'simples' | 'completo'>(() => {
    return (localStorage.getItem(MODO_MENU_KEY) as 'simples' | 'completo') || 'simples';
  });

  const [favoritos, setFavoritos] = useState<Set<string>>(() => {
    try { const v = localStorage.getItem(FAVORITOS_KEY); return v ? new Set(JSON.parse(v)) : new Set(); }
    catch { return new Set(); }
  });

  const ocultos = useMemo<Set<string>>(() => {
    try { const v = localStorage.getItem(OCULTOS_KEY); return v ? new Set(JSON.parse(v)) : new Set(); }
    catch { return new Set(); }
  }, []);

  const trocarModo = (modo: 'simples' | 'completo') => {
    setModoMenu(modo);
    localStorage.setItem(MODO_MENU_KEY, modo);
  };

  const toggleFavorito = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavoritos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(FAVORITOS_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const items = useMemo(() => {
    let base = menuItems.filter(it => roleNivel >= it.minRole && podeVer(it.id) && !ocultos.has(it.id));
    if (modoMenu === 'simples') base = base.filter(it => it.simples);
    base = [...base].sort((a, b) => {
      const af = favoritos.has(a.id) ? 0 : 1;
      const bf = favoritos.has(b.id) ? 0 : 1;
      return af - bf;
    });
    return base;
  }, [roleNivel, podeVer, ocultos, modoMenu, favoritos]);

  const inicial = (usuario?.nome || '?').trim().charAt(0).toUpperCase();
  const roleLabel: Record<string, string> = {
    master: 'Master',
    administrador: 'Administrador',
    supervisor: 'Supervisor',
    funcionario: 'Funcionário',
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>{inicial}</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{usuario?.nome || 'Usuário'}</span>
          <span className={styles.userRole}>{roleLabel[usuario?.role || ''] || ''}</span>
        </div>
      </div>

      <div className={styles.modoTabs}>
        <button
          className={`${styles.modoTab} ${modoMenu === 'simples' ? styles.active : ''}`}
          onClick={() => trocarModo('simples')}
        >
          Menu<br />Simples
        </button>
        <button
          className={`${styles.modoTab} ${modoMenu === 'completo' ? styles.active : ''}`}
          onClick={() => trocarModo('completo')}
        >
          Menu<br />Completo
        </button>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>Nenhum item disponível para o seu perfil.</div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <div
              key={item.id}
              className={styles.tile}
              onClick={() => navigate(item.rota)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(item.rota); }}
            >
              <button
                className={`${styles.fav} ${favoritos.has(item.id) ? styles.active : ''}`}
                onClick={(e) => toggleFavorito(e, item.id)}
                aria-label={favoritos.has(item.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Star size={16} fill={favoritos.has(item.id) ? 'currentColor' : 'none'} />
              </button>
              <div className={styles.tileIcon}>{item.icon}</div>
              <div className={styles.tileLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomeAppPage;
