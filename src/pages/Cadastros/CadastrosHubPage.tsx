import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Contact, Shield, ChevronRight } from 'lucide-react';
import styles from './CadastrosHubPage.module.css';

interface Card { id: string; numero: number; titulo: string; descricao: string; rota: string; icon: React.ReactNode; cor: string; }

const cards: Card[] = [
  { id: 'condominios', numero: 1, titulo: 'Condomínios', descricao: 'Comece cadastrando o(s) condomínio(s) que você administra.', rota: '/condominios', icon: <Building2 size={28} />, cor: '#1E88E5' },
  { id: 'usuarios', numero: 2, titulo: 'Usuários e Funcionários', descricao: 'Cadastre síndicos, administradores e funcionários (porteiros, zeladores).', rota: '/usuarios', icon: <Users size={28} />, cor: '#0891B2' },
  { id: 'moradores', numero: 3, titulo: 'Moradores', descricao: 'Cadastre os moradores e vincule a apartamentos.', rota: '/moradores', icon: <Contact size={28} />, cor: '#10B981' },
  { id: 'permissoes', numero: 4, titulo: 'Permissões (opcional)', descricao: 'Ajuste o que cada perfil pode ver e editar — pode pular para depois.', rota: '/permissoes', icon: <Shield size={28} />, cor: '#6366F1' },
];

const CadastrosHubPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.head}>
          <h1>Cadastros</h1>
          <p>Comece pelo passo 1 e siga a ordem sugerida. Você pode voltar aqui sempre que precisar adicionar ou alterar algo.</p>
        </div>

        <div className={styles.list}>
          {cards.map(c => (
            <button key={c.id} className={styles.card} onClick={() => navigate(c.rota)} style={{ borderLeftColor: c.cor }}>
              <div className={styles.numero} style={{ background: c.cor }}>{c.numero}</div>
              <div className={styles.iconBox} style={{ color: c.cor, background: c.cor + '15' }}>{c.icon}</div>
              <div className={styles.body}>
                <div className={styles.titulo}>{c.titulo}</div>
                <div className={styles.desc}>{c.descricao}</div>
              </div>
              <ChevronRight size={22} className={styles.arrow} />
            </button>
          ))}
        </div>

        <div className={styles.dica}>
          💡 <strong>Dica:</strong> uma vez que um cadastro estiver feito, você pode usá-lo nos outros módulos do sistema (comunicados, ordens de serviço, vencimentos, etc.).
        </div>
      </div>
    </div>
  );
};

export default CadastrosHubPage;
