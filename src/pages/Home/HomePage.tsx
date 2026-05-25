import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Truck, Hammer, HardHat, ArrowLeftRight, ShoppingCart, Star,
  PartyPopper, Sparkles, Calendar, Image, Car, Tag, Megaphone,
  UserCheck, Lightbulb, PenLine, BarChart3, UserCircle, Baby,
  DollarSign, Images, Link as LinkIcon, LayoutGrid, MessageSquare,
  Users, HardHatIcon, Wrench, Store, QrCode, Trophy, BookOpen,
  Heart, Shield, CalendarDays, Leaf, Phone, ChevronRight,
  CheckCircle2, ArrowRight, Menu, X
} from 'lucide-react';
import styles from './HomePage.module.css';
import logoAppSindico from '../../assets/logo.png';

/* ── Dados ── */

const categories = [
  { name: 'Achados e Perdidos', color: '#6B7280', icon: Search },
  { name: 'Agendamento de Mudanças', color: '#D97706', icon: Truck },
  { name: 'Agendamento de Reformas', color: '#B45309', icon: Hammer },
  { name: 'Gestão de Funcionários', color: '#0D9488', icon: HardHat },
  { name: 'Antes e Depois', color: '#8B5CF6', icon: ArrowLeftRight },
  { name: 'Aquisições do Condomínio', color: '#DC2626', icon: ShoppingCart },
  { name: 'Avaliações', color: '#F59E0B', icon: Star },
  { name: 'Boas-Vindas', color: '#E879F9', icon: PartyPopper },
  { name: 'Benfeitorias', color: '#E11D48', icon: Sparkles },
  { name: 'Calendário de Eventos', color: '#14B8A6', icon: Calendar },
  { name: 'Capa da Revista', color: '#0F172A', icon: Image },
  { name: 'Caronas Coletivas', color: '#059669', icon: Car },
  { name: 'Classificados', color: '#0EA5E9', icon: Tag },
  { name: 'Comunicados Oficiais', color: '#EF4444', icon: Megaphone },
  { name: 'Conheça o Síndico', color: '#0891B2', icon: UserCheck },
  { name: 'Dicas do Síndico', color: '#FBBF24', icon: Lightbulb },
  { name: 'Editorial', color: '#6366F1', icon: PenLine },
  { name: 'Enquetes e Pesquisas', color: '#7C3AED', icon: BarChart3 },
  { name: 'Espaço do Morador', color: '#06B6D4', icon: UserCircle },
  { name: 'Espaço Kids', color: '#A855F7', icon: Baby },
  { name: 'Financeiro', color: '#10B981', icon: DollarSign },
  { name: 'Galeria de Imagens', color: '#F59E0B', icon: Images },
  { name: 'Links', color: '#6366F1', icon: LinkIcon },
  { name: 'Mural de QR Codes', color: '#6D28D9', icon: LayoutGrid },
  { name: 'Mural de Recados', color: '#FB923C', icon: MessageSquare },
  { name: 'Nossa Equipe', color: '#EC4899', icon: Users },
  { name: 'Obras e Manutenção', color: '#F97316', icon: HardHat },
  { name: 'Parceiros e Convênios', color: '#2563EB', icon: Wrench },
  { name: 'Pets', color: '#D946EF', icon: Heart },
  { name: 'Prestadores de Serviço', color: '#0D9488', icon: Wrench },
  { name: 'Publicidade Local', color: '#84CC16', icon: Store },
  { name: 'QR Codes Públicos', color: '#7C3AED', icon: QrCode },
  { name: 'Realizações', color: '#CA8A04', icon: Trophy },
  { name: 'Regras e Regulamento', color: '#64748B', icon: BookOpen },
  { name: 'Saúde e Bem-estar', color: '#F43F5E', icon: Heart },
  { name: 'Segurança', color: '#3B82F6', icon: Shield },
  { name: 'Semana do Condomínio', color: '#7C3AED', icon: CalendarDays },
  { name: 'Sustentabilidade', color: '#22C55E', icon: Leaf },
  { name: 'Telefones Úteis', color: '#0EA5E9', icon: Phone },
];

