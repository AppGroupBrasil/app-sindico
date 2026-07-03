// ============================================================
// APP REVISTA - Tipos Globais
// ============================================================

export type UserRole = 'master' | 'administradora' | 'sindico' | 'morador';

export type PlanType = 'sindico' | 'administradora';

export interface Plan {
  type: PlanType;
  name: string;
  price: number;
  features: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  companyLogo?: string;
  companyName?: string;
  createdAt: string;
}

export interface Condominium {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  sindicoId: string;
  administradoraId?: string;
  logo?: string;
  coverImage?: string;
  themeColor: string;
  accentColor: string;
  layout: 'classico' | 'moderno' | 'minimalista';
  activeCategories: string[];
  createdAt: string;
}

export interface MagazineEdition {
  id: string;
  condominiumId: string;
  title: string;
  editionNumber: number;
  month: string;
  year: number;
  status: 'rascunho' | 'revisao' | 'publicado';
  coverImage?: string;
  sections: MagazineSection[];
  createdAt: string;
  publishedAt?: string;
}

export interface MagazineSection {
  id: string;
  categoryId: string;
  title: string;
  content: string;
  images: string[];
  order: number;
  visible: boolean;
  richData?: {
    type: 'equipe-em-acao' | 'moradores-atendidos';
    items: any[];
    resumo?: { tempoMedio?: string; satisfacao?: string };
  };
}

export type CategoryId =
  | 'financeiro'
  | 'galeria'
  | 'antes-depois'
  | 'equipe'
  | 'obras'
  | 'comunicados'
  | 'eventos'
  | 'regras'
  | 'espaco-kids'
  | 'sustentabilidade'
  | 'seguranca'
  | 'pets'
  | 'saude'
  | 'classificados'
  | 'publicidade'
  | 'prestadores'
  | 'achados-perdidos'
  | 'enquetes'
  | 'dicas-sindico'
  | 'espaco-morador'
  | 'mural'
  | 'parceiros'
  | 'editorial'
  | 'caronas'
  | 'aquisicoes'
  | 'realizacoes'
  | 'semana-condominio'
  | 'conheca-sindico'
  | 'benfeitorias'
  | 'chamado-links'
  | 'capa-revista'
  | 'avaliacoes'
  | 'telefones-uteis'
  | 'qrcode-publico'
  | 'mural-qrcodes'
  | 'boas-vindas'
  | 'agendamento-mudancas'
  | 'agendamento-reformas'
  | 'gestao-funcionarios'
  | 'equipe-em-acao'
  | 'moradores-atendidos'
  | 'recado-sindico'
  | 'obras-manutencao'
  | 'nossa-equipe'
  | 'enquetes-avaliacoes'
  | 'mural-recados';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ResidentRequest {
  id: string;
  trackingCode: string;
  condominiumId: string;
  residentName: string;
  residentEmail: string;
  residentUnit: string;
  type: 'reclamacao' | 'manutencao' | 'ocorrencia' | 'sugestao' | 'classificado' | 'carona';
  title: string;
  description: string;
  images: string[];
  status: 'aberto' | 'em-andamento' | 'resolvido' | 'fechado';
  messages: RequestMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestMessage {
  id: string;
  author: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface Classified {
  id: string;
  condominiumId: string;
  residentName: string;
  residentUnit: string;
  title: string;
  description: string;
  price?: number;
  category: 'venda' | 'troca' | 'doacao' | 'servico';
  images: string[];
  phone: string;
  active: boolean;
  createdAt: string;
}

export interface CarpoolOffer {
  id: string;
  condominiumId: string;
  residentName: string;
  residentUnit: string;
  destination: string;
  departureTime: string;
  days: string[];
  seats: number;
  phone: string;
  active: boolean;
  createdAt: string;
}

// ============================================================
// GESTÃO DE FUNCIONÁRIOS
// ============================================================

export type EmployeeTaskType = 'antes-depois' | 'checklist' | 'tarefa' | 'vistoria' | 'manutencao';
export type EmployeeTaskStatus = 'aberto' | 'em-execucao' | 'finalizado' | 'problema';
export type EmployeeTaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  photo?: string;
  active: boolean;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  timestamp: string;
}

export interface EmployeeTask {
  id: string;
  condominiumId: string;
  type: EmployeeTaskType;
  title: string;
  description: string;
  priority: EmployeeTaskPriority;
  status: EmployeeTaskStatus;
  assignedTo: string; // Employee id
  qrCode: string;
  location?: GeoLocation;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeforeAfterTask extends EmployeeTask {
  type: 'antes-depois';
  photoBefore?: string;
  photoAfter?: string;
  descriptionBefore?: string;
  descriptionAfter?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  problemReported: boolean;
  problemPhoto?: string;
  problemDescription?: string;
}

export interface ChecklistTask extends EmployeeTask {
  type: 'checklist';
  items: ChecklistItem[];
}

export interface TaskListTask extends EmployeeTask {
  type: 'tarefa';
  photos: string[];
  problemPhoto?: string;
  problemDescription?: string;
}

export interface InspectionItem {
  id: string;
  label: string;
  preset: boolean; // pre-determined or free-form
  photo?: string;
  description?: string;
  status: 'pendente' | 'ok' | 'problema';
}

export interface InspectionTask extends EmployeeTask {
  type: 'vistoria';
  items: InspectionItem[];
}

export interface MaintenanceTask extends EmployeeTask {
  type: 'manutencao';
  equipment: string;
  area: string;
  maintenanceType: 'preventiva' | 'corretiva' | 'emergencial';
  photos: string[];
  problemPhoto?: string;
  problemDescription?: string;
  resolution?: string;
}

export interface EmployeeReport {
  taskId: string;
  taskType: EmployeeTaskType;
  title: string;
  assignedTo: string;
  employeeName: string;
  priority: EmployeeTaskPriority;
  status: EmployeeTaskStatus;
  location?: GeoLocation;
  startedAt?: string;
  finishedAt?: string;
  executionTimeMinutes?: number;
  createdAt: string;
}

export interface Advertisement {
  id: string;
  businessName: string;
  businessType: string;
  description: string;
  phone: string;
  email: string;
  image?: string;
  link?: string;
  condominiumIds: string[];
  active: boolean;
  startDate: string;
  endDate: string;
}
