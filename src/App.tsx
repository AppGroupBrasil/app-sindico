import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ROLE_HIERARCHY } from './types';
import MainLayout from './components/Layout/MainLayout';
import LoginPage from './pages/Auth/LoginPage';
import BloqueadoPage from './pages/Auth/BloqueadoPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import HomeAppPage from './pages/HomeApp/HomeAppPage';
import CadastrosHubPage from './pages/Cadastros/CadastrosHubPage';
import PainelRevistaPage from './pages/Revista/PainelRevistaPage';
import RevistaPage from './pages/Revista/RevistaPage';
import MoradorRevistaPage from './pages/Revista/MoradorRevistaPage';
import TarefaRevistaPage from './pages/Revista/TarefaRevistaPage';
import FuncionariosRevistaPage from './pages/Revista/FuncionariosPage';
import UsuariosPage from './pages/Usuarios/UsuariosPage';
import CondominiosPage from './pages/Condominios/CondominiosPage';
import OrdensServicoPage from './pages/OrdensServico/OrdensServicoPage';
import ChecklistsPage from './pages/Checklists/ChecklistsPage';
import EscalasPage from './pages/Escalas/EscalasPage';
import MateriaisPage from './pages/Materiais/MateriaisPage';
import InspecoesPage from './pages/Inspecoes/InspecoesPage';
import GeolocalizacaoPage from './pages/Geolocalizacao/GeolocalizacaoPage';
import RelatoriosPage from './pages/Relatorios/RelatoriosPage';
import PermissoesPage from './pages/Permissoes/PermissoesPage';
import ConfiguracoesPage from './pages/Configuracoes/ConfiguracoesPage';
import ReportesPage from './pages/Reportes/ReportesPage';
import VistoriaPage from './pages/Vistorias/VistoriaPage';
import QRCodePage from './pages/QRCode/QRCodePage';
import LeitorQRCodePage from './pages/QRCode/LeitorQRCodePage';
import MapaCalorPage from './pages/MapaCalor/MapaCalorPage';
import TarefasPage from './pages/Tarefas/TarefasPage';
import RoteiroExecucaoPage from './pages/Roteiros/RoteiroExecucaoPage';
import VencimentosPage from './pages/Vencimentos/VencimentosPage';
import LaudosPage from './pages/Laudos/LaudosPage';
import MoradoresPage from './pages/Moradores/MoradoresPage';
import ComunicadosPage from './pages/Comunicados/ComunicadosPage';
import QuadroAtividadesPage from './pages/QuadroAtividades/QuadroAtividadesPage';
import DemoEntryPage from './pages/Demo/DemoEntryPage';
import DemoShowcasePage from './pages/Demo/DemoShowcasePage';
import CentralMoradorPage from './pages/CentralMorador/CentralMoradorPage';
import AcompanharSolicitacaoPage from './pages/CentralMorador/AcompanharSolicitacaoPage';
import CadastroPage from './pages/Auth/CadastroPage';
import EsqueciSenhaPage from './pages/Auth/EsqueciSenhaPage';
import SsoPage from './pages/Auth/SsoPage';
import PerfilPage from './pages/Perfil/PerfilPage';
import NotificacoesPage from './pages/Notificacoes/NotificacoesPage';

import EquipamentosPage from './pages/Equipamentos/EquipamentosPage';
import FornecedoresPage from './pages/Fornecedores/FornecedoresPage';
import PlanosManutencaoPage from './pages/PlanosManutencao/PlanosManutencaoPage';

import DocumentosPage from './pages/Documentos/DocumentosPage';
import SolicitacoesPage from './pages/Solicitacoes/SolicitacoesPage';

import CalendarioPage from './pages/Calendario/CalendarioPage';
import SindicoPage from './pages/Sindico/SindicoPage';


import PortalLoginPage from './pages/Portal/PortalLoginPage';
import PortalLayout from './pages/Portal/PortalLayout';
import PortalDashboardPage from './pages/Portal/PortalDashboardPage';
import PortalSolicitacoesPage from './pages/Portal/PortalSolicitacoesPage';
import PortalComunicadosPage from './pages/Portal/PortalComunicadosPage';
import PortalPerfilPage from './pages/Portal/PortalPerfilPage';
import { getPortalToken, setPortalToken, portal as portalApi } from './services/api';
import type { MoradorPortal } from './types';
import OfflineIndicator from './components/Common/OfflineIndicator';
import { usePushNotifications } from './hooks/usePushNotifications';
import HomePage from './pages/Home/HomePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cor-fundo)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--cor-borda)', borderTop: '3px solid var(--cor-primaria)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--cor-texto-secundario)', fontSize: 14 }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.bloqueado) return <Navigate to="/bloqueado" replace />;

  return <>{children}</>;
};

