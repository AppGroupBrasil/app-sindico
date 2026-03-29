import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  demoEmployees as initialEmployees,
  demoBeforeAfterTasks,
  demoChecklistTasks,
  demoTaskListTasks,
  demoInspectionTasks,
  demoMaintenanceTasks,
} from './data/demo';
import type {
  Employee,
  EmployeeTask,
  EmployeeTaskType,
  EmployeeTaskStatus,
  EmployeeTaskPriority,
  BeforeAfterTask,
  ChecklistTask,
  TaskListTask,
  InspectionTask,
  MaintenanceTask,
  ChecklistItem,
  InspectionItem,
} from './types';
import './revista.css';

type Tab = 'painel' | 'criar' | 'relatorios' | 'equipe';
type CreateType = EmployeeTaskType | null;

const priorityColors: Record<EmployeeTaskPriority, string> = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

const statusColors: Record<EmployeeTaskStatus, string> = {
  aberto: 'bg-yellow-100 text-yellow-700',
  'em-execucao': 'bg-blue-100 text-blue-700',
  finalizado: 'bg-green-100 text-green-700',
  problema: 'bg-red-100 text-red-700',
};

const statusLabels: Record<EmployeeTaskStatus, string> = {
  aberto: 'Em Aberto',
  'em-execucao': 'Em Execução',
  finalizado: 'Finalizado',
  problema: 'Problema',
};

const typeLabels: Record<EmployeeTaskType, string> = {
  'antes-depois': '📸 Antes e Depois',
  checklist: '✅ Checklist',
  tarefa: '📋 Tarefa',
  vistoria: '🔍 Vistoria',
  manutencao: '🔧 Manutenção',
};