const features = [
  { icon: '📖', title: 'Revista Digital', desc: '8 layouts elegantes com efeito flip, stories, timeline e muito mais' },
  { icon: '🎨', title: 'Personalização Total', desc: '8 temas de cores, logo e identidade visual do seu condomínio' },
  { icon: '📱', title: 'QR Code', desc: 'Moradores acessam revista e fazem solicitações via QR Code' },
  { icon: '📋', title: '38 Categorias', desc: 'Cards pré-configurados que o síndico ativa com um clique' },
  { icon: '👷', title: 'Gestão de Funcionários', desc: 'Crie tarefas, checklists, vistorias e acompanhe em tempo real' },
  { icon: '🔧', title: 'Manutenções', desc: 'Preventiva, corretiva e emergencial com controle completo' },
  { icon: '🔔', title: 'Chamados', desc: 'Reclamações, manutenção e ocorrências com acompanhamento' },
  { icon: '🚗', title: 'Caronas Coletivas', desc: 'Moradores oferecem carona aos vizinhos pela plataforma' },
  { icon: '📌', title: 'Classificados', desc: 'Moradores anunciam produtos e serviços entre si' },
  { icon: '📊', title: 'Relatórios', desc: 'Antes e depois, checklists, inspeções e produtividade' },
];

const profiles = [
  { role: 'Administradora', icon: '🏢', color: '#1E3A5F', features: ['Múltiplos condomínios', 'Criar revistas', 'Gerenciar síndicos', 'Relatórios gerais'] },
  { role: 'Síndico', icon: '🏠', color: '#10B981', features: ['Alimentar conteúdo', 'Ativar categorias', 'Gerenciar chamados', 'Gestão de funcionários'] },
  { role: 'Funcionário', icon: '👷', color: '#F59E0B', features: ['Receber tarefas via QR', 'Checklists e vistorias', 'Registro de manutenções', 'Antes e depois com fotos'] },
  { role: 'Morador', icon: '👤', color: '#8B5CF6', features: ['Ler revista via QR Code', 'Abrir chamados', 'Classificados e caronas', 'Acompanhar solicitações'] },
];

const plans = [
  {
    type: 'sindico',
    name: 'Plano Síndico',
    price: 199,
    features: ['1 condomínio', 'Até 25 categorias', 'Edições ilimitadas', 'QR Code para moradores', 'Classificados', 'Caronas coletivas', 'Módulo de chamados', 'Personalização de cores e layout', 'Cabeçalho premium', 'Suporte por e-mail'],
  },
  {
    type: 'administradora',
    name: 'Plano Administradora',
    price: 350,
    popular: true,
    features: ['Condomínios ilimitados', 'Todas as 25+ categorias', 'Edições ilimitadas', 'QR Code para moradores', 'Classificados e publicidade', 'Caronas coletivas', 'Módulo completo de chamados', 'Personalização total', 'Cabeçalho premium com logo', 'Relatórios e analytics', 'Gestão de síndicos', 'Suporte prioritário'],
  },
];

const ecosystemApps = [
  { name: 'Portaria X', domain: 'portariax.com.br' },
  { name: 'Gestão e Limpeza', domain: 'gestaoelimpeza.com.br' },
  { name: 'App Correspondência', domain: 'appcorrespondencia.com.br' },
  { name: 'Manutenção X', domain: 'manutencaox.com.br' },
];

const ecosystemBenefits = [
  { icon: '🚀', text: '1 aplicativo novo lançado todo mês*' },
  { icon: '🎨', text: '1 aplicativo 100% customizado ao seu gosto' },
  { icon: '∞', text: 'Recorrência por toda vida' },
];