const RoleGuard: React.FC<{ minRole: number; children: React.ReactNode }> = ({ minRole, children }) => {
  const { usuario } = useAuth();
  const nivel = ROLE_HIERARCHY[usuario?.role || 'funcionario'];
  if (nivel < minRole) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { usuario, carregando } = useAuth();
  usePushNotifications(!!usuario);
  const [morador, setMorador] = React.useState<MoradorPortal | null>(null);
  const [portalLoading, setPortalLoading] = React.useState(true);

  React.useEffect(() => {
    const token = getPortalToken();
    if (token) {
      portalApi.me()
        .then((m: any) => setMorador(m))
        .catch(() => setPortalToken(null))
        .finally(() => setPortalLoading(false));
    } else {
      setPortalLoading(false);
    }
  }, []);

  const handlePortalLogin = (m: any) => {
    setMorador(m);
  };

  const handlePortalLogout = () => {
    setPortalToken(null);
    setMorador(null);
  };

  return (
    <>
    <Routes>
      {/* Home pública — se logado, vai direto pros tiles */}
      <Route path="/" element={
        !carregando && usuario && !usuario.bloqueado ? <Navigate to="/inicio" replace /> : <HomePage />
      } />

      <Route path="/login" element={
        !carregando && usuario && !usuario.bloqueado ? <Navigate to="/inicio" replace /> : <LoginPage />
      } />
      <Route path="/bloqueado" element={<BloqueadoPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
      <Route path="/sso" element={<SsoPage />} />
      <Route path="/demo/:perfil" element={<DemoEntryPage />} />
      <Route path="/demo" element={<DemoShowcasePage />} />
      <Route path="/r/:slug" element={<RevistaPage />} />
      <Route path="/m/:slug" element={<CentralMoradorPage />} />
      <Route path="/c/:token" element={<AcompanharSolicitacaoPage />} />

      {/* Portal do Morador */}
      <Route path="/portal/login" element={
        !portalLoading && morador ? <Navigate to="/portal" replace /> : <PortalLoginPage onLogin={handlePortalLogin} />
      } />
      <Route path="/portal" element={
        !portalLoading && !morador ? <Navigate to="/portal/login" replace /> : <PortalLayout morador={morador} onLogout={handlePortalLogout} />
      }>
        <Route index element={<PortalDashboardPage morador={morador} />} />
        <Route path="solicitacoes" element={<PortalSolicitacoesPage />} />
        <Route path="comunicados" element={<PortalComunicadosPage />} />
        <Route path="perfil" element={<PortalPerfilPage morador={morador} onUpdate={setMorador} />} />
      </Route>

      {/* Rotas protegidas do sistema */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="inicio" element={<HomeAppPage />} />
        <Route path="cadastros" element={<RoleGuard minRole={2}><CadastrosHubPage /></RoleGuard>} />
        <Route path="dashboard" element={<Navigate to="/inicio" replace />} />
        <Route path="painel-analitico" element={<DashboardPage />} />
        <Route path="revista" element={<RoleGuard minRole={2}><PainelRevistaPage /></RoleGuard>} />
        <Route path="revista/visualizar" element={<RevistaPage />} />
        <Route path="revista/morador" element={<MoradorRevistaPage />} />
        <Route path="revista/tarefa/:id" element={<TarefaRevistaPage />} />
        <Route path="revista/funcionarios" element={<RoleGuard minRole={2}><FuncionariosRevistaPage /></RoleGuard>} />
        <Route path="condominios" element={<RoleGuard minRole={2}><CondominiosPage /></RoleGuard>} />
        <Route path="usuarios" element={<RoleGuard minRole={3}><UsuariosPage /></RoleGuard>} />
        <Route path="ordens-servico" element={<OrdensServicoPage />} />
        <Route path="checklists" element={<ChecklistsPage />} />
        <Route path="vistorias" element={<VistoriaPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="escalas" element={<RoleGuard minRole={2}><EscalasPage /></RoleGuard>} />
        <Route path="materiais" element={<MateriaisPage />} />
        <Route path="inspecoes" element={<RoleGuard minRole={2}><InspecoesPage /></RoleGuard>} />
        <Route path="geolocalizacao" element={<RoleGuard minRole={2}><GeolocalizacaoPage /></RoleGuard>} />
        <Route path="relatorios" element={<RoleGuard minRole={2}><RelatoriosPage /></RoleGuard>} />
        <Route path="permissoes" element={<RoleGuard minRole={3}><PermissoesPage /></RoleGuard>} />
        <Route path="qrcode" element={<RoleGuard minRole={2}><QRCodePage /></RoleGuard>} />
        <Route path="leitor-qrcode" element={<RoleGuard minRole={1}><LeitorQRCodePage /></RoleGuard>} />
        <Route path="mapa-calor" element={<RoleGuard minRole={3}><MapaCalorPage /></RoleGuard>} />
        <Route path="tarefas" element={<TarefasPage />} />
        <Route path="roteiros" element={<RoteiroExecucaoPage />} />
        <Route path="vencimentos" element={<RoleGuard minRole={2}><VencimentosPage /></RoleGuard>} />
        <Route path="laudos" element={<RoleGuard minRole={2}><LaudosPage /></RoleGuard>} />
        <Route path="moradores" element={<RoleGuard minRole={2}><MoradoresPage /></RoleGuard>} />
        <Route path="comunicados" element={<RoleGuard minRole={2}><ComunicadosPage /></RoleGuard>} />
        <Route path="quadro-atividades" element={<QuadroAtividadesPage />} />
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="notificacoes" element={<NotificacoesPage />} />

        <Route path="configuracoes" element={<RoleGuard minRole={4}><ConfiguracoesPage /></RoleGuard>} />
        <Route path="equipamentos" element={<RoleGuard minRole={2}><EquipamentosPage /></RoleGuard>} />
        <Route path="fornecedores" element={<RoleGuard minRole={2}><FornecedoresPage /></RoleGuard>} />
        <Route path="planos-manutencao" element={<RoleGuard minRole={2}><PlanosManutencaoPage /></RoleGuard>} />

        <Route path="documentos" element={<RoleGuard minRole={2}><DocumentosPage /></RoleGuard>} />
        <Route path="solicitacoes" element={<RoleGuard minRole={2}><SolicitacoesPage /></RoleGuard>} />

        <Route path="calendario" element={<RoleGuard minRole={2}><CalendarioPage /></RoleGuard>} />
        <Route path="sindico" element={<RoleGuard minRole={3}><SindicoPage /></RoleGuard>} />


      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <OfflineIndicator />
    </>
  );
};

export default App;
