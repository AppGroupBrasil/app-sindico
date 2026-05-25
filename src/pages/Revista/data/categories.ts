import { Category } from '../types';

// Lista enxuta de 22 categorias essenciais (cortou redundâncias/encheção de linguiça)
export const categories: Category[] = [
  { id: 'recado-sindico', name: 'Recado do Síndico', description: 'Editorial, comentário do mês', icon: 'PenLine', color: '#6366F1' },
  { id: 'comunicados', name: 'Comunicados Oficiais', description: 'Avisos importantes do condomínio', icon: 'Megaphone', color: '#EF4444' },
  { id: 'obras-manutencao', name: 'Obras e Manutenção', description: 'O que está sendo feito no prédio', icon: 'HardHat', color: '#F97316' },
  { id: 'aquisicoes', name: 'Aquisições do Condomínio', description: 'Compras e investimentos recentes', icon: 'ShoppingCart', color: '#DC2626' },
  { id: 'antes-depois', name: 'Antes e Depois', description: 'Realizações, benfeitorias e reformas concluídas', icon: 'ArrowLeftRight', color: '#8B5CF6' },
  { id: 'nossa-equipe', name: 'Nossa Equipe', description: 'Funcionários, zeladoria e prestadores', icon: 'Users', color: '#EC4899' },
  { id: 'conheca-sindico', name: 'Conheça o Síndico', description: 'Apresentação e contato do síndico', icon: 'UserCheck', color: '#0891B2' },
  { id: 'dicas-sindico', name: 'Dicas do Síndico', description: 'Orientações e boas práticas', icon: 'Lightbulb', color: '#FBBF24' },
  { id: 'financeiro', name: 'Financeiro', description: 'Prestação de contas e indicadores', icon: 'DollarSign', color: '#10B981' },
  { id: 'eventos', name: 'Calendário de Eventos', description: 'Datas, festas e atividades', icon: 'Calendar', color: '#14B8A6' },
  { id: 'regras', name: 'Regras e Regulamento', description: 'Convivência e normas internas', icon: 'BookOpen', color: '#64748B' },
  { id: 'seguranca', name: 'Segurança', description: 'Orientações e ocorrências de segurança', icon: 'Shield', color: '#3B82F6' },
  { id: 'sustentabilidade', name: 'Sustentabilidade', description: 'Reciclagem, água, energia', icon: 'Leaf', color: '#22C55E' },
  { id: 'enquetes-avaliacoes', name: 'Enquetes e Avaliações', description: 'Pesquisas e opiniões dos moradores', icon: 'BarChart3', color: '#7C3AED' },
  { id: 'achados-perdidos', name: 'Achados e Perdidos', description: 'Itens encontrados ou perdidos', icon: 'Search', color: '#6B7280' },
  { id: 'classificados', name: 'Classificados', description: 'Anúncios entre moradores', icon: 'Tag', color: '#0EA5E9' },
  { id: 'caronas', name: 'Caronas Coletivas', description: 'Moradores oferecem carona', icon: 'Car', color: '#059669' },
  { id: 'mural-recados', name: 'Mural de Recados', description: 'Boas-vindas, agradecimentos, recados', icon: 'MessageSquare', color: '#FB923C' },
  { id: 'parceiros', name: 'Parceiros e Convênios', description: 'Empresas parceiras e publicidade local', icon: 'Wrench', color: '#2563EB' },
  { id: 'pets', name: 'Pets', description: 'Espaço para os bichinhos do condomínio', icon: 'Heart', color: '#D946EF' },
  { id: 'telefones-uteis', name: 'Telefones Úteis', description: 'Contatos importantes', icon: 'Phone', color: '#0EA5E9' },
  { id: 'galeria', name: 'Galeria de Fotos', description: 'Fotos diversas do condomínio', icon: 'Images', color: '#F59E0B' },
];