/* ── Hook para animar ao scroll ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1 }
    );
    const items = el.querySelectorAll(`.${styles.fadeUp}`);
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Componente ── */

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const funcRef = useScrollReveal();
  const catRef = useScrollReveal();
  const perfisRef = useScrollReveal();
  const planosRef = useScrollReveal();
  const ecoRef = useScrollReveal();

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <img src={logoAppSindico} alt="App Síndico" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'contain' }} />
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>
                <span className={styles.word1}>APP</span><span className={styles.word2}>SÍNDICO</span>
              </span>
              <span className={styles.logoSubtitle}>CONDOMÍNIO</span>
            </div>
          </div>

          <nav className={styles.nav}>
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#categorias">Categorias</a>
            <a href="#planos">Planos</a>
            <button onClick={() => navigate('/demo')} className={styles.navLink}>Demo</button>
          </nav>

          <div className={styles.headerActions}>
            <button onClick={() => navigate('/demo')} className={styles.btnOutline}>Ver Demo</button>
            <button onClick={() => navigate('/cadastro')} className={styles.btnPrimary}>Cadastre-se</button>
          </div>

          <button className={styles.menuToggle} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)}>Funcionalidades</a>
            <a href="#categorias" onClick={() => setMenuOpen(false)}>Categorias</a>
            <a href="#planos" onClick={() => setMenuOpen(false)}>Planos</a>
            <button onClick={() => { setMenuOpen(false); navigate('/demo'); }}>Demo</button>
            <button onClick={() => { setMenuOpen(false); navigate('/cadastro'); }} className={styles.btnPrimary}>Cadastre-se</button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroBlob1} />
        <div className={styles.heroBlob2} />

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Plataforma de Gestão Condominial
            </div>
            <h1 className={styles.heroTitle}>
              Sua administração em uma{' '}
              <span className={styles.gradientText}>plataforma digital</span>{' '}
              profissional
            </h1>
            <p className={styles.heroDesc}>
              Os moradores sabem o que você faz pelo condomínio? Não basta fazer — mostre tudo o que você realiza!
            </p>
            <p className={styles.heroDescLight}>
              Desenvolvemos, sem nenhum custo adicional, funções sob medida de acordo com a sua necessidade.
            </p>
            <div className={styles.heroCtas}>
              <button onClick={() => navigate('/demo')} className={styles.btnPrimaryLg}>
                Ver Demo
                <ArrowRight size={20} />
              </button>
              <button onClick={() => navigate('/login')} className={styles.btnOutlineLg}>
                Entrar no Sistema
              </button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <div className={styles.heroStatValue}>38+</div>
                <div className={styles.heroStatLabel}>Categorias</div>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <div className={styles.heroStatValue}>4</div>
                <div className={styles.heroStatLabel}>Perfis de acesso</div>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <div className={styles.heroStatValue}>∞</div>
                <div className={styles.heroStatLabel}>Edições</div>
              </div>
            </div>
          </div>

          <div className={styles.heroPreview}>
            <div className={styles.previewGlow} />
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div className={styles.previewHeaderLeft}>
                  <div className={styles.previewAvatar}>JF</div>
                  <div>
                    <div className={styles.previewCondName}>Residencial Jardim das Flores</div>
                    <div className={styles.previewEdition}>Edição #3 · Março 2026</div>
                  </div>
                </div>
                <div className={styles.previewBadge}>AS</div>
              </div>
              <div className={styles.previewTitle}>Condomínio em Destaque</div>
              <div className={styles.previewSubtitle}>Confira as novidades e realizações deste mês</div>
              <div className={styles.previewItems}>
                {['Prestação de Contas', 'Obras em Andamento', 'Eventos do Mês', 'Classificados'].map((item, i) => (
                  <div key={i} className={styles.previewItem}>
                    <div className={styles.previewItemNum}>{i + 1}</div>
                    <span>{item}</span>
                    <ChevronRight size={16} className={styles.previewItemArrow} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className={styles.sectionAlt} ref={funcRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tudo que você precisa em um só lugar</h2>
            <p className={styles.sectionDesc}>Funcionalidades pensadas para facilitar a comunicação entre administração e moradores</p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((item, i) => (
              <div key={i} className={`${styles.featureCard} ${styles.fadeUp}`} style={{ transitionDelay: `${i * 50}ms` }}>
                <div className={styles.featureIcon}>{item.icon}</div>
                <h3 className={styles.featureTitle}>{item.title}</h3>
                <p className={styles.featureDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="categorias" className={styles.section} ref={catRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>38 Categorias Prontas</h2>
            <p className={styles.sectionDesc}>O síndico ou administradora seleciona os cards que deseja e alimenta com suas informações</p>
          </div>
          <div className={styles.categoriesGrid}>
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div key={i} className={`${styles.categoryCard} ${styles.fadeUp}`} style={{ transitionDelay: `${i * 30}ms` }}>
                  <div className={styles.categoryIcon} style={{ backgroundColor: cat.color }}>
                    <Icon size={20} color="#fff" />
                  </div>
                  <h3 className={styles.categoryName}>{cat.name}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perfis */}
      <section className={styles.sectionAlt} ref={perfisRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>4 Perfis de Acesso</h2>
            <p className={styles.sectionDesc}>Cada perfil tem seu nível de acesso e funcionalidades específicas</p>
          </div>
          <div className={styles.profilesGrid}>
            {profiles.map((item, i) => (
              <div key={i} className={`${styles.profileCard} ${styles.fadeUp}`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={styles.profileBar} style={{ backgroundColor: item.color }} />
                <div className={styles.profileBody}>
                  <div className={styles.profileIcon}>{item.icon}</div>
                  <h3 className={styles.profileRole}>{item.role}</h3>
                  <ul className={styles.profileFeatures}>
                    {item.features.map((f, j) => (
                      <li key={j}>
                        <CheckCircle2 size={16} color={item.color} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className={styles.section} ref={planosRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Planos Simples e Transparentes</h2>
            <p className={styles.sectionDesc}>Escolha o plano ideal para o seu perfil</p>
          </div>
          <div className={styles.plansGrid}>
            {plans.map((plan, i) => (
              <div key={i} className={`${styles.planCard} ${styles.fadeUp} ${plan.popular ? styles.planPopular : ''}`} style={{ transitionDelay: `${i * 100}ms` }}>
                {plan.popular && <div className={styles.planBadge}>POPULAR</div>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.planPrice}>
                  <span className={styles.planCurrency}>R$</span>
                  <span className={styles.planValue}>{plan.price}</span>
                  <span className={styles.planPeriod}>/mês</span>
                </div>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f, j) => (
                    <li key={j}>
                      <CheckCircle2 size={18} color="#10B981" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/cadastro')}
                  className={plan.popular ? styles.btnGold : styles.btnPrimary}
                >
                  Começar Agora
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecossistema */}
      <section className={styles.sectionEco} ref={ecoRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Conheça o ecossistema APP SÍNDICO</h2>
            <p className={styles.sectionDesc}>Outros sistemas da rede e a proposta comercial para parceiros que querem escalar conosco.</p>
          </div>
          <div className={styles.ecoGrid}>
            {ecosystemApps.map((app, i) => (
              <div key={i} className={`${styles.ecoCard} ${styles.fadeUp}`} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className={styles.ecoIconBox}>
                  <span className={styles.ecoInitials}>{app.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                </div>
                <h3 className={styles.ecoName}>{app.name}</h3>
                <p className={styles.ecoDomain}>{app.domain}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.logo}>
                <img src={logoAppSindico} alt="App Síndico" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'contain' }} />
                <span className={styles.footerBrandName}>APP SÍNDICO</span>
              </div>
              <p className={styles.footerDesc}>
                Plataforma de gestão condominial completa. Revistas digitais, chamados, funcionários e muito mais.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <h4>Produto</h4>
              <ul>
                <li><a href="#funcionalidades">Funcionalidades</a></li>
                <li><a href="#categorias">Categorias</a></li>
                <li><a href="#planos">Planos</a></li>
                <li><button onClick={() => navigate('/demo')}>Demo</button></li>
              </ul>
            </div>
            <div className={styles.footerLinks}>
              <h4>Acesso</h4>
              <ul>
                <li><button onClick={() => navigate('/login')}>Entrar</button></li>
                <li><button onClick={() => navigate('/cadastro')}>Cadastre-se</button></li>
                <li><button onClick={() => navigate('/portal/login')}>Portal Morador</button></li>
              </ul>
            </div>
            <div className={styles.footerLinks}>
              <h4>Contato</h4>
              <ul>
                <li>www.appsindico.com.br</li>
                <li>contato@appsindico.com.br</li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            © 2026 APP SÍNDICO. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
