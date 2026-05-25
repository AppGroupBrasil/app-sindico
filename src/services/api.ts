const API_BASE = import.meta.env.VITE_API_URL || '/api';

let authToken: string | null = localStorage.getItem('manutencao_token');
let isRedirecting = false; // Previne múltiplos redirects simultâneos

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('manutencao_token', token);
  } else {
    localStorage.removeItem('manutencao_token');
  }
}

export function getToken(): string | null {
  return authToken;
}

/* ── snake_case → camelCase (respostas da API) ── */
function toCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamel);
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  const out: any = {};
  for (const key of Object.keys(obj)) {
    const camel = key.replace(/_([a-z0-9])/gi, (_, c) => c.toUpperCase());
    out[camel] = toCamel(obj[key]);
  }
  return out;
}

/* ── camelCase → snake_case (envio para API) ── */
function toSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnake);
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  const out: any = {};
  for (const key of Object.keys(obj)) {
    const snake = key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
    out[snake] = toSnake(obj[key]);
  }
  return out;
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Timeout de 30s para evitar requests pendentes infinitos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Servidor demorou para responder. Tente novamente.');
    }
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    // Login retorna 401 para credenciais inválidas — não tratar como sessão expirada
    const isLoginRoute = path === '/auth/login' || path === '/auth/self-register';
    if (isLoginRoute) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Credenciais inválidas');
    }
    // Sessão expirada — redirect uma única vez
    if (!isRedirecting) {
      isRedirecting = true;
      const hadToken = !!authToken;
      setToken(null);
      if (hadToken) {
        window.location.href = '/login';
      }
      // Reset flag após 2s para permitir futuras navegações
      setTimeout(() => { isRedirecting = false; }, 2000);
    }
    throw new Error('Sessão expirada');
  }

  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.motivo || 'Acesso negado');
  }

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Muitas requisições. Aguarde alguns minutos.');
  }

  if (res.status >= 500) {
    throw new Error('Servidor temporariamente indisponível. Tente novamente em instantes.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  const json = await res.json();
  return toCamel(json) as T;
}

/* Wrapper para enviar body */
function post<T = any>(path: string, data: any) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(data) });
}
function put<T = any>(path: string, data: any) {
  return request<T>(path, { method: 'PUT', body: JSON.stringify(data) });
}
function patch<T = any>(path: string, data: any) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
}
function del<T = any>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

// ── Auth ──
export const auth = {
  login: (email: string, senha: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
  register: (data: { email: string; senha: string; nome: string; role: string; condominioId?: string; supervisorId?: string }) =>
    post('/auth/register', data),
  me: () => request('/auth/me'),
  changePassword: (senhaAtual: string, novaSenha: string) =>
    post('/auth/change-password', { senhaAtual, novaSenha }),
  selfRegister: (data: { email: string; senha: string; nome: string; telefone?: string }) =>
    request<{ message: string }>('/auth/self-register', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, novaSenha: string) =>
    request<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, novaSenha }) }),
};

// ── Generic CRUD factory ──
function crud<T = any>(basePath: string) {
  return {
    list: () => request<T[]>(basePath),
    get: (id: string) => request<T>(`${basePath}/${id}`),
    create: (data: Partial<T>) => post<T>(basePath, data),
    update: (id: string, data: Partial<T>) => put<T>(`${basePath}/${id}`, data),
    remove: (id: string) => del(`${basePath}/${id}`),
  };
}

