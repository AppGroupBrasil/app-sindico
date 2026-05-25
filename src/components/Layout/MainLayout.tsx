import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import DemoBlockModal from '../Common/DemoBlockModal';
import GlobalSearch from '../Common/GlobalSearch';
import { usePermissions } from '../../contexts/PermissionsContext';
import styles from './MainLayout.module.css';

const MainLayout: React.FC = () => {
  const { roleNivel } = usePermissions();
  const isMobileBarUser = roleNivel <= 2;
  const location = useLocation();
  const navigate = useNavigate();
  const showBack = location.pathname !== '/inicio';

  return (
    <div className={`${styles.layout} ${isMobileBarUser ? styles.layoutTopBar : ''}`}>
      <Sidebar />
      <main className={`${styles.main} ${isMobileBarUser ? styles.mainTopBar : ''}`}>
        {showBack && (
          <button
            className={styles.backToTiles}
            onClick={() => navigate('/inicio')}
            title="Voltar para a tela de ícones"
            aria-label="Voltar para o início"
          >
            <ArrowLeft size={18} />
            <span>Voltar aos ícones</span>
          </button>
        )}
        <Outlet />
      </main>
      <DemoBlockModal />
      <GlobalSearch />
    </div>
  );
};

export default MainLayout;