const typeIcons: Record<EmployeeTaskType, string> = {
  'antes-depois': '📸',
  checklist: '✅',
  tarefa: '📋',
  vistoria: '🔍',
  manutencao: '🔧',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function executionTime(start?: string, end?: string) {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const mins = Math.round((e - s) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}min` : ''}`;
}

export default function FuncionariosPage() {
  const [tab, setTab] = useState<Tab>('painel');
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [empForm, setEmpForm] = useState({ name: '', role: '', phone: '' });

  function getEmployeeName(id: string) {
    return employees.find(e => e.id === id)?.name ?? 'Desconhecido';
  }
  const [createType, setCreateType] = useState<CreateType>(null);
  const [filterStatus, setFilterStatus] = useState<EmployeeTaskStatus | 'todos'>('todos');
  const [filterType, setFilterType] = useState<EmployeeTaskType | 'todos'>('todos');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);

  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'media' as EmployeeTaskPriority,
    assignedTo: 'emp-001', type: 'tarefa' as EmployeeTaskType,
  });
  const [checklistItems, setChecklistItems] = useState<string[]>(['']);
  const [inspectionItems, setInspectionItems] = useState<string[]>(['']);
  const [taskCreated, setTaskCreated] = useState(false);

  const handleSaveEmployee = () => {
    if (!empForm.name.trim() || !empForm.role.trim()) return;
    if (editingEmployee) {
      setEmployees(prev => prev.map(e => e.id === editingEmployee.id ? { ...e, name: empForm.name, role: empForm.role, phone: empForm.phone } : e));
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: empForm.name,
        role: empForm.role,
        phone: empForm.phone,
        active: true,
      };
      setEmployees(prev => [...prev, newEmp]);
    }
    setEmpForm({ name: '', role: '', phone: '' });
    setEditingEmployee(null);
    setShowEmployeeForm(false);
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpForm({ name: emp.name, role: emp.role, phone: emp.phone });
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleEmployee = (id: string) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
  };

  const allTasks: EmployeeTask[] = useMemo(() => [
    ...demoBeforeAfterTasks,
    ...demoChecklistTasks,
    ...demoTaskListTasks,
    ...demoInspectionTasks,
    ...demoMaintenanceTasks,
  ], []);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(t => {
      if (filterStatus !== 'todos' && t.status !== filterStatus) return false;
      if (filterType !== 'todos' && t.type !== filterType) return false;
      return true;
    });
  }, [allTasks, filterStatus, filterType]);

  const stats = useMemo(() => ({
    total: allTasks.length,
    aberto: allTasks.filter(t => t.status === 'aberto').length,
    emExecucao: allTasks.filter(t => t.status === 'em-execucao').length,
    finalizado: allTasks.filter(t => t.status === 'finalizado').length,
    problema: allTasks.filter(t => t.status === 'problema').length,
  }), [allTasks]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskCreated(true);
  };

  const renderTaskDetail = (task: EmployeeTask) => {
    const emp = employees.find(e => e.id === task.assignedTo);

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F0]">
          <button onClick={() => setSelectedTask(null)} className="flex items-center gap-1 text-sm text-[#64748B] mb-3 hover:text-[#1E3A5F]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Voltar
          </button>
          <div className="flex items-start justify-between">
            <div>
              <span className="text-lg mr-2">{typeIcons[task.type]}</span>
              <h2 className="inline text-lg font-bold text-[#1E293B]">{task.title}</h2>
              <p className="text-sm text-[#64748B] mt-1">{task.description}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priorityColors[task.priority]}`}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
            </div>
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-[#E2E8F0] text-sm">
          <div>
            <span className="text-[#94A3B8] text-xs">Funcionário</span>
            <p className="font-medium text-[#1E293B]">{emp?.name ?? '—'}</p>
            <p className="text-xs text-[#64748B]">{emp?.role}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs">QR Code</span>
            <p className="font-mono font-medium text-[#1E3A5F]">{task.qrCode}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs">Início</span>
            <p className="font-medium text-[#1E293B]">{task.startedAt ? formatDateTime(task.startedAt) : 'Aguardando'}</p>
          </div>
          <div>
            <span className="text-[#94A3B8] text-xs">Tempo</span>
            <p className="font-medium text-[#1E293B]">{executionTime(task.startedAt, task.finishedAt)}</p>
          </div>
        </div>

        {task.location && (
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-2">📍 Geolocalização do Funcionário</h3>
            <div className="rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm" style={{ height: 200 }}>
              <iframe
                title="Localização do funcionário"
                width="100%" height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${task.location.lon - 0.005},${task.location.lat - 0.004},${task.location.lon + 0.005},${task.location.lat + 0.004}&layer=mapnik&marker=${task.location.lat},${task.location.lon}`}
              />
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">Última atualização: {formatDateTime(task.location.timestamp)}</p>
          </div>
        )}

        {task.type === 'antes-depois' && renderBeforeAfter(task as BeforeAfterTask)}
        {task.type === 'checklist' && renderChecklist(task as ChecklistTask)}
        {task.type === 'tarefa' && renderTaskList(task as TaskListTask)}
        {task.type === 'vistoria' && renderInspection(task as InspectionTask)}
        {task.type === 'manutencao' && renderMaintenance(task as MaintenanceTask)}
      </motion.div>
    );
  };

  const renderBeforeAfter = (task: BeforeAfterTask) => (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">📸 Comparativo Antes e Depois</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="inline-block px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">ANTES</span>
          {task.photoBefore ? (
            <img src={task.photoBefore} alt="Antes" className="w-full h-40 object-cover rounded-xl border border-[#E2E8F0]" />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-[#94A3B8] text-sm">Aguardando foto</div>
          )}
          <p className="text-xs text-[#64748B]">{task.descriptionBefore || 'Sem descrição'}</p>
        </div>
        <div className="space-y-2">
          <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-xs font-semibold rounded-full">DEPOIS</span>
          {task.photoAfter ? (
            <img src={task.photoAfter} alt="Depois" className="w-full h-40 object-cover rounded-xl border border-[#E2E8F0]" />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-xl flex items-center justify-center text-[#94A3B8] text-sm">Aguardando foto</div>
          )}
          <p className="text-xs text-[#64748B]">{task.descriptionAfter || 'Sem descrição'}</p>
        </div>
      </div>
    </div>
  );

  const renderChecklist = (task: ChecklistTask) => (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">✅ Itens do Checklist</h3>
      <div className="space-y-2">
        {task.items.map((item: ChecklistItem) => (
          <div key={item.id} className={`p-3 rounded-xl border ${item.problemReported ? 'border-red-200 bg-red-50' : item.checked ? 'border-green-200 bg-green-50' : 'border-[#E2E8F0]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.checked ? (
                  <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                ) : item.problemReported ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-[#CBD5E1]" />
                )}
                <span className={`text-sm ${item.checked ? 'text-green-700' : item.problemReported ? 'text-red-700' : 'text-[#1E293B]'}`}>{item.text}</span>
              </div>
              {item.problemReported && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">Problema</span>}
            </div>
            {item.problemReported && (
              <div className="mt-2 ml-7 space-y-1">
                {item.problemPhoto && <img src={item.problemPhoto} alt="Problema" className="w-full h-28 object-cover rounded-lg border border-red-200" />}
                {item.problemDescription && <p className="text-xs text-red-600">{item.problemDescription}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-[#64748B]">
        <span>✅ {task.items.filter((i: ChecklistItem) => i.checked).length}/{task.items.length} concluídos</span>
        <span>⚠️ {task.items.filter((i: ChecklistItem) => i.problemReported).length} problemas</span>
      </div>
    </div>
  );

  const renderTaskList = (task: TaskListTask) => (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">📋 Detalhes da Tarefa</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {(['aberto', 'em-execucao', 'finalizado', 'problema'] as EmployeeTaskStatus[]).map(s => (
          <span key={s} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 ${task.status === s ? statusColors[s] + ' border-current' : 'border-[#E2E8F0] text-[#94A3B8]'}`}>
            {statusLabels[s]}
          </span>
        ))}
      </div>
      {task.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {task.photos.map((p: string, i: number) => (
            <img key={i} src={p} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-lg border border-[#E2E8F0]" />
          ))}
        </div>
      )}
      {task.problemPhoto && (
        <div className="p-3 bg-red-50 rounded-xl border border-red-200 mt-2">
          <span className="text-xs font-semibold text-red-600">⚠️ Problema Reportado</span>
          <img src={task.problemPhoto} alt="Problema" className="w-full h-28 object-cover rounded-lg mt-2 border border-red-200" />
          {task.problemDescription && <p className="text-xs text-red-600 mt-1">{task.problemDescription}</p>}
        </div>
      )}
    </div>
  );

  const renderInspection = (task: InspectionTask) => (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">🔍 Itens da Vistoria</h3>
      <div className="space-y-3">
        {task.items.map((item: InspectionItem) => (
          <div key={item.id} className={`p-3 rounded-xl border ${item.status === 'problema' ? 'border-red-200 bg-red-50' : item.status === 'ok' ? 'border-green-200 bg-green-50' : 'border-[#E2E8F0]'}`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {item.status === 'ok' ? (
                  <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                ) : item.status === 'problema' ? (
                  <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-[#CBD5E1]" />
                )}
                <span className="text-sm font-medium text-[#1E293B]">{item.label}</span>
              </div>
              <div className="flex gap-1">
                {!item.preset && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-semibold rounded-full">Livre</span>}
                <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${item.status === 'ok' ? 'bg-green-100 text-green-600' : item.status === 'problema' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                  {item.status === 'ok' ? 'OK' : item.status === 'problema' ? 'Problema' : 'Pendente'}
                </span>
              </div>
            </div>
            {item.photo && <img src={item.photo} alt={item.label} className="w-full h-28 object-cover rounded-lg mt-2 border border-[#E2E8F0]" />}
            {item.description && <p className="text-xs text-[#64748B] mt-1">{item.description}</p>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-[#64748B]">
        <span>✅ {task.items.filter((i: InspectionItem) => i.status === 'ok').length} OK</span>
        <span>⚠️ {task.items.filter((i: InspectionItem) => i.status === 'problema').length} Problemas</span>
        <span>⏳ {task.items.filter((i: InspectionItem) => i.status === 'pendente').length} Pendentes</span>
      </div>
    </div>
  );

  const maintenanceTypeLabels: Record<string, string> = {
    preventiva: '🛡️ Preventiva',
    corretiva: '🔧 Corretiva',
    emergencial: '🚨 Emergencial',
  };

  const renderMaintenance = (task: MaintenanceTask) => (
    <div className="p-5">
      <h3 className="text-sm font-semibold text-[#1E293B] mb-3">🔧 Detalhes da Manutenção</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Equipamento</p>
          <p className="text-sm font-medium text-[#1E293B]">{task.equipment}</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Área</p>
          <p className="text-sm font-medium text-[#1E293B]">{task.area}</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Tipo</p>
          <p className="text-sm font-medium text-[#1E293B]">{maintenanceTypeLabels[task.maintenanceType] || task.maintenanceType}</p>
        </div>
        <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">Funcionário</p>
          <p className="text-sm font-medium text-[#1E293B]">{initialEmployees.find(e => e.id === task.assignedTo)?.name || '—'}</p>
        </div>
      </div>
      {task.problemDescription && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1">Problema</p>
          <p className="text-sm text-red-700">{task.problemDescription}</p>
          {task.problemPhoto && <img src={task.problemPhoto} alt="Problema" className="w-full h-28 object-cover rounded-lg mt-2 border border-red-200" />}
        </div>
      )}
      {task.resolution && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
          <p className="text-[10px] uppercase tracking-wider text-green-500 mb-1">Resolução</p>
          <p className="text-sm text-green-700">{task.resolution}</p>
        </div>
      )}
      {task.photos.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] mb-2">Fotos</p>
          <div className="flex gap-2 overflow-x-auto">
            {task.photos.map((photo, i) => (
              <img key={i} src={photo} alt={`Foto ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border border-[#E2E8F0] shrink-0" />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="revista-root min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A5A8F] text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/revista/painel" className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Painel
            </Link>
            <span className="text-xs bg-white/10 px-3 py-1 rounded-full">🏢 Residencial Jardim das Flores</span>
          </div>
          <h1 className="text-2xl font-bold">👷 Gestão de Funcionários</h1>
          <p className="text-white/70 text-sm mt-1">Crie tarefas, acompanhe em tempo real e gere relatórios</p>

          <div className="grid grid-cols-5 gap-3 mt-5">
            {[
              { label: 'Total', value: stats.total, color: 'bg-white/10' },
              { label: 'Em Aberto', value: stats.aberto, color: 'bg-yellow-500/20' },
              { label: 'Em Execução', value: stats.emExecucao, color: 'bg-blue-500/20' },
              { label: 'Finalizados', value: stats.finalizado, color: 'bg-green-500/20' },
              { label: 'Problemas', value: stats.problema, color: 'bg-red-500/20' },
            ].map(s => (
              <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm -mt-4 border border-[#E2E8F0]">
          {([
            { key: 'painel' as Tab, label: '📋 Painel de Tarefas' },
            { key: 'criar' as Tab, label: '➕ Criar Tarefa' },
            { key: 'relatorios' as Tab, label: '📊 Relatórios' },
            { key: 'equipe' as Tab, label: '👷 Equipe' },
          ]).map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedTask(null); setTaskCreated(false); }} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === t.key ? 'bg-[#1E3A5F] text-white shadow-md' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          <AnimatePresence mode="wait">
            {/* ==================== PAINEL ==================== */}
            {tab === 'painel' && (
              <motion.div key="painel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {selectedTask ? (
                  renderTaskDetail(allTasks.find(t => t.id === selectedTask)!)
                ) : (
                  <>
                    <div className="flex flex-wrap gap-3 mb-5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B]">Status:</span>
                        <div className="flex gap-1">
                          {([['todos', 'Todos'], ['aberto', 'Em Aberto'], ['em-execucao', 'Em Execução'], ['finalizado', 'Finalizado'], ['problema', 'Problema']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => setFilterStatus(v)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterStatus === v ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#64748B]">Tipo:</span>
                        <div className="flex gap-1">
                          {([['todos', '🗂 Todos'], ['antes-depois', '📸'], ['checklist', '✅'], ['tarefa', '📋'], ['vistoria', '🔍'], ['manutencao', '🔧']] as const).map(([v, l]) => (
                            <button key={v} onClick={() => setFilterType(v)} className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterType === v ? 'bg-[#1E3A5F] text-white' : 'bg-white text-[#64748B] border border-[#E2E8F0]'}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredTasks.length === 0 ? (
                        <div className="text-center py-12 text-[#94A3B8]">
                          <p className="text-4xl mb-2">📭</p>
                          <p className="text-sm">Nenhuma tarefa encontrada com esses filtros</p>
                        </div>
                      ) : filteredTasks.map(task => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all cursor-pointer"
                          onClick={() => setSelectedTask(task.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span>{typeIcons[task.type]}</span>
                                <h3 className="font-semibold text-[#1E293B] text-sm truncate">{task.title}</h3>
                              </div>
                              <p className="text-xs text-[#64748B] truncate">{task.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-[#94A3B8]">
                                <span>👤 {getEmployeeName(task.assignedTo)}</span>
                                <span>🕐 {task.startedAt ? formatDateTime(task.startedAt) : 'Aguardando'}</span>
                                {task.location && <span className="text-green-500">📍 GPS ativo</span>}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 ml-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShowQR(showQR === task.id ? null : task.id); }}
                                className="mt-1 px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[10px] text-[#1E3A5F] font-mono hover:bg-[#E2E8F0]"
                              >
                                QR: {task.qrCode}
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {showQR === task.id && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-4">
                                  <div className="w-24 h-24 bg-[#F1F5F9] rounded-xl flex items-center justify-center border-2 border-dashed border-[#CBD5E1]">
                                    <div className="text-center">
                                      <p className="text-3xl">📱</p>
                                      <p className="text-[8px] text-[#94A3B8] mt-0.5">QR Code</p>
                                    </div>
                                  </div>
                                  <div className="text-xs text-[#64748B] space-y-1">
                                    <p className="font-mono font-semibold text-[#1E3A5F]">{task.qrCode}</p>
                                    <p>Funcionário escaneia este código para iniciar a tarefa</p>
                                    <p className="text-[#94A3B8]">URL: /revista/funcionarios/tarefa/{task.qrCode}</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ==================== CRIAR TAREFA ==================== */}
            {tab === 'criar' && (
              <motion.div key="criar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {taskCreated ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl border border-green-200 p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">✅</span>
                    </div>
                    <h2 className="text-xl font-bold text-[#1E293B] mb-2">Tarefa Criada com Sucesso!</h2>
                    <p className="text-sm text-[#64748B] mb-4">QR Code gerado: <span className="font-mono font-semibold text-[#1E3A5F]">FUNC-{newTask.type.toUpperCase().slice(0, 3)}-{String(Math.floor(Math.random() * 900) + 100)}</span></p>
                    <div className="w-32 h-32 bg-[#F1F5F9] rounded-xl flex items-center justify-center border-2 border-dashed border-[#CBD5E1] mx-auto mb-4">
                      <div className="text-center">
                        <p className="text-5xl">📱</p>
                        <p className="text-xs text-[#94A3B8] mt-1">QR Code</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#94A3B8] mb-5">Imprima ou compartilhe o QR Code com o funcionário</p>
                    <button onClick={() => { setTaskCreated(false); setNewTask({ title: '', description: '', priority: 'media', assignedTo: 'emp-001', type: 'tarefa' }); setChecklistItems(['']); setInspectionItems(['']); }} className="px-6 py-2.5 bg-[#1E3A5F] text-white rounded-xl font-medium hover:bg-[#2A5A8F] transition-all">
                      Criar Nova Tarefa
                    </button>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                    <h2 className="text-lg font-bold text-[#1E293B] mb-1">Nova Tarefa para Funcionário</h2>
                    <p className="text-xs text-[#94A3B8] mb-6">Crie a tarefa e um QR Code será gerado automaticamente</p>

                    <form onSubmit={handleCreateTask} className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-2">Tipo de Tarefa</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {([
                            { type: 'antes-depois' as EmployeeTaskType, icon: '📸', label: 'Antes e Depois', desc: 'Comparativo com fotos' },
                            { type: 'checklist' as EmployeeTaskType, icon: '✅', label: 'Checklist', desc: 'Lista de verificação' },
                            { type: 'tarefa' as EmployeeTaskType, icon: '📋', label: 'Tarefa', desc: 'Execução com status' },
                            { type: 'vistoria' as EmployeeTaskType, icon: '🔍', label: 'Vistoria', desc: 'Inspeção com fotos' },
                            { type: 'manutencao' as EmployeeTaskType, icon: '🔧', label: 'Manutenção', desc: 'Equipamentos e reparos' },
                          ]).map(t => (
                            <button
                              key={t.type} type="button"
                              onClick={() => setNewTask(p => ({ ...p, type: t.type }))}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${newTask.type === t.type ? 'border-[#1E3A5F] bg-[#1E3A5F]/5' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
                            >
                              <span className="text-2xl">{t.icon}</span>
                              <p className="text-sm font-semibold text-[#1E293B] mt-1">{t.label}</p>
                              <p className="text-[10px] text-[#94A3B8]">{t.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Título</label>
                        <input type="text" required value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Ex: Limpeza da piscina" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Descrição / Instruções</label>
                        <textarea required value={newTask.description} onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" placeholder="Descreva em detalhes o que deve ser feito..." />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Prioridade</label>
                          <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as EmployeeTaskPriority }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                            <option value="baixa">🟢 Baixa</option>
                            <option value="media">🔵 Média</option>
                            <option value="alta">🟠 Alta</option>
                            <option value="urgente">🔴 Urgente</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Funcionário Responsável</label>
                          <select value={newTask.assignedTo} onChange={e => setNewTask(p => ({ ...p, assignedTo: e.target.value }))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                            {employees.filter(e => e.active).map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} — {emp.role}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {newTask.type === 'checklist' && (
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-2">Itens do Checklist</label>
                          <div className="space-y-2">
                            {checklistItems.map((item, i) => (
                              <div key={i} className="flex gap-2">
                                <input type="text" value={item} onChange={e => { const arr = [...checklistItems]; arr[i] = e.target.value; setChecklistItems(arr); }} className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder={`Item ${i + 1}`} />
                                {checklistItems.length > 1 && (
                                  <button type="button" onClick={() => setChecklistItems(checklistItems.filter((_, j) => j !== i))} className="px-2 text-red-400 hover:text-red-600">✕</button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => setChecklistItems([...checklistItems, ''])} className="text-xs text-[#1E3A5F] font-medium hover:underline">+ Adicionar item</button>
                          </div>
                        </div>
                      )}

                      {newTask.type === 'vistoria' && (
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-2">Itens Pré-determinados da Vistoria</label>
                          <div className="space-y-2">
                            {inspectionItems.map((item, i) => (
                              <div key={i} className="flex gap-2">
                                <input type="text" value={item} onChange={e => { const arr = [...inspectionItems]; arr[i] = e.target.value; setInspectionItems(arr); }} className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder={`Item ${i + 1} (ex: Piscina — estado da água)`} />
                                {inspectionItems.length > 1 && (
                                  <button type="button" onClick={() => setInspectionItems(inspectionItems.filter((_, j) => j !== i))} className="px-2 text-red-400 hover:text-red-600">✕</button>
                                )}
                              </div>
                            ))}
                            <button type="button" onClick={() => setInspectionItems([...inspectionItems, ''])} className="text-xs text-[#1E3A5F] font-medium hover:underline">+ Adicionar item</button>
                          </div>
                          <p className="text-[10px] text-[#94A3B8] mt-2">O funcionário também poderá adicionar itens livre durante a vistoria</p>
                        </div>
                      )}

                      <button type="submit" className="w-full py-3 bg-linear-to-r from-[#1E3A5F] to-[#2A5A8F] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                        Criar Tarefa e Gerar QR Code
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}

            {/* ==================== RELATÓRIOS ==================== */}
            {tab === 'relatorios' && (
              <motion.div key="relatorios" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { icon: '📸', label: 'Antes/Depois', count: demoBeforeAfterTasks.length, color: 'from-purple-500 to-purple-600' },
                    { icon: '✅', label: 'Checklists', count: demoChecklistTasks.length, color: 'from-emerald-500 to-emerald-600' },
                    { icon: '📋', label: 'Tarefas', count: demoTaskListTasks.length, color: 'from-blue-500 to-blue-600' },
                    { icon: '🔍', label: 'Vistorias', count: demoInspectionTasks.length, color: 'from-orange-500 to-orange-600' },
                    { icon: '🔧', label: 'Manutenções', count: demoMaintenanceTasks.length, color: 'from-slate-500 to-slate-600' },
                  ]).map(c => (
                    <div key={c.label} className={`bg-linear-to-br ${c.color} rounded-xl p-4 text-white`}>
                      <span className="text-2xl">{c.icon}</span>
                      <p className="text-2xl font-bold mt-1">{c.count}</p>
                      <p className="text-xs text-white/70">{c.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                  <div className="p-5 border-b border-[#E2E8F0]">
                    <h2 className="text-lg font-bold text-[#1E293B]">📊 Relatório Detalhado de Tarefas</h2>
                    <p className="text-xs text-[#94A3B8]">Histórico completo de execução</p>
                  </div>

                  <div className="divide-y divide-[#E2E8F0]">
                    {allTasks.map(task => {
                      const emp = employees.find(e => e.id === task.assignedTo);
                      return (
                        <div key={task.id} className="p-4 hover:bg-[#F8FAFC] transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span>{typeIcons[task.type]}</span>
                                <h3 className="font-semibold text-sm text-[#1E293B] truncate">{task.title}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[task.status]}`}>{statusLabels[task.status]}</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 mt-2 text-xs">
                                <div>
                                  <span className="text-[#94A3B8]">Funcionário:</span>
                                  <p className="font-medium text-[#1E293B]">{emp?.name} <span className="text-[#94A3B8]">({emp?.role})</span></p>
                                </div>
                                <div>
                                  <span className="text-[#94A3B8]">Prioridade:</span>
                                  <p><span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span></p>
                                </div>
                                <div>
                                  <span className="text-[#94A3B8]">Início:</span>
                                  <p className="font-medium text-[#1E293B]">{task.startedAt ? formatDateTime(task.startedAt) : '—'}</p>
                                </div>
                                <div>
                                  <span className="text-[#94A3B8]">Conclusão:</span>
                                  <p className="font-medium text-[#1E293B]">{task.finishedAt ? formatDateTime(task.finishedAt) : '—'}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-xs text-[#64748B]">
                                <span>⏱ Tempo: <strong>{executionTime(task.startedAt, task.finishedAt)}</strong></span>
                                <span>📍 GPS: {task.location ? <span className="text-green-600">Registrado</span> : <span className="text-[#94A3B8]">N/A</span>}</span>
                                <span className="font-mono text-[#94A3B8]">QR: {task.qrCode}</span>
                              </div>

                              {task.type === 'checklist' && (() => {
                                const t = task as ChecklistTask;
                                const done = t.items.filter((i: ChecklistItem) => i.checked).length;
                                const problems = t.items.filter((i: ChecklistItem) => i.problemReported).length;
                                return (
                                  <div className="mt-2">
                                    <div className="flex items-center gap-2 text-xs">
                                      <div className="flex-1 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(done / t.items.length) * 100}%` }} />
                                      </div>
                                      <span className="text-[#64748B]">{done}/{t.items.length}</span>
                                      {problems > 0 && <span className="text-red-500">⚠️ {problems}</span>}
                                    </div>
                                  </div>
                                );
                              })()}

                              {task.type === 'vistoria' && (() => {
                                const t = task as InspectionTask;
                                const ok = t.items.filter((i: InspectionItem) => i.status === 'ok').length;
                                const problems = t.items.filter((i: InspectionItem) => i.status === 'problema').length;
                                return (
                                  <div className="mt-2 text-xs">
                                    <span className="text-green-600">✅ {ok} OK</span>
                                    {problems > 0 && <span className="text-red-500 ml-3">⚠️ {problems} Problemas</span>}
                                    <span className="text-[#94A3B8] ml-3">Total: {t.items.length} itens</span>
                                  </div>
                                );
                              })()}
                            </div>

                            <button onClick={() => { setTab('painel'); setSelectedTask(task.id); }} className="ml-3 px-3 py-1.5 bg-[#F1F5F9] text-[#1E3A5F] text-xs font-medium rounded-lg hover:bg-[#E2E8F0] transition-all whitespace-nowrap">
                              Ver detalhes →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                  <div className="p-5 border-b border-[#E2E8F0]">
                    <h2 className="text-lg font-bold text-[#1E293B]">👷 Desempenho por Funcionário</h2>
                  </div>
                  <div className="divide-y divide-[#E2E8F0]">
                    {employees.map(emp => {
                      const empTasks = allTasks.filter(t => t.assignedTo === emp.id);
                      const done = empTasks.filter(t => t.status === 'finalizado').length;
                      const inProgress = empTasks.filter(t => t.status === 'em-execucao').length;
                      const problems = empTasks.filter(t => t.status === 'problema').length;
                      return (
                        <div key={emp.id} className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1E3A5F] to-[#2A5A8F] flex items-center justify-center text-white font-bold text-sm">
                            {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-[#1E293B]">{emp.name}</p>
                            <p className="text-xs text-[#64748B]">{emp.role} · {emp.phone}</p>
                          </div>
                          <div className="flex gap-3 text-xs">
                            <div className="text-center">
                              <p className="font-bold text-[#1E293B]">{empTasks.length}</p>
                              <p className="text-[#94A3B8]">Total</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-green-600">{done}</p>
                              <p className="text-[#94A3B8]">Feitas</p>
                            </div>
                            <div className="text-center">
                              <p className="font-bold text-blue-600">{inProgress}</p>
                              <p className="text-[#94A3B8]">Em and.</p>
                            </div>
                            {problems > 0 && (
                              <div className="text-center">
                                <p className="font-bold text-red-500">{problems}</p>
                                <p className="text-[#94A3B8]">Probl.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== EQUIPE ==================== */}
            {tab === 'equipe' && (
              <motion.div key="equipe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#1E293B]">👷 Equipe de Funcionários</h2>
                    <p className="text-xs text-[#94A3B8]">{employees.length} funcionário(s) cadastrado(s)</p>
                  </div>
                  <button
                    onClick={() => { setEditingEmployee(null); setEmpForm({ name: '', role: '', phone: '' }); setShowEmployeeForm(true); }}
                    className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#2A5A8F] transition-all shadow-md"
                  >
                    ➕ Novo Funcionário
                  </button>
                </div>

                {showEmployeeForm && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-lg">
                    <h3 className="text-base font-bold text-[#1E293B] mb-4">{editingEmployee ? '✏️ Editar Funcionário' : '➕ Cadastrar Funcionário'}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Nome *</label>
                        <input type="text" value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Cargo *</label>
                        <input type="text" value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))} placeholder="Ex: Zelador, Porteiro" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Telefone</label>
                        <input type="text" value={empForm.phone} onChange={e => setEmpForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999-9999" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={handleSaveEmployee} className="px-5 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-xl hover:bg-[#2A5A8F] transition-all">
                        {editingEmployee ? 'Salvar Alterações' : 'Cadastrar'}
                      </button>
                      <button onClick={() => { setShowEmployeeForm(false); setEditingEmployee(null); setEmpForm({ name: '', role: '', phone: '' }); }} className="px-5 py-2 bg-[#F1F5F9] text-[#64748B] text-sm font-medium rounded-xl hover:bg-[#E2E8F0] transition-all">
                        Cancelar
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
                  <div className="divide-y divide-[#E2E8F0]">
                    {employees.map(emp => (
                      <div key={emp.id} className={`p-4 flex items-center gap-4 transition-colors ${!emp.active ? 'opacity-50 bg-gray-50' : 'hover:bg-[#F8FAFC]'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base ${emp.active ? 'bg-linear-to-br from-[#1E3A5F] to-[#2A5A8F]' : 'bg-gray-400'}`}>
                          {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#1E293B]">{emp.name}</p>
                          <p className="text-xs text-[#64748B]">{emp.role} · {emp.phone}</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${emp.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {emp.active ? '✅ Ativo' : '⏸ Inativo'}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleToggleEmployee(emp.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${emp.active ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                            {emp.active ? '⏸ Desativar' : '▶ Ativar'}
                          </button>
                          <button onClick={() => handleEditEmployee(emp)} className="px-3 py-1.5 bg-[#F1F5F9] text-[#1E3A5F] rounded-lg text-xs font-medium hover:bg-[#E2E8F0] transition-all">
                            ✏️ Editar
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-all">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}

                    {employees.length === 0 && (
                      <div className="p-8 text-center text-[#94A3B8]">
                        <p className="text-3xl mb-2">👷</p>
                        <p className="text-sm">Nenhum funcionário cadastrado</p>
                        <p className="text-xs mt-1">Clique em &quot;Novo Funcionário&quot; para começar</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