// ── Entidades ──
export const condominios = {
  ...crud('/condominios'),
  patchStatus: (id: string, data: any) => patch(`/condominios/${id}/status`, data),
};
export const ordensServico = {
  ...crud('/ordens-servico'),
  list: (params?: { page?: number; pageSize?: number }) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return request<any>(`/ordens-servico${qs}`);
  },
  updateStatus: (id: string, status: string) => patch(`/ordens-servico/${id}/status`, { status }),
  avaliar: (id: string, nota: number, comentario?: string) => patch(`/ordens-servico/${id}/avaliacao`, { nota, comentario }),
};
export const checklists = {
  ...crud('/checklists'),
  updateItens: (id: string, data: any) => patch(`/checklists/${id}/itens`, data),
};
export const escalas = crud('/escalas');
export const materiais = {
  ...crud('/materiais'),
  listMovimentacoes: (id: string) => request<any[]>(`/materiais/${id}/movimentacoes`),
  addMovimentacao: (id: string, data: any) => post(`/materiais/${id}/movimentacoes`, data),
};
export const inspecoes = crud('/inspecoes');
export const vistorias = crud('/vistorias');
export const reportes = {
  ...crud('/reportes'),
  updateStatus: (id: string, status: string) => patch(`/reportes/${id}/status`, { status }),
};
export const tarefas = {
  ...crud('/tarefas'),
  listExecucoes: (id: string) => request<any[]>(`/tarefas/${id}/execucoes`),
  allExecucoes: () => request<any[]>('/tarefas/execucoes/all'),
  addExecucao: (id: string, data: any) => post(`/tarefas/${id}/execucoes`, data),
};
export const roteiros = {
  ...crud('/roteiros'),
  listExecucoes: (id: string) => request<any[]>(`/roteiros/${id}/execucoes`),
  addExecucao: (id: string, data: any) => post(`/roteiros/${id}/execucoes`, data),
};
export const qrcodes = {
  ...crud('/qrcodes'),
  leituras: () => request<any[]>('/qrcodes/leituras/all'),
  addLeitura: (data: any) => post('/qrcodes/leituras', data),
  listPonto: () => request<any[]>('/qrcodes/ponto/all'),
  addPonto: (data: any) => post('/qrcodes/ponto', data),
  listSla: () => request<any[]>('/qrcodes/sla/all'),
  createSla: (data: any) => post('/qrcodes/sla', data),
  updateSla: (id: string, status: string) => patch(`/qrcodes/sla/${id}`, { status }),
  getSupervisorPerm: () => request<{ autorizado: boolean }>('/qrcodes/supervisor-perm'),
  setSupervisorPerm: (autorizado: boolean) => put('/qrcodes/supervisor-perm', { autorizado }),
};
export const geolocalizacao = {
  list: (data?: string) => request<any[]>(`/geolocalizacao${data ? `?data=${data}` : ''}`),
  create: (data: any) => post('/geolocalizacao', data),
  registrarSaida: (id: string, tempoTotal: number) => patch(`/geolocalizacao/${id}/saida`, { tempoTotal }),
  listSla: () => request<any[]>('/geolocalizacao/sla'),
  createSla: (data: any) => post('/geolocalizacao/sla', data),
  updateSla: (id: string, status: string) => patch(`/geolocalizacao/sla/${id}`, { status }),
};
export const comunicados = crud('/comunicados');
export const moradores = {
  ...crud('/moradores'),
  listWhatsContatos: () => request<any[]>('/moradores/whatsapp-contatos'),
  addWhatsContato: (data: any) => post('/moradores/whatsapp-contatos', data),
  removeWhatsContato: (id: string) => del(`/moradores/whatsapp-contatos/${id}`),
};
export const vencimentos = {
  ...crud('/vencimentos'),
  getEmails: () => request<{ emails: string[] }>('/vencimentos/emails/global'),
  setEmails: (emails: string[]) => put('/vencimentos/emails/global', { emails }),
};
export const quadroAtividades = {
  ...crud('/quadro-atividades'),
  updateStatus: (id: string, status: string) => patch(`/quadro-atividades/${id}/status`, { status }),
};
export const usuarios = {
  ...crud('/usuarios'),
  list: async () => {
    const res = await request<any>('/usuarios');
    return Array.isArray(res) ? res : res.data ?? [];
  },
  bloquear: (id: string, bloqueado: boolean, motivo?: string) => patch(`/usuarios/${id}/bloquear`, { bloqueado, motivo }),
  resetSenha: (id: string, novaSenha: string) => patch(`/usuarios/${id}/reset-senha`, { novaSenha }),
};
export const configuracoes = {
  getTema: () => request('/configuracoes/tema'),
  setTema: (data: any) => put('/configuracoes/tema', data),
  getQuadroPermissoes: () => request('/configuracoes/quadro-permissoes'),
  setQuadroPermissoes: (data: any) => put('/configuracoes/quadro-permissoes', data),
};
export const permissoes = {
  list: () => request<any[]>('/permissoes'),
  update: (id: string, data: any) => put(`/permissoes/${id}`, data),
};
export const dashboard = {
  summary: () => request<any>('/dashboard/summary'),
  masterSummary: () => request<any>('/dashboard/master-summary'),
  masterUsers: () => request<any>('/dashboard/master-users'),
  masterReport: (params: { dataInicio?: string; dataFim?: string; statusPlano?: string }) => {
    const qs = new URLSearchParams();
    if (params.dataInicio) qs.set('dataInicio', params.dataInicio);
    if (params.dataFim) qs.set('dataFim', params.dataFim);
    if (params.statusPlano) qs.set('statusPlano', params.statusPlano);
    return request<any>(`/dashboard/master-report?${qs.toString()}`);
  },
};
export const qrChat = {
  list: (blocoId: string) => request<any[]>(`/qr-chat/${encodeURIComponent(blocoId)}`),
  send: (blocoId: string, data: { remetente: 'morador' | 'sindico'; remetenteNome: string; texto?: string; imagem?: string | null }) =>
    post<any>(`/qr-chat/${encodeURIComponent(blocoId)}`, data),
};

