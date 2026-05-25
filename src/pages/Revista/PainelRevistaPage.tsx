import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import './revista.css';
import { categories } from './data/categories';
import { demoCondominium, demoEdition, demoRequests } from './data/demo';
import { MagazineSection } from './types';
import CategoryForm from './components/CategoryForm';
import CategoryPreviewModal from './components/CategoryPreviewModal';

type Tab = 'categorias' | 'edicao' | 'chamados' | 'config';

export default function PainelRevistaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('categorias');
  const [activeCats, setActiveCats] = useState<string[]>(demoCondominium.activeCategories);
  const [sections, setSections] = useState<MagazineSection[]>(demoEdition.sections);
  const [editingSection, setEditingSection] = useState<MagazineSection | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [previewCatId, setPreviewCatId] = useState<string | null>(null);

  const addImageToSection = () => {
    if (!editingSection || !newImageUrl.trim()) return;
    setEditingSection({ ...editingSection, images: [...editingSection.images, newImageUrl.trim()] });
    setNewImageUrl('');
  };

  const removeImageFromSection = (index: number) => {
    if (!editingSection) return;
    setEditingSection({ ...editingSection, images: editingSection.images.filter((_, i) => i !== index) });
  };

  const toggleCategory = (catId: string) => {
    setActiveCats(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const duplicateSection = (section: MagazineSection) => {
    const newSection = {
      ...section,
      id: `sec-${Date.now()}`,
      title: `${section.title} (cópia)`,
      order: sections.length + 1,
    };
    setSections(prev => [...prev, newSection]);
  };

  const openEditor = (section?: MagazineSection) => {
    if (section) {
      setEditingSection({ ...section });
    } else {
      setEditingSection({
        id: `sec-${Date.now()}`,
        categoryId: activeCats[0] || 'editorial',
        title: '',
        content: '',
        images: [],
        order: sections.length + 1,
        visible: true,
      });
    }
    setShowEditor(true);
  };

  const saveSection = () => {
    if (!editingSection) return;
    setSections(prev => {
      const exists = prev.find(s => s.id === editingSection.id);
      if (exists) {
        return prev.map(s => s.id === editingSection.id ? editingSection : s);
      }
      return [...prev, editingSection];
    });
    setShowEditor(false);
    setEditingSection(null);
  };

  const openCategoryForm = (catId: string) => {
    const existing = sections.find(s => s.categoryId === catId);
    if (existing) {
      setEditingSection({ ...existing });
    } else {
      setEditingSection({
        id: `sec-${Date.now()}`,
        categoryId: catId,
        title: categories.find(c => c.id === catId)?.name || '',
        content: '',
        images: [],
        order: sections.length + 1,
        visible: true,
      });
    }
    if (!activeCats.includes(catId)) {
      setActiveCats(prev => [...prev, catId]);
    }
    setShowEditor(true);
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'categorias', label: 'Categorias', icon: '📋' },
    { id: 'edicao', label: 'Edição Atual', icon: '📖' },
    { id: 'chamados', label: 'Chamados', icon: '🔔' },
    { id: 'config', label: 'Configurações', icon: '⚙️' },
  ];

  return (
    <div className="revista-root min-h-screen bg-[#F8FAFC]">
      <div className="fixed top-0 left-0 md:left-[260px] right-0 z-40 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#1E3A5F] to-[#D4AF37] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">AR</span>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-lg font-bold gradient-text leading-none">APP REVISTA</span>
                  <span className="mt-1 block text-[12px] font-bold uppercase tracking-[0.22em] text-[#1E3A5F] leading-none">Condomínio</span>
                </div>
              </Link>
              <span className="text-[#CBD5E1] hidden sm:inline">|</span>
              <span className="text-sm text-[#64748B] hidden sm:inline">Painel do Síndico</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/revista"
                className="px-3 py-1.5 text-xs font-medium text-[#1E3A5F] bg-[#1E3A5F]/5 rounded-lg hover:bg-[#1E3A5F]/10 transition-all"
              >
                👁 Visão Morador
              </Link>
              <div className="w-8 h-8 rounded-full bg-[#10B981] flex items-center justify-center text-white text-xs font-bold">
                CS
              </div>
              <Link
                to="/dashboard"
                className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
              >
                Voltar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-20">
        <div className="bg-linear-to-r from-[#1E3A5F] to-[#2A5A8F] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-2xl font-bold border border-white/20">
                JF
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold">{demoCondominium.name}</h1>
                <p className="text-white/70 text-sm">{demoCondominium.address}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/50">
                  <span>📞 {demoCondominium.phone}</span>
                  <span>✉ {demoCondominium.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-xs">
                  Edição #{demoEdition.editionNumber} · {demoEdition.month} {demoEdition.year}
                </span>
                <span className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-xs font-medium">
                  Publicado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-[#E2E8F0] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1E3A5F] text-white'
                    : 'text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CATEGORIAS TAB */}
        {activeTab === 'categorias' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">Categorias da Revista</h2>
                <p className="text-sm text-[#64748B]">Selecione os cards que deseja incluir na sua revista</p>
              </div>
              <span className="text-sm text-[#64748B]">
                {activeCats.length} de {categories.length} ativas
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/revista/funcionarios')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-[#10B981] to-[#0D9488] text-white mb-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">👷</div>
                <div>
                  <p className="font-bold text-sm">Gestão de Funcionários</p>
                  <p className="text-white/70 text-xs">Crie tarefas, acompanhe manutenções e gere relatórios</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">Acessar</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            <div className="p-4 rounded-xl bg-linear-to-r from-[#8B5CF6] to-[#7C3AED] text-white mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">🏠</div>
                <div>
                  <p className="font-bold text-sm">Funções exclusivas para Moradores</p>
                  <p className="text-white/70 text-xs">Recursos disponíveis na área do morador</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { icon: '🔔', label: 'Chamados', desc: 'Abrir e acompanhar solicitações', to: '/revista/morador' },
                  { icon: '🏷️', label: 'Classificados', desc: 'Compra, venda e doação', to: '/revista/morador' },
                  { icon: '🚗', label: 'Caronas', desc: 'Oferecer e pedir caronas', to: '/revista/morador' },
                  { icon: '📱', label: 'QR Codes', desc: 'Acessos rápidos do condomínio', to: '/qrcode' },
                ].map(f => (
                  <Link
                    key={f.label}
                    to={f.to}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/30 transition-all"
                  >
                    <span className="text-lg">{f.icon}</span>
                    <div>
                      <p className="text-xs font-semibold">{f.label}</p>
                      <p className="text-[10px] text-white/60">{f.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-linear-to-r from-[#1E3A5F] to-[#2A5A8F] text-white mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">📖</div>
              <div>
                <p className="font-bold text-sm">Funções para montar a revista</p>
                <p className="text-white/70 text-xs">Selecione as categorias e edite o conteúdo de cada seção</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {categories.map(cat => {
                const isActive = activeCats.includes(cat.id);
                const hasContent = sections.some(s => s.categoryId === cat.id);
                return (
                  <motion.div
                    key={cat.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleCategory(cat.id)}
                    className={`relative p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-md'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                    {hasContent && (
                      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#D4AF37]" title="Conteúdo preenchido" />
                    )}
                    <div className="w-full">
                      <div
                        className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-lg font-bold"
                        style={{ backgroundColor: cat.color, opacity: isActive ? 1 : 0.5 }}
                      >
                        {cat.name.charAt(0)}
                      </div>
                      <div className={`text-sm font-semibold ${isActive ? 'text-[#1E293B]' : 'text-[#94A3B8]'}`}>
                        {cat.name}
                      </div>
                    </div>
                    <div className="mt-2 text-center text-[10px] font-medium">
                      <span className={isActive ? 'text-[#10B981]' : 'text-[#94A3B8]'}>
                        {isActive ? 'Ativa na edição' : 'Clique no card para ativar'}
                      </span>
                    </div>
                    <div className="flex justify-center gap-1 mt-2">
                      <button
                        onClick={e => { e.stopPropagation(); openCategoryForm(cat.id); }}
                        className="px-2 py-1 rounded-md text-[10px] font-medium bg-[#1E3A5F]/10 text-[#1E3A5F] hover:bg-[#1E3A5F]/20 transition-all"
                      >
                        ✏ Editar
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setPreviewCatId(cat.id); }}
                        className="px-2 py-1 rounded-md text-[10px] font-medium bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 transition-all"
                        title="Visão do Morador"
                      >
                        👁 Visão Morador
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* EDIÇÃO TAB */}
        {activeTab === 'edicao' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">Seções da Edição</h2>
                <p className="text-sm text-[#64748B]">Gerencie o conteúdo de cada seção da revista</p>
              </div>
              <button
                onClick={() => openEditor()}
                className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#2A5A8F] transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Nova Seção
              </button>
            </div>

            <div className="space-y-3">
              {sections.map((section, idx) => {
                const cat = categories.find(c => c.id === section.categoryId);
                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-center gap-4 group hover:shadow-md transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: cat?.color || '#6366F1' }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#1E293B] text-sm truncate">{section.title}</div>
                      <div className="text-xs text-[#94A3B8]">{cat?.name}</div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditor(section)}
                        className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E3A5F] transition-all"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => duplicateSection(section)}
                        className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#8B5CF6] transition-all"
                        title="Duplicar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                      <button
                        onClick={() => {
                          setSections(prev => prev.map(s =>
                            s.id === section.id ? { ...s, visible: !s.visible } : s
                          ));
                        }}
                        className={`p-2 rounded-lg hover:bg-[#F1F5F9] transition-all ${section.visible ? 'text-[#10B981]' : 'text-[#CBD5E1]'}`}
                        title={section.visible ? 'Ocultar' : 'Mostrar'}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {section.visible
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M15.12 15.12L21 21" />
                          }
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteSection(section.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500 transition-all"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHAMADOS TAB */}
        {activeTab === 'chamados' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#1E293B]">Chamados dos Moradores</h2>
                <p className="text-sm text-[#64748B]">{demoRequests.length} chamados registrados</p>
              </div>
            </div>

            <div className="space-y-3">
              {demoRequests.map((req, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl border border-[#E2E8F0] p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          req.status === 'aberto' ? 'bg-red-100 text-red-700' :
                          req.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-700' :
                          req.status === 'resolvido' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {req.status === 'aberto' ? '🔴 Aberto' :
                           req.status === 'em-andamento' ? '🟡 Em andamento' :
                           req.status === 'resolvido' ? '🟢 Resolvido' : '⚫ Fechado'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#64748B]">
                          {req.type === 'reclamacao' ? '📢 Reclamação' :
                           req.type === 'manutencao' ? '🔧 Manutenção' :
                           req.type === 'ocorrencia' ? '⚠️ Ocorrência' : '💡 Sugestão'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[#1E293B] mb-1">{req.title}</h3>
                      <p className="text-sm text-[#64748B] mb-2">{req.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                        <span>👤 {req.residentName} · Apto {req.residentUnit}</span>
                        <span>🔗 {req.trackingCode}</span>
                        <span>{new Date(req.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E3A5F]" title="Responder">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                      </button>
                      <button className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#10B981]" title="Marcar resolvido">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      </button>
                      <button className="p-2 rounded-lg hover:bg-red-50 text-[#64748B] hover:text-red-500" title="Excluir">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  {req.messages.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
                      {req.messages.map(msg => (
                        <div key={msg.id} className="flex items-start gap-2 text-sm">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-[10px] font-bold text-white">S</div>
                          <div>
                            <span className="font-medium text-[#1E293B]">{msg.author}: </span>
                            <span className="text-[#64748B]">{msg.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CONFIG TAB */}
        {activeTab === 'config' && (
          <div className="max-w-2xl">
            <h2 className="text-xl font-bold text-[#1E293B] mb-6">Configurações do Condomínio</h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4 uppercase tracking-wider">Cabeçalho Premium</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Nome do Condomínio</label>
                    <input type="text" defaultValue={demoCondominium.name} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Telefone</label>
                    <input type="text" defaultValue={demoCondominium.phone} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">E-mail</label>
                    <input type="text" defaultValue={demoCondominium.email} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Endereço</label>
                    <input type="text" defaultValue={demoCondominium.address} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Foto do Síndico</label>
                    <div className="w-full h-24 border-2 border-dashed border-[#E2E8F0] rounded-lg flex items-center justify-center text-[#94A3B8] text-sm cursor-pointer hover:border-[#1E3A5F] transition-colors">
                      📷 Carregar foto
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Logo da Administradora</label>
                    <div className="w-full h-24 border-2 border-dashed border-[#E2E8F0] rounded-lg flex items-center justify-center text-[#94A3B8] text-sm cursor-pointer hover:border-[#1E3A5F] transition-colors">
                      🏢 Carregar logo
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4 uppercase tracking-wider">Personalização Visual</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Cor Principal</label>
                    <div className="flex items-center gap-2">
                      <input type="color" defaultValue={demoCondominium.themeColor} className="w-10 h-10 border-0 rounded cursor-pointer" />
                      <input type="text" defaultValue={demoCondominium.themeColor} className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Cor de Destaque</label>
                    <div className="flex items-center gap-2">
                      <input type="color" defaultValue={demoCondominium.accentColor} className="w-10 h-10 border-0 rounded cursor-pointer" />
                      <input type="text" defaultValue={demoCondominium.accentColor} className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm font-mono" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#64748B] mb-2">Layout da Revista</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['classico', 'moderno', 'minimalista'].map(layout => (
                        <button
                          key={layout}
                          className={`p-3 rounded-lg border-2 text-sm font-medium capitalize ${
                            demoCondominium.layout === layout
                              ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]'
                              : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                          }`}
                        >
                          {layout}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
                <h3 className="text-sm font-semibold text-[#1E293B] mb-4 uppercase tracking-wider">QR Code do Condomínio</h3>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 bg-[#F8FAFC] rounded-xl border-2 border-dashed border-[#E2E8F0] flex items-center justify-center text-4xl">
                    📱
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B] mb-3">
                      O QR Code dá acesso aos moradores para ler a revista, abrir chamados, classificados e caronas.
                    </p>
                    <button className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#2A5A8F] transition-all">
                      Gerar QR Code
                    </button>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-xl bg-linear-to-r from-[#1E3A5F] to-[#2A5A8F] py-3 font-semibold text-white transition-all hover:shadow-lg">
                Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Category Preview Modal */}
      <AnimatePresence>
        {previewCatId && (() => {
          const cat = categories.find(c => c.id === previewCatId);
          if (!cat) return null;
          return (
            <CategoryPreviewModal
              categoryId={cat.id}
              categoryName={cat.name}
              categoryColor={cat.color}
              onClose={() => setPreviewCatId(null)}
            />
          );
        })()}
      </AnimatePresence>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && editingSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cat = categories.find(c => c.id === editingSection.categoryId);
                    return cat ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: cat.color }}>
                        {cat.name.charAt(0)}
                      </div>
                    ) : null;
                  })()}
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B]">
                      {categories.find(c => c.id === editingSection.categoryId)?.name || 'Nova Seção'}
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      {sections.find(s => s.id === editingSection.id) ? 'Editando conteúdo' : 'Novo conteúdo'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowEditor(false)} className="p-2 rounded-lg hover:bg-[#F1F5F9]">
                  <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                {!sections.find(s => s.id === editingSection.id) && (
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">Categoria</label>
                    <select
                      value={editingSection.categoryId}
                      onChange={e => setEditingSection({ ...editingSection, categoryId: e.target.value, title: categories.find(c => c.id === e.target.value)?.name || editingSection.title })}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                    >
                      {categories.filter(c => activeCats.includes(c.id)).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <CategoryForm
                  categoryId={editingSection.categoryId}
                  section={editingSection}
                  onChange={setEditingSection}
                  newImageUrl={newImageUrl}
                  onImageUrlChange={setNewImageUrl}
                  onAddImage={addImageToSection}
                  onRemoveImage={removeImageFromSection}
                />
              </div>
              <div className="p-6 border-t border-[#E2E8F0] flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveSection}
                  className="px-6 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#2A5A8F] transition-all"
                >
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
