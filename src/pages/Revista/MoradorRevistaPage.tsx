import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { demoCondominium } from './data/demo';
import { saveDemoClassified } from './data/demoClassifieds';
import './revista.css';

type MoradorTab = 'inicio' | 'chamado' | 'classificado' | 'carona';

export default function MoradorRevistaPage() {
  const [tab, setTab] = useState<MoradorTab>('inicio');
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const classificadoFileInputRef = useRef<HTMLInputElement | null>(null);

  const [chamadoForm, setChamadoForm] = useState({
    type: 'manutencao',
    name: '',
    email: '',
    unit: '',
    title: '',
    description: '',
  });

  const [classificadoForm, setClassificadoForm] = useState({
    name: '',
    unit: '',
    phone: '',
    title: '',
    description: '',
    category: 'venda',
    price: '',
    images: [] as string[],
  });

  const [caronaForm, setCaronaForm] = useState({
    name: '',
    unit: '',
    phone: '',
    destination: '',
    time: '',
    seats: '2',
    days: [] as string[],
  });

  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    const dest = caronaForm.destination.trim();
    if (dest.length < 5) { setMapCoords(null); return; }
    setMapLoading(true);
    geocodeTimer.current = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(dest)}&limit=1`, {
        headers: { 'Accept-Language': 'pt-BR' },
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
          } else {
            setMapCoords(null);
          }
        })
        .catch(() => setMapCoords(null))
        .finally(() => setMapLoading(false));
    }, 800);
    return () => { if (geocodeTimer.current) clearTimeout(geocodeTimer.current); };
  }, [caronaForm.destination]);

  const handleClassificadoImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const availableSlots = Math.max(0, 4 - classificadoForm.images.length);
    const selectedFiles = files.slice(0, availableSlots);
    const nextImages = await Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(new Error('Falha ao ler imagem'));
            reader.readAsDataURL(file);
          }),
      ),
    );

    setClassificadoForm((prev) => ({
      ...prev,
      images: [...prev.images, ...nextImages.filter(Boolean)],
    }));

    e.target.value = '';
  };

  const removeClassificadoImage = (imageIndex: number) => {
    setClassificadoForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== imageIndex),
    }));
  };

  const handleSubmitChamado = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `JF-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setTrackingCode(code);
    setSubmitted(true);
  };

  const handleSubmitClassificado = (e: React.FormEvent) => {
    e.preventDefault();
    saveDemoClassified({
      id: `class-${Date.now()}`,
      name: classificadoForm.name,
      unit: classificadoForm.unit,
      phone: classificadoForm.phone,
      title: classificadoForm.title,
      description: classificadoForm.description,
      category: classificadoForm.category,
      price: classificadoForm.price,
      images: classificadoForm.images,
      createdAt: new Date().toISOString(),
    });
    setTrackingCode('CLASSIFICADO-OK');
    setSubmitted(true);
  };

  const handleSubmitCarona = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingCode('CARONA-OK');
    setSubmitted(true);
  };

  const resetForm = () => {
    setSubmitted(false);
    setTrackingCode('');
    setTab('inicio');
    setClassificadoForm({
      name: '',
      unit: '',
      phone: '',
      title: '',
      description: '',
      category: 'venda',
      price: '',
      images: [],
    });
  };

  const toggleDay = (day: string) => {
    setCaronaForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const condo = demoCondominium;

  return (
    <div className="revista-root min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2A5A8F] text-white">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/revista/painel" className="text-white/70 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#D4AF37] flex items-center justify-center text-xs font-bold">AR</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold border border-white/20">
              JF
            </div>
            <div>
              <div className="font-bold">{condo.name}</div>
              <div className="text-xs text-white/60">Área do Morador</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Success State */}
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center text-3xl mx-auto mb-4">
                ✅
              </div>
              <h2 className="text-xl font-bold text-[#1E293B] mb-2">Enviado com sucesso!</h2>
              {trackingCode.startsWith('JF') ? (
                <>
                  <p className="text-sm text-[#64748B] mb-4">
                    Seu código de acompanhamento é:
                  </p>
                  <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4">
                    <div className="text-2xl font-mono font-bold text-[#1E3A5F]">{trackingCode}</div>
                  </div>
                  <p className="text-xs text-[#94A3B8] mb-4">
                    Um link de acompanhamento foi enviado para seu e-mail.
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#64748B] mb-6">
                  {trackingCode === 'CLASSIFICADO-OK'
                    ? `Seu classificado será publicado na próxima edição da revista${classificadoForm.images.length > 0 ? ` com ${classificadoForm.images.length} imagem${classificadoForm.images.length > 1 ? 'ns' : ''}` : ''}!`
                    : 'Sua oferta de carona foi registrada e aparecerá na revista!'}
                </p>
              )}
              <div className="mt-4">
                <button
                  onClick={resetForm}
                  className="text-sm text-[#64748B] hover:text-[#1E3A5F] transition-colors"
                >
                  ← Voltar ao início
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="forms" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Menu Inicio */}
              {tab === 'inicio' && (
                <div className="space-y-3">
                  <Link
                    to="/revista"
                    className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center text-xl">📖</div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#1E293B]">Ler Revista</div>
                      <div className="text-xs text-[#94A3B8]">Edição de Março 2026</div>
                    </div>
                    <svg className="w-5 h-5 text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>

                  {[
                    { id: 'chamado' as const, icon: '🔔', title: 'Abrir Chamado', desc: 'Reclamação, manutenção ou ocorrência' },
                    { id: 'classificado' as const, icon: '📌', title: 'Classificados', desc: 'Anuncie ou procure produtos e serviços' },
                    { id: 'carona' as const, icon: '🚗', title: 'Caronas Coletivas', desc: 'Ofereça carona aos vizinhos' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className="w-full flex items-center gap-4 bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-all text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center text-xl">{item.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#1E293B]">{item.title}</div>
                        <div className="text-xs text-[#94A3B8]">{item.desc}</div>
                      </div>
                      <svg className="w-5 h-5 text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              )}

              {/* Chamado Form */}
              {tab === 'chamado' && (
                <div>
                  <button onClick={() => setTab('inicio')} className="flex items-center gap-1 text-sm text-[#64748B] mb-4 hover:text-[#1E3A5F]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                  </button>
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                    <h2 className="text-lg font-bold text-[#1E293B] mb-1">Abrir Chamado</h2>
                    <p className="text-xs text-[#94A3B8] mb-6">Preencha os dados abaixo para registrar sua solicitação</p>
                    <form onSubmit={handleSubmitChamado} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Tipo</label>
                        <select value={chamadoForm.type} onChange={e => setChamadoForm(p => ({...p, type: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                          <option value="manutencao">🔧 Manutenção</option>
                          <option value="reclamacao">📢 Reclamação</option>
                          <option value="ocorrencia">⚠️ Ocorrência</option>
                          <option value="sugestao">💡 Sugestão</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Nome</label>
                          <input type="text" required value={chamadoForm.name} onChange={e => setChamadoForm(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Seu nome" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Apartamento</label>
                          <input type="text" required value={chamadoForm.unit} onChange={e => setChamadoForm(p => ({...p, unit: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Ex: 302" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">E-mail</label>
                        <input type="email" required value={chamadoForm.email} onChange={e => setChamadoForm(p => ({...p, email: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="seu@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Assunto</label>
                        <input type="text" required value={chamadoForm.title} onChange={e => setChamadoForm(p => ({...p, title: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Descreva brevemente" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Descrição detalhada</label>
                        <textarea required value={chamadoForm.description} onChange={e => setChamadoForm(p => ({...p, description: e.target.value}))} rows={4} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" placeholder="Detalhe sua solicitação..." />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Fotos (opcional)</label>
                        <div className="w-full h-16 border-2 border-dashed border-[#E2E8F0] rounded-lg flex items-center justify-center text-[#94A3B8] text-xs cursor-pointer hover:border-[#1E3A5F] transition-colors">
                          📷 Adicionar fotos
                        </div>
                      </div>
                      <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2A5A8F] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                        Enviar Chamado
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Classificado Form */}
              {tab === 'classificado' && (
                <div>
                  <button onClick={() => setTab('inicio')} className="flex items-center gap-1 text-sm text-[#64748B] mb-4 hover:text-[#1E3A5F]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                  </button>
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                    <h2 className="text-lg font-bold text-[#1E293B] mb-1">Publicar Classificado</h2>
                    <p className="text-xs text-[#94A3B8] mb-6">Anuncie para seus vizinhos</p>
                    <form onSubmit={handleSubmitClassificado} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Nome</label>
                          <input type="text" required value={classificadoForm.name} onChange={e => setClassificadoForm(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Apartamento</label>
                          <input type="text" required value={classificadoForm.unit} onChange={e => setClassificadoForm(p => ({...p, unit: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Tipo</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { v: 'venda', l: '💰 Venda' },
                            { v: 'troca', l: '🔄 Troca' },
                            { v: 'doacao', l: '🎁 Doação' },
                            { v: 'servico', l: '🛠 Serviço' },
                          ].map(t => (
                            <button
                              key={t.v}
                              type="button"
                              onClick={() => setClassificadoForm(p => ({...p, category: t.v}))}
                              className={`py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                                classificadoForm.category === t.v ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]' : 'border-[#E2E8F0] text-[#64748B]'
                              }`}
                            >
                              {t.l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">O que está anunciando?</label>
                        <input type="text" required value={classificadoForm.title} onChange={e => setClassificadoForm(p => ({...p, title: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Ex: Bicicleta aro 29" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Descrição</label>
                        <textarea required value={classificadoForm.description} onChange={e => setClassificadoForm(p => ({...p, description: e.target.value}))} rows={3} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Preço (se houver)</label>
                          <input type="text" value={classificadoForm.price} onChange={e => setClassificadoForm(p => ({...p, price: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="R$ 0,00" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Telefone</label>
                          <input type="text" required value={classificadoForm.phone} onChange={e => setClassificadoForm(p => ({...p, phone: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="(11) 99999-9999" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-medium text-[#64748B]">Fotos do item (opcional)</label>
                          <span className="text-[10px] text-[#94A3B8]">Até 4 imagens</span>
                        </div>
                        {classificadoForm.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {classificadoForm.images.map((imageUrl, idx) => (
                              <div key={`${idx}`} className="relative h-24 rounded-xl overflow-hidden border border-[#E2E8F0] group">
                                <img src={imageUrl} alt={`Imagem do classificado ${idx + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeClassificadoImage(idx)}
                                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <input
                          ref={classificadoFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleClassificadoImagesChange}
                        />
                        <button
                          type="button"
                          onClick={() => classificadoFileInputRef.current?.click()}
                          className="w-full h-16 border-2 border-dashed border-[#E2E8F0] rounded-lg flex items-center justify-center text-[#94A3B8] text-xs cursor-pointer hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors"
                        >
                          📷 Adicionar fotos do produto ou serviço
                        </button>
                      </div>
                      <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2A5A8F] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                        Publicar Classificado
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Carona Form */}
              {tab === 'carona' && (
                <div>
                  <button onClick={() => setTab('inicio')} className="flex items-center gap-1 text-sm text-[#64748B] mb-4 hover:text-[#1E3A5F]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                  </button>
                  <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
                    <h2 className="text-lg font-bold text-[#1E293B] mb-1">Oferecer Carona</h2>
                    <p className="text-xs text-[#94A3B8] mb-6">Ajude seus vizinhos — ofereça carona</p>
                    <form onSubmit={handleSubmitCarona} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Nome</label>
                          <input type="text" required value={caronaForm.name} onChange={e => setCaronaForm(p => ({...p, name: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Apartamento</label>
                          <input type="text" required value={caronaForm.unit} onChange={e => setCaronaForm(p => ({...p, unit: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Destino</label>
                        <input type="text" required value={caronaForm.destination} onChange={e => setCaronaForm(p => ({...p, destination: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="Ex: Av. Paulista - próx. metrô Trianon" />
                        <div className="mt-2 rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm relative" style={{ height: 200 }}>
                          {mapLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Buscando localização…
                              </div>
                            </div>
                          )}
                          <iframe
                            title="Mapa do destino"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            src={mapCoords
                              ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lon - 0.01},${mapCoords.lat - 0.008},${mapCoords.lon + 0.01},${mapCoords.lat + 0.008}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lon}`
                              : `https://www.openstreetmap.org/export/embed.html?bbox=-46.7,-23.6,-46.6,-23.5&layer=mapnik`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Horário de saída</label>
                          <input type="time" required value={caronaForm.time} onChange={e => setCaronaForm(p => ({...p, time: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#64748B] mb-1">Vagas</label>
                          <select value={caronaForm.seats} onChange={e => setCaronaForm(p => ({...p, seats: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
                            {[1,2,3,4].map(n => <option key={n} value={n}>{n} vaga{n > 1 ? 's' : ''}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-2">Dias da semana</label>
                        <div className="flex flex-wrap gap-2">
                          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${
                                caronaForm.days.includes(day) ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 text-[#1E3A5F]' : 'border-[#E2E8F0] text-[#64748B]'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#64748B] mb-1">Telefone / WhatsApp</label>
                        <input type="text" required value={caronaForm.phone} onChange={e => setCaronaForm(p => ({...p, phone: e.target.value}))} className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]" placeholder="(11) 99999-9999" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#1E3A5F] to-[#2A5A8F] text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                        Publicar Carona
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