export const relatorios = {
  resumo: (params?: Record<string, string>) => {
    const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/relatorios/resumo${qs}`);
  },
};
export const checklistTemplates = {
  list: () => request<any[]>('/checklist-templates'),
  create: (data: any) => post('/checklist-templates', data),
  update: (id: string, data: any) => put(`/checklist-templates/${id}`, data),
  remove: (id: string) => del(`/checklist-templates/${id}`),
  usar: (id: string, data?: { condominioId?: string; local?: string; data?: string }) =>
    post(`/checklist-templates/${id}/usar`, data || {}),
};
export const laudos = {
  tipos: () => request<{ key: string; label: string }[]>('/laudos/tipos'),
  list: (params?: { condominioId?: string; status?: string; tipo?: string; vencendoEm?: number }) => {
    const qs = new URLSearchParams();
    if (params?.condominioId) qs.set('condominioId', params.condominioId);
    if (params?.status) qs.set('status', params.status);
    if (params?.tipo) qs.set('tipo', params.tipo);
    if (params?.vencendoEm != null) qs.set('vencendoEm', String(params.vencendoEm));
    const s = qs.toString();
    return request<any[]>(`/laudos${s ? '?' + s : ''}`);
  },
  resumo: () => request<any>('/laudos/resumo'),
  get: (id: string) => request<any>(`/laudos/${id}`),
  create: (data: any) => post('/laudos', data),
  update: (id: string, data: any) => put(`/laudos/${id}`, data),
  renovar: (id: string, data: any) => post(`/laudos/${id}/renovar`, data),
  remove: (id: string) => del(`/laudos/${id}`),
};
export const dashboardConsolidado = {
  get: () => request<any>('/dashboard-consolidado'),
};
export const notificacoes = {
  list: () => request<any[]>('/notificacoes'),
  unreadCount: () => request<{ count: number }>('/notificacoes/unread-count'),
  markRead: (id: string) => patch('/notificacoes/' + id + '/read', {}),
  markAllRead: () => post('/notificacoes/read-all', {}),
  remove: (id: string) => del('/notificacoes/' + id),
};
export const perfil = {
  get: () => request<any>('/perfil'),
  update: (data: { nome?: string; telefone?: string; cargo?: string }) => put('/perfil', data),
  changeSenha: (senhaAtual: string, novaSenha: string) => put('/perfil/senha', { senhaAtual, novaSenha }),
  updateAvatar: (avatarUrl: string) => put('/perfil/avatar', { avatarUrl }),
};
// ── Equipamentos ──
export const equipamentos = {
  ...crud('/equipamentos'),
  listHistorico: (id: string) => request<any[]>(`/equipamentos/${id}/historico`),
  addHistorico: (id: string, data: any) => post(`/equipamentos/${id}/historico`, data),
};

// ── Fornecedores ──
export const fornecedores = {
  ...crud('/fornecedores'),
  list: async () => {
    const res = await request<any>('/fornecedores');
    return Array.isArray(res) ? res : res.data ?? [];
  },
  listAvaliacoes: (id: string) => request<any[]>(`/fornecedores/${id}/avaliacoes`),
  addAvaliacao: (id: string, data: any) => post(`/fornecedores/${id}/avaliacoes`, data),
};

// ── Planos de Manutenção ──
export const planosManutencao = {
  ...crud('/planos-manutencao'),
  listExecucoes: (id: string) => request<any[]>(`/planos-manutencao/${id}/execucoes`),
  addExecucao: (id: string, data: any) => post(`/planos-manutencao/${id}/execucoes`, data),
  calendario: () => request<any[]>('/planos-manutencao/calendario/proximos'),
};

// ── Documentos Técnicos ──
export const documentos = {
  ...crud('/documentos'),
  resumo: () => request<any>('/documentos/resumo'),
};

// ── Solicitações (staff) ──
export const solicitacoes = {
  list: () => request<any[]>('/solicitacoes'),
  get: (id: string | number) => request<any>(`/solicitacoes/${id}`),
  resumo: () => request<any>('/solicitacoes/resumo'),
  responder: (id: string | number, data: { status: string; resposta?: string }) =>
    patch(`/solicitacoes/${id}/responder`, data),
  converterOS: (id: string | number) => patch(`/solicitacoes/${id}/converter-os`, {}),
};

// ── PDF ──
export const pdf = {
  ordemServico: (id: string) => {
    const url = `${API_BASE}/pdf/ordem-servico/${id}`;
    window.open(`${url}?token=${authToken}`, '_blank');
  },
  relatorioMensal: (mes?: string) => {
    const qs = mes ? `?mes=${mes}&token=${authToken}` : `?token=${authToken}`;
    window.open(`${API_BASE}/pdf/relatorio-mensal${qs}`, '_blank');
  },
};

// ── WhatsApp ──
export const whatsapp = {
  getConfig: (condominioId: string) => request<any>(`/whatsapp/config/${condominioId}`),
  saveConfig: (condominioId: string, data: any) => put(`/whatsapp/config/${condominioId}`, data),
  enviarMensagem: (data: any) => post('/whatsapp/enviar', data),
  mensagens: (condominioId: string) => request<any[]>(`/whatsapp/mensagens/${condominioId}`),
  testar: (condominioId: string) => post(`/whatsapp/testar/${condominioId}`, {}),
};

// ── Síndico ──
export const sindico = {
  resumo: () => request<any>('/sindico/resumo'),
  osPorCondominio: () => request<any[]>('/sindico/os-por-condominio'),
  evolucaoMensal: () => request<any[]>('/sindico/evolucao-mensal'),
};

// ── Calendário ──
export const calendario = {
  eventos: (mes?: string) => {
    const qs = mes ? `?mes=${mes}` : '';
    return request<any>(`/calendario${qs}`);
  },
};

// ── Exportação ──
export const exportar = {
  csv: (entidade: string, params?: Record<string, string>) => {
    const qs = params ? '&' + new URLSearchParams(params).toString() : '';
    const url = `${API_BASE}/export?entidade=${entidade}${qs}&token=${authToken}`;
    window.open(url, '_blank');
  },
};

// ── Contratos de Fornecedores ──
export const contratos = {
  ...crud('/contratos'),
  list: async () => {
    const res = await request<any>('/contratos');
    return Array.isArray(res) ? res : res.data ?? [];
  },
  resumo: () => request<any>('/contratos/resumo'),
};

// ── Push Notifications ──
export const push = {
  getVapidKey: () => request<{ key: string; enabled: boolean }>('/push/vapid-key'),
  subscribe: (subscription: any) => post('/push/subscribe', { subscription }),
  unsubscribe: (endpoint: string) => post('/push/unsubscribe', { endpoint }),
};

// ── Portal do Morador ──
const PORTAL_BASE = import.meta.env.VITE_API_URL || '/api';

let portalToken: string | null = localStorage.getItem('portal_token');

export function setPortalToken(token: string | null) {
  portalToken = token;
  if (token) localStorage.setItem('portal_token', token);
  else localStorage.removeItem('portal_token');
}

export function getPortalToken(): string | null {
  return portalToken;
}

async function portalRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (portalToken) headers['Authorization'] = `Bearer ${portalToken}`;

  const res = await fetch(`${PORTAL_BASE}/portal${path}`, { ...options, headers });

  if (res.status === 401) {
    const had = !!portalToken;
    setPortalToken(null);
    if (had) window.location.href = '/portal/login';
    throw new Error('Sessão expirada');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erro ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  const json = await res.json();
  return toCamel(json) as T;
}

function portalPost<T = any>(path: string, data: any) {
  return portalRequest<T>(path, { method: 'POST', body: JSON.stringify(data) });
}
function portalPut<T = any>(path: string, data: any) {
  return portalRequest<T>(path, { method: 'PUT', body: JSON.stringify(data) });
}

export const portal = {
  login: (email: string, senha: string) =>
    portalPost<{ token: string; morador: any }>('/login', { email, senha }),
  primeiroAcesso: (token: string, senha: string) =>
    portalPost<{ token: string; morador: any }>('/primeiro-acesso', { token, senha }),
  me: () => portalRequest<any>('/perfil'),
  updatePerfil: (data: any) => portalPut('/perfil', data),
  changeSenha: (senhaAtual: string, novaSenha: string) =>
    portalPut('/senha', { senha_atual: senhaAtual, nova_senha: novaSenha }),
  resumo: () => portalRequest<any>('/resumo'),
  comunicados: () => portalRequest<any[]>('/comunicados'),
  solicitacoes: () => portalRequest<any[]>('/solicitacoes'),
  getSolicitacao: (id: number) => portalRequest<any>(`/solicitacoes/${id}`),
  criarSolicitacao: (data: any) => portalPost('/solicitacoes', data),
};

// ── Upload ──
export const upload = {
  image: async (file: File, folder?: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    const res = await fetch(`${API_BASE}/upload/image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await res.json();
    return data.url;
  },
  avatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await res.json();
    return data.url;
  },
  document: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload/document`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: formData,
    });
    const data = await res.json();
    return data.url;
  },
};

export const revistas = {
  getByCondominio: (condominioId: string) => request<any>(`/revistas/${condominioId}`),
  updateCapa: (revistaId: string, data: any) => put(`/revistas/${revistaId}`, data),
  addPagina: (revistaId: string, data: any) => post(`/revistas/${revistaId}/paginas`, data),
  updatePagina: (paginaId: string, data: any) => put(`/revistas/paginas/${paginaId}`, data),
  removePagina: (paginaId: string) => del(`/revistas/paginas/${paginaId}`),
};
