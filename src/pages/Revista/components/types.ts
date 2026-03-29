import { MagazineSection } from '../types';
import { Category } from '../types';
import { Condominium, MagazineEdition } from '../types';

export interface ViewModeProps {
  edition: MagazineEdition;
  condo: Condominium;
  sections: MagazineSection[];
  categories: Category[];
  getCategoryInfo: (catId: string) => Category | undefined;
}

export type ViewMode = 'flip' | 'scroll' | 'grid' | 'stories' | 'newspaper' | 'slides' | 'timeline' | 'elegante';

export const viewModeLabels: Record<ViewMode, { icon: string; label: string; description: string; style: string }> = {
  flip:      { icon: '📖', label: 'Revista Clássica',   description: 'Passe as páginas como uma revista de verdade com animação 3D', style: 'Tradicional' },
  scroll:    { icon: '📜', label: 'Rolagem Elegante',    description: 'Leitura contínua e fluida com sumário interativo', style: 'Leitura fluida' },
  grid:      { icon: '🃏', label: 'Mosaico de Cards',    description: 'Grade visual com cards clicáveis e galeria de fotos', style: 'Visual' },
  stories:   { icon: '📱', label: 'Stories',             description: 'Estilo Instagram Stories com timer automático', style: 'Social' },
  newspaper: { icon: '📰', label: 'Jornal',              description: 'Layout clássico de jornal com colunas e manchetes', style: 'Jornalístico' },
  slides:    { icon: '🎴', label: 'Apresentação',        description: 'Slides em tela cheia estilo PowerPoint com transições', style: 'Apresentação' },
  timeline:  { icon: '📋', label: 'Linha do Tempo',      description: 'Formato cronológico com linha vertical conectando seções', style: 'Cronológico' },
  elegante:  { icon: '🖼️', label: 'Editorial Premium',   description: 'Design editorial luxuoso com tipografia refinada', style: 'Premium' },
};

export interface ThemePreset {
  id: string;
  name: string;
  themeColor: string;
  accentColor: string;
  bgGradient: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
}

export const themePresets: ThemePreset[] = [
  { id: 'azul', name: 'Azul Profissional', themeColor: '#1E3A5F', accentColor: '#D4AF37', bgGradient: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)', cardBg: '#FFFFFF', textPrimary: '#1E293B', textSecondary: '#64748B' },
  { id: 'verde', name: 'Verde Natureza', themeColor: '#166534', accentColor: '#84CC16', bgGradient: 'linear-gradient(135deg, #052E16 0%, #14532D 50%, #052E16 100%)', cardBg: '#F0FDF4', textPrimary: '#14532D', textSecondary: '#4D7C0F' },
  { id: 'roxo', name: 'Roxo Premium', themeColor: '#581C87', accentColor: '#C084FC', bgGradient: 'linear-gradient(135deg, #2E1065 0%, #3B0764 50%, #2E1065 100%)', cardBg: '#FAF5FF', textPrimary: '#3B0764', textSecondary: '#7E22CE' },
  { id: 'dourado', name: 'Dourado Clássico', themeColor: '#78350F', accentColor: '#F59E0B', bgGradient: 'linear-gradient(135deg, #451A03 0%, #78350F 50%, #451A03 100%)', cardBg: '#FFFBEB', textPrimary: '#78350F', textSecondary: '#B45309' },
  { id: 'vermelho', name: 'Vermelho Moderno', themeColor: '#991B1B', accentColor: '#FB7185', bgGradient: 'linear-gradient(135deg, #450A0A 0%, #7F1D1D 50%, #450A0A 100%)', cardBg: '#FFF1F2', textPrimary: '#7F1D1D', textSecondary: '#DC2626' },
  { id: 'rosa', name: 'Rosa Elegante', themeColor: '#9D174D', accentColor: '#F9A8D4', bgGradient: 'linear-gradient(135deg, #500724 0%, #831843 50%, #500724 100%)', cardBg: '#FDF2F8', textPrimary: '#831843', textSecondary: '#BE185D' },
  { id: 'turquesa', name: 'Turquesa Tropical', themeColor: '#0E7490', accentColor: '#22D3EE', bgGradient: 'linear-gradient(135deg, #083344 0%, #155E75 50%, #083344 100%)', cardBg: '#ECFEFF', textPrimary: '#155E75', textSecondary: '#0891B2' },
  { id: 'grafite', name: 'Grafite Sofisticado', themeColor: '#1F2937', accentColor: '#9CA3AF', bgGradient: 'linear-gradient(135deg, #030712 0%, #111827 50%, #030712 100%)', cardBg: '#F9FAFB', textPrimary: '#111827', textSecondary: '#6B7280' },
];
