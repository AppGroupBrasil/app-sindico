import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  demoEmployees,
  demoBeforeAfterTasks,
  demoChecklistTasks,
  demoTaskListTasks,
  demoInspectionTasks,
} from './data/demo';
import type {
  EmployeeTask,
  EmployeeTaskStatus,
  BeforeAfterTask,
  ChecklistTask,
  ChecklistItem,
  TaskListTask,
  InspectionTask,
  InspectionItem,
  GeoLocation,
} from './types';
import './revista.css';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const statusLabels: Record<EmployeeTaskStatus, string> = {
  aberto: '📂 Em Aberto',
  'em-execucao': '🔄 Em Execução',
  finalizado: '✅ Finalizado',
  problema: '⚠️ Problema',
};

export default function TarefaRevistaPage() {
  const { code = '' } = useParams<{ code: string }>();
  const [task, setTask] = useState<EmployeeTask | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [geoLocation, setGeoLocation] = useState<GeoLocation | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const startTimeRef = useRef<Date | null>(null);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [problemModal, setProblemModal] = useState<string | null>(null);
  const [problemDesc, setProblemDesc] = useState('');

  const [taskStatus, setTaskStatus] = useState<EmployeeTaskStatus>('aberto');
  const [reportProblem, setReportProblem] = useState(false);
  const [reportDesc, setReportDesc] = useState('');

  const [inspectionStatuses, setInspectionStatuses] = useState<Record<string, 'pendente' | 'ok' | 'problema'>>({});
  const [inspectionDescs, setInspectionDescs] = useState<Record<string, string>>({});
  const [freeFormItems, setFreeFormItems] = useState<{ id: string; label: string }[]>([]);
  const [newFreeItem, setNewFreeItem] = useState('');
  const [showFreeForm, setShowFreeForm] = useState(false);

  const [baDescription, setBaDescription] = useState('');

  useEffect(() => {
    if (!code) return;
    const allTasks: EmployeeTask[] = [
      ...demoBeforeAfterTasks,
      ...demoChecklistTasks,
      ...demoTaskListTasks,
      ...demoInspectionTasks,
    ];
    const found = allTasks.find(t => t.qrCode === code);
    if (found) {
      setTask(found);
      setTaskStatus(found.status);
      if (found.type === 'checklist') {
        const ck: Record<string, boolean> = {};
        (found as ChecklistTask).items.forEach((i: ChecklistItem) => { ck[i.id] = i.checked; });
        setCheckedItems(ck);
      }
      if (found.type === 'vistoria') {
        const st: Record<string, 'pendente' | 'ok' | 'problema'> = {};
        const ds: Record<string, string> = {};
        (found as InspectionTask).items.forEach((i: InspectionItem) => { st[i.id] = i.status; ds[i.id] = i.description ?? ''; });
        setInspectionStatuses(st);
        setInspectionDescs(ds);
      }
    } else {
      setNotFound(true);
    }
  }, [code]);

  useEffect(() => {
    if (!started || finished) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [started, finished]);

  useEffect(() => {
    if (!started) return;
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      pos => {
        setGeoLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          timestamp: new Date().toISOString(),
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [started]);

  const handleStart = () => {
    setStarted(true);
    startTimeRef.current = new Date();
    setTaskStatus('em-execucao');
  };

  const handleFinish = () => {
    setFinished(true);
    setTaskStatus('finalizado');
  };

  const elapsedTime = () => {
    if (!startTimeRef.current) return '00:00';
    const diff = Math.floor((currentTime.getTime() - startTimeRef.current.getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const emp = task ? demoEmployees.find(e => e.id === task.assignedTo) : null;

  if (notFound) {
    return (
      <div className="revista-root min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center max-w-sm">
          <p className="text-5xl mb-4">❌</p>
          <h1 className="text-xl font-bold text-[#1E293B] mb-2">QR Code Inválido</h1>
          <p className="text-sm text-[#64748B]">O código <strong className="font-mono">{code}</strong> não foi encontrado.</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="revista-root min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF] flex items-center justify-center">
        <div className="animate-pulse text-[#94A3B8]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="revista-root min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A5A8F] text-white p-5">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-white/60 mb-1 font-mono">{task.qrCode}</p>
          <h1 className="text-xl font-bold">{task.title}</h1>
          <p className="text-sm text-white/70 mt-1">{task.description}</p>
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span>👤 {emp?.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              taskStatus === 'finalizado' ? 'bg-green-500/30' : taskStatus === 'em-execucao' ? 'bg-blue-500/30' : taskStatus === 'problema' ? 'bg-red-500/30' : 'bg-white/20'
            }`}>{statusLabels[taskStatus]}</span>
          </div>
          {started && (
            <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
              <span>⏱ Tempo: <strong className="text-white font-mono">{elapsedTime()}</strong></span>
              {geoLocation && <span>📍 GPS ativo</span>}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!started && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-6">
            <button onClick={handleStart} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-lg font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all">
              ▶️ Iniciar Tarefa
            </button>
            <p className="text-xs text-[#94A3B8] mt-2">Sua localização será registrada ao iniciar</p>
          </motion.div>
        )}

        <AnimatePresence>
          {finished && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl border border-green-200 p-8 text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold text-[#1E293B] mb-2">Tarefa Finalizada!</h2>
              <p className="text-sm text-[#64748B]">Tempo de execução: <strong>{elapsedTime()}</strong></p>
              {geoLocation && <p className="text-xs text-[#94A3B8] mt-1">📍 Localização registrada</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {started && geoLocation && (
          <div className="mb-5 rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm" style={{ height: 180 }}>
            <iframe
              title="Sua localização"
              width="100%" height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${geoLocation.lon - 0.003},${geoLocation.lat - 0.002},${geoLocation.lon + 0.003},${geoLocation.lat + 0.002}&layer=mapnik&marker=${geoLocation.lat},${geoLocation.lon}`}
            />
          </div>
        )}

        {started && !finished && (
          <AnimatePresence mode="wait">
            {/* ===== ANTES E DEPOIS ===== */}
            {task.type === 'antes-depois' && (
              <motion.div key="ba" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <h3 className="font-semibold text-[#1E293B] mb-3">📸 Foto ANTES</h3>
                  <div className="w-full h-40 bg-[#F1F5F9] rounded-xl border-2 border-dashed border-[#CBD5E1] flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0] transition-colors">
                    <div className="text-center">
                      <p className="text-3xl">📷</p>
                      <p className="text-xs text-[#94A3B8] mt-1">Toque para tirar foto</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <h3 className="font-semibold text-[#1E293B] mb-3">📸 Foto DEPOIS</h3>
                  <div className="w-full h-40 bg-[#F1F5F9] rounded-xl border-2 border-dashed border-[#CBD5E1] flex items-center justify-center cursor-pointer hover:bg-[#E2E8F0] transition-colors">
                    <div className="text-center">
                      <p className="text-3xl">📷</p>
                      <p className="text-xs text-[#94A3B8] mt-1">Toque para tirar foto</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <label className="block text-sm font-semibold text-[#1E293B] mb-2">📝 Descrição</label>
                  <textarea value={baDescription} onChange={e => setBaDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" placeholder="Descreva o que foi feito..." />
                </div>

                <button onClick={handleFinish} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl">
                  ✅ Finalizar Antes e Depois
                </button>
              </motion.div>
            )}

            {/* ===== CHECKLIST ===== */}
            {task.type === 'checklist' && (
              <motion.div key="chk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {(task as ChecklistTask).items.map((item: ChecklistItem) => (
                  <div key={item.id} className={`bg-white rounded-xl border p-4 ${checkedItems[item.id] ? 'border-green-200 bg-green-50/50' : 'border-[#E2E8F0]'}`}>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCheckedItems(p => ({ ...p, [item.id]: !p[item.id] }))}
                        className="flex items-center gap-3 flex-1"
                      >
                        {checkedItems[item.id] ? (
                          <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">✓</span>
                        ) : (
                          <span className="w-6 h-6 rounded-full border-2 border-[#CBD5E1]" />
                        )}
                        <span className={`text-sm ${checkedItems[item.id] ? 'line-through text-green-700' : 'text-[#1E293B]'}`}>{item.text}</span>
                      </button>
                      <button
                        onClick={() => setProblemModal(item.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-500 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                      >
                        ⚠️ Problema
                      </button>
                    </div>
                  </div>
                ))}

                <div className="text-center text-xs text-[#64748B] py-2">
                  ✅ {Object.values(checkedItems).filter(Boolean).length}/{(task as ChecklistTask).items.length} concluídos
                </div>

                <button onClick={handleFinish} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl">
                  ✅ Finalizar Checklist
                </button>

                <AnimatePresence>
                  {problemModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
                      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="font-bold text-[#1E293B] mb-3">⚠️ Reportar Problema</h3>
                        <div className="w-full h-32 bg-[#F1F5F9] rounded-xl border-2 border-dashed border-[#CBD5E1] flex items-center justify-center cursor-pointer mb-3">
                          <div className="text-center">
                            <p className="text-2xl">📷</p>
                            <p className="text-xs text-[#94A3B8]">Foto do problema</p>
                          </div>
                        </div>
                        <textarea value={problemDesc} onChange={e => setProblemDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none mb-3" placeholder="Descreva o problema..." />
                        <div className="flex gap-2">
                          <button onClick={() => { setProblemModal(null); setProblemDesc(''); }} className="flex-1 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#64748B]">Cancelar</button>
                          <button onClick={() => { setProblemModal(null); setProblemDesc(''); }} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-semibold">Enviar</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ===== TAREFA ===== */}
            {task.type === 'tarefa' && (
              <motion.div key="task" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <h3 className="font-semibold text-[#1E293B] mb-3">Status da Tarefa</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { s: 'aberto' as EmployeeTaskStatus, icon: '📂', label: 'Em Aberto', color: 'border-yellow-300 bg-yellow-50' },
                      { s: 'em-execucao' as EmployeeTaskStatus, icon: '🔄', label: 'Em Execução', color: 'border-blue-300 bg-blue-50' },
                      { s: 'finalizado' as EmployeeTaskStatus, icon: '✅', label: 'Finalizado', color: 'border-green-300 bg-green-50' },
                      { s: 'problema' as EmployeeTaskStatus, icon: '⚠️', label: 'Reportar Problema', color: 'border-red-300 bg-red-50' },
                    ]).map(opt => (
                      <button
                        key={opt.s}
                        onClick={() => { setTaskStatus(opt.s); if (opt.s === 'problema') setReportProblem(true); else setReportProblem(false); }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${taskStatus === opt.s ? opt.color : 'border-[#E2E8F0]'}`}
                      >
                        <span className="text-xl">{opt.icon}</span>
                        <p className="text-xs font-medium mt-1">{opt.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
                  <h3 className="font-semibold text-[#1E293B] mb-3">📸 Fotos da Execução</h3>
                  <div className="w-full h-32 bg-[#F1F5F9] rounded-xl border-2 border-dashed border-[#CBD5E1] flex items-center justify-center cursor-pointer">
                    <div className="text-center">
                      <p className="text-2xl">📷</p>
                      <p className="text-xs text-[#94A3B8]">Adicionar fotos</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {reportProblem && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
                        <h3 className="font-semibold text-red-700 mb-3">⚠️ Reportar Problema</h3>
                        <div className="w-full h-28 bg-white rounded-xl border-2 border-dashed border-red-200 flex items-center justify-center cursor-pointer mb-3">
                          <div className="text-center">
                            <p className="text-2xl">📷</p>
                            <p className="text-xs text-red-400">Foto do problema</p>
                          </div>
                        </div>
                        <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-white" placeholder="Descreva o problema encontrado..." />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {taskStatus === 'finalizado' && (
                  <button onClick={handleFinish} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl">
                    ✅ Confirmar Finalização
                  </button>
                )}
                {taskStatus === 'problema' && (
                  <button onClick={handleFinish} className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl">
                    ⚠️ Enviar Relatório de Problema
                  </button>
                )}
              </motion.div>
            )}

            {/* ===== VISTORIA ===== */}
            {task.type === 'vistoria' && (
              <motion.div key="vis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-xs text-[#64748B] mb-1">Itens pré-determinados + livres:</p>
                {[...(task as InspectionTask).items, ...freeFormItems.map(f => ({ ...f, preset: false, status: 'pendente' as const, photo: undefined, description: undefined }))].map((item) => (
                  <div key={item.id} className={`bg-white rounded-xl border p-4 ${inspectionStatuses[item.id] === 'ok' ? 'border-green-200 bg-green-50/50' : inspectionStatuses[item.id] === 'problema' ? 'border-red-200 bg-red-50/50' : 'border-[#E2E8F0]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1E293B]">{item.label}</span>
                      {!('preset' in item && item.preset) && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-semibold rounded-full">Livre</span>}
                    </div>
                    <div className="flex gap-2 mb-2">
                      <button onClick={() => setInspectionStatuses(p => ({ ...p, [item.id]: 'ok' }))} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${inspectionStatuses[item.id] === 'ok' ? 'border-green-400 bg-green-100 text-green-700' : 'border-[#E2E8F0] text-[#64748B]'}`}>✅ OK</button>
                      <button onClick={() => setInspectionStatuses(p => ({ ...p, [item.id]: 'problema' }))} className={`flex-1 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${inspectionStatuses[item.id] === 'problema' ? 'border-red-400 bg-red-100 text-red-700' : 'border-[#E2E8F0] text-[#64748B]'}`}>⚠️ Problema</button>
                    </div>
                    <div className="w-full h-24 bg-[#F1F5F9] rounded-lg border-2 border-dashed border-[#CBD5E1] flex items-center justify-center cursor-pointer mb-2">
                      <div className="text-center"><p className="text-lg">📷</p><p className="text-[10px] text-[#94A3B8]">Foto</p></div>
                    </div>
                    <textarea value={inspectionDescs[item.id] ?? ''} onChange={e => setInspectionDescs(p => ({ ...p, [item.id]: e.target.value }))} rows={1} className="w-full px-2 py-1.5 border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" placeholder="Observações..." />
                  </div>
                ))}

                <div className="bg-white rounded-xl border border-dashed border-purple-300 p-4">
                  <button onClick={() => setShowFreeForm(!showFreeForm)} className="w-full flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-700">➕ Adicionar Item Livre</span>
                    <span className="text-purple-400">{showFreeForm ? '▲' : '▼'}</span>
                  </button>
                  <AnimatePresence>
                    {showFreeForm && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="flex gap-2 mt-3">
                          <input type="text" value={newFreeItem} onChange={e => setNewFreeItem(e.target.value)} className="flex-1 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" placeholder="Descrição do item..." />
                          <button
                            onClick={() => {
                              if (!newFreeItem.trim()) return;
                              const id = `free-${Date.now()}`;
                              setFreeFormItems(p => [...p, { id, label: newFreeItem.trim() }]);
                              setInspectionStatuses(p => ({ ...p, [id]: 'pendente' }));
                              setNewFreeItem('');
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
                          >
                            +
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={handleFinish} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl">
                  ✅ Finalizar Vistoria
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
