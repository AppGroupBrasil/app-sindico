import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MagazineSection } from '../types';

interface CategoryFormProps {
  categoryId: string;
  section: MagazineSection;
  onChange: (section: MagazineSection) => void;
  newImageUrl: string;
  onImageUrlChange: (url: string) => void;
  onAddImage: () => void;
  onRemoveImage: (index: number) => void;
}

const inputClass = 'w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]';
const labelClass = 'block text-xs font-medium text-[#64748B] mb-1';

function ImageManager({ section, newImageUrl, onImageUrlChange, onAddImage, onRemoveImage }: {
  section: MagazineSection;
  newImageUrl: string;
  onImageUrlChange: (url: string) => void;
  onAddImage: () => void;
  onRemoveImage: (idx: number) => void;
}) {
  return (
    <div>
      <label className={labelClass}>Fotos ({section.images.length})</label>
      {section.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {section.images.map((img, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden h-24 bg-[#F1F5F9]">
              <img src={img} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
              <button onClick={() => onRemoveImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="url" value={newImageUrl} onChange={e => onImageUrlChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddImage(); } }}
          placeholder="Cole a URL da imagem..." className={`flex-1 ${inputClass}`} />
        <button onClick={onAddImage} disabled={!newImageUrl.trim()}
          className="px-3 py-2 bg-[#1E3A5F] text-white text-xs font-medium rounded-lg hover:bg-[#2A5A8F] disabled:opacity-40 flex-shrink-0">+ Foto</button>
      </div>
    </div>
  );
}

// Helper to parse structured content into items and back
function parseItems(content: string): string[] {
  return content.split('\n').filter(l => l.trim());
}

function itemsToContent(items: string[], prefix: string): string {
  return items.map(i => `${prefix} ${i}`).join('\n');
}

export default function CategoryForm({ categoryId, section, onChange, newImageUrl, onImageUrlChange, onAddImage, onRemoveImage }: CategoryFormProps) {
  const update = (patch: Partial<MagazineSection>) => onChange({ ...section, ...patch });
  const imgProps = { section, newImageUrl, onImageUrlChange, onAddImage, onRemoveImage };

  // ======== EDITORIAL ========
  if (categoryId === 'editorial' || categoryId === 'dicas-sindico') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título da Mensagem</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass}
            placeholder={categoryId === 'editorial' ? 'Palavra do Síndico' : 'Dica do Mês'} />
        </div>
        <div>
          <label className={labelClass}>Mensagem</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="Escreva sua mensagem aos moradores..." />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== FINANCEIRO ========
  if (categoryId === 'financeiro') {
    const lines = section.content.split('\n');
    const findVal = (key: string) => {
      const line = lines.find(l => l.toLowerCase().includes(key.toLowerCase()));
      return line ? line.split(':').slice(1).join(':').trim() : '';
    };
    const updateFinanceiro = (field: string, value: string) => {
      const fields: Record<string, string> = {
        receita: findVal('Receita Total'),
        despesasFixas: findVal('Despesas Fixas'),
        despesasVar: findVal('Despesas Variáveis'),
        saldo: findVal('Saldo'),
        destaques: lines.filter(l => l.startsWith('•')).map(l => l.replace('• ', '')).join('\n'),
      };
      fields[field] = value;
      const newContent = `Receita Total: ${fields.receita}\nDespesas Fixas: ${fields.despesasFixas}\nDespesas Variáveis: ${fields.despesasVar}\nSaldo Positivo: ${fields.saldo}\n\nDestaques:\n${fields.destaques.split('\n').map(d => `• ${d}`).join('\n')}`;
      update({ content: newContent });
    };
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Prestação de Contas - Mês/Ano" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>💰 Receita Total</label>
            <input type="text" defaultValue={findVal('Receita Total')} onBlur={e => updateFinanceiro('receita', e.target.value)} className={inputClass} placeholder="R$ 0,00" />
          </div>
          <div>
            <label className={labelClass}>📉 Despesas Fixas</label>
            <input type="text" defaultValue={findVal('Despesas Fixas')} onBlur={e => updateFinanceiro('despesasFixas', e.target.value)} className={inputClass} placeholder="R$ 0,00" />
          </div>
          <div>
            <label className={labelClass}>📊 Despesas Variáveis</label>
            <input type="text" defaultValue={findVal('Despesas Variáveis')} onBlur={e => updateFinanceiro('despesasVar', e.target.value)} className={inputClass} placeholder="R$ 0,00" />
          </div>
          <div>
            <label className={labelClass}>✅ Saldo</label>
            <input type="text" defaultValue={findVal('Saldo')} onBlur={e => updateFinanceiro('saldo', e.target.value)} className={inputClass} placeholder="R$ 0,00" />
          </div>
        </div>
        <div>
          <label className={labelClass}>Destaques (um por linha)</label>
          <textarea defaultValue={lines.filter(l => l.startsWith('•')).map(l => l.replace('• ', '')).join('\n')}
            onBlur={e => updateFinanceiro('destaques', e.target.value)} rows={4} className={`${inputClass} resize-none`} placeholder="Redução de X% no consumo..." />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== GALERIA ========
  if (categoryId === 'galeria') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título da Galeria</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Galeria de Fotos" />
        </div>
        <div>
          <label className={labelClass}>Descrição</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={3} className={`${inputClass} resize-none`}
            placeholder="Descreva o contexto das fotos..." />
        </div>
        <ImageManager {...imgProps} />
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">💡 Adicione quantas fotos desejar. Elas aparecerão como galeria na revista.</p>
      </div>
    );
  }

  // ======== ANTES E DEPOIS ========
  if (categoryId === 'antes-depois') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Transformações no Condomínio" />
        </div>
        <div>
          <label className={labelClass}>Descrição das Transformações (uma por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={6} className={`${inputClass} resize-none`}
            placeholder="🔹 Hall de entrada — Novo piso e iluminação&#10;🔹 Jardim — Paisagismo completo" />
        </div>
        <ImageManager {...imgProps} />
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">💡 Adicione fotos de antes e depois em pares para comparação visual.</p>
      </div>
    );
  }

  // ======== EQUIPE ========
  if (categoryId === 'equipe') {
    // Each member stored as JSON array in content
    const parseMembers = (text: string): { foto: string; nome: string; cargo: string; horario: string; dias: string; email: string; whatsapp: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ foto: '', nome: '', cargo: '', horario: '', dias: '', email: '', whatsapp: '' }];
    };
    const members = parseMembers(section.content);
    const updateMembers = (newMembers: typeof members) => {
      update({ content: JSON.stringify(newMembers) });
    };
    const updateMember = (idx: number, field: string, value: string) => {
      const updated = [...members];
      updated[idx] = { ...updated[idx], [field]: value };
      updateMembers(updated);
    };
    const addMember = () => updateMembers([...members, { foto: '', nome: '', cargo: '', horario: '', dias: '', email: '', whatsapp: '' }]);
    const removeMember = (idx: number) => {
      if (members.length <= 1) return;
      updateMembers(members.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Conheça Nossa Equipe" />
        </div>
        {members.map((member, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1E3A5F]">Funcionário {idx + 1}</span>
              {members.length > 1 && (
                <button onClick={() => removeMember(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            {/* Foto + Nome lado a lado */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {member.foto ? (
                  <div className="relative group w-20 h-20 rounded-full overflow-hidden bg-[#E2E8F0]">
                    <img src={member.foto} alt={member.nome || 'Foto'} className="w-full h-full object-cover" />
                    <button onClick={() => updateMember(idx, 'foto', '')}
                      className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">✕</button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[#E2E8F0] flex items-center justify-center text-[#94A3B8] text-2xl">👤</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className={labelClass}>Nome</label>
                  <input type="text" value={member.nome} onChange={e => updateMember(idx, 'nome', e.target.value)} className={inputClass} placeholder="Nome do funcionário" />
                </div>
                <div>
                  <label className={labelClass}>Cargo</label>
                  <input type="text" value={member.cargo} onChange={e => updateMember(idx, 'cargo', e.target.value)} className={inputClass} placeholder="Ex: Zelador, Porteiro..." />
                </div>
              </div>
            </div>
            {/* Foto URL */}
            <div>
              <label className={labelClass}>URL da Foto (opcional)</label>
              <input type="url" value={member.foto} onChange={e => updateMember(idx, 'foto', e.target.value)} className={inputClass} placeholder="Cole a URL da foto..." />
            </div>
            {/* Horário + Dias */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Horário de Trabalho (opcional)</label>
                <input type="text" value={member.horario} onChange={e => updateMember(idx, 'horario', e.target.value)} className={inputClass} placeholder="Ex: 7h às 15h" />
              </div>
              <div>
                <label className={labelClass}>Dias no Condomínio (opcional)</label>
                <input type="text" value={member.dias} onChange={e => updateMember(idx, 'dias', e.target.value)} className={inputClass} placeholder="Ex: Seg a Sex" />
              </div>
            </div>
            {/* Email + WhatsApp */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>E-mail (opcional)</label>
                <input type="email" value={member.email} onChange={e => updateMember(idx, 'email', e.target.value)} className={inputClass} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className={labelClass}>WhatsApp (opcional)</label>
                <input type="tel" value={member.whatsapp} onChange={e => updateMember(idx, 'whatsapp', e.target.value)} className={inputClass} placeholder="(11) 99999-9999" />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addMember} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all">
          + Adicionar funcionário
        </button>
      </div>
    );
  }

  // ======== OBRAS ========
  if (categoryId === 'obras' || categoryId === 'benfeitorias') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass}
            placeholder={categoryId === 'obras' ? 'Obras em Andamento' : 'Benfeitorias Realizadas'} />
        </div>
        <div>
          <label className={labelClass}>{categoryId === 'obras' ? 'Descrição das Obras (status, prazos)' : 'Melhorias Realizadas (uma por linha)'}</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder={categoryId === 'obras' ? 'Reforma da piscina: 75% concluída, previsão abr/2026...' : '✨ Instalação de LED nos corredores\n✨ Impermeabilização da cobertura'} />
        </div>
        <ImageManager {...imgProps} />
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">📸 Fotos de progresso valorizam muito o conteúdo!</p>
      </div>
    );
  }

  // ======== COMUNICADOS ========
  if (categoryId === 'comunicados') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Comunicados Importantes" />
        </div>
        <div>
          <label className={labelClass}>Avisos (um por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="📢 Assembleia: dia 25/03 às 19h&#10;📢 Manutenção elevadores: 15 e 16/03&#10;📢 Novo horário piscina: 7h às 22h" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== EVENTOS ========
  if (categoryId === 'eventos' || categoryId === 'semana-condominio') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass}
            placeholder={categoryId === 'eventos' ? 'Próximos Eventos' : 'Semana do Condomínio'} />
        </div>
        <div>
          <label className={labelClass}>Lista de Eventos (data — descrição, um por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="🗓 15/03 — Feira de Trocas entre Moradores&#10;🗓 22/03 — Aula de Yoga no Jardim&#10;🗓 25/03 — Assembleia Geral" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== SEGURANÇA ========
  if (categoryId === 'seguranca') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Segurança em Dia" />
        </div>
        <div>
          <label className={labelClass}>Novidades e Melhorias</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="✅ 12 novas câmeras instaladas&#10;✅ Reconhecimento facial na portaria&#10;&#10;Dicas:&#10;• Sempre feche portões ao passar" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== SUSTENTABILIDADE ========
  if (categoryId === 'sustentabilidade') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Condomínio Verde" />
        </div>
        <div>
          <label className={labelClass}>Iniciativas e Resultados</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="🌱 Economia de 18% no consumo de água&#10;🌱 Painéis solares gerando 30% da energia&#10;🌱 Compostagem coletiva implantada" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== CLASSIFICADOS ========
  if (categoryId === 'classificados') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Classificados dos Moradores" />
        </div>
        <div>
          <label className={labelClass}>Anúncios (um por linha: item — preço — apartamento)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="📌 Bicicleta aro 29 — R$ 800 (Apto 302)&#10;📌 Aulas de inglês — (Apto 105)&#10;📌 Sofá 3 lugares — Doação (Apto 701)" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== CARONAS ========
  if (categoryId === 'caronas') {
    const parseCaronas = (text: string): { tipo: string; endereco: string; horario: string; dias: string; vagas: string; dividirGas: boolean; telefone: string; email: string; bloco: string; apartamento: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ tipo: 'oferecer', endereco: '', horario: '', dias: '', vagas: '', dividirGas: false, telefone: '', email: '', bloco: '', apartamento: '' }];
    };
    const caronas = parseCaronas(section.content);
    const updateCaronas = (items: typeof caronas) => {
      update({ content: JSON.stringify(items) });
    };
    const updateItem = (idx: number, field: string, value: string | boolean) => {
      const updated = [...caronas];
      updated[idx] = { ...updated[idx], [field]: value };
      updateCaronas(updated);
    };
    const addItem = () => updateCaronas([...caronas, { tipo: 'oferecer', endereco: '', horario: '', dias: '', vagas: '', dividirGas: false, telefone: '', email: '', bloco: '', apartamento: '' }]);
    const removeItem = (idx: number) => {
      if (caronas.length <= 1) return;
      updateCaronas(caronas.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Caronas Coletivas" />
        </div>
        {caronas.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1E3A5F]">🚗 Carona {idx + 1}</span>
              {caronas.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            {/* Tipo: Oferecer ou Solicitar */}
            <div>
              <label className={labelClass}>Tipo</label>
              <div className="flex gap-2">
                <button onClick={() => updateItem(idx, 'tipo', 'oferecer')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${item.tipo === 'oferecer' ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]' : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'}`}>
                  🚗 Oferecer Carona
                </button>
                <button onClick={() => updateItem(idx, 'tipo', 'solicitar')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${item.tipo === 'solicitar' ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]' : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'}`}>
                  🙋 Solicitar Carona
                </button>
              </div>
            </div>
            {/* Endereço + Mapa */}
            <div>
              <label className={labelClass}>Endereço / Destino *</label>
              <input type="text" value={item.endereco} onChange={e => updateItem(idx, 'endereco', e.target.value)} className={inputClass}
                placeholder="Ex: Av. Paulista, 1000 - São Paulo" />
              {item.endereco.trim() && (
                <div className="mt-2 rounded-xl overflow-hidden border border-[#E2E8F0] h-48 bg-[#F1F5F9]">
                  <iframe
                    title={`Mapa carona ${idx + 1}`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=-46.7,-23.6,-46.6,-23.5&layer=mapnik&marker=-23.55,-46.65`}
                  />
                  <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-[#E2E8F0]">
                    <span className="text-red-500 text-lg">📍</span>
                    <span className="text-xs text-[#1E293B] font-medium">{item.endereco}</span>
                  </div>
                </div>
              )}
            </div>
            {/* Horário + Dias + Vagas */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Horário</label>
                <input type="text" value={item.horario} onChange={e => updateItem(idx, 'horario', e.target.value)} className={inputClass} placeholder="Ex: 7h30" />
              </div>
              <div>
                <label className={labelClass}>Dias</label>
                <input type="text" value={item.dias} onChange={e => updateItem(idx, 'dias', e.target.value)} className={inputClass} placeholder="Ex: Seg a Sex" />
              </div>
              <div>
                <label className={labelClass}>Vagas</label>
                <input type="text" value={item.vagas} onChange={e => updateItem(idx, 'vagas', e.target.value)} className={inputClass} placeholder="Ex: 2" />
              </div>
            </div>
            {/* Dividir gasolina */}
            <div>
              <button onClick={() => updateItem(idx, 'dividirGas', !item.dividirGas)}
                className={`w-full py-3 px-4 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  item.dividirGas
                    ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#D97706]'
                    : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'
                }`}>
                <span className="text-lg">⛽</span>
                Vamos dividir a gasolina?
                {item.dividirGas && <span className="ml-1">✓</span>}
              </button>
            </div>
            {/* Contato */}
            <div className="pt-2 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] mb-2">📞 Contato</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Bloco</label>
                  <input type="text" value={item.bloco} onChange={e => updateItem(idx, 'bloco', e.target.value)} className={inputClass} placeholder="Ex: A" />
                </div>
                <div>
                  <label className={labelClass}>Apartamento</label>
                  <input type="text" value={item.apartamento} onChange={e => updateItem(idx, 'apartamento', e.target.value)} className={inputClass} placeholder="Ex: 201" />
                </div>
                <div>
                  <label className={labelClass}>Telefone / WhatsApp</label>
                  <input type="tel" value={item.telefone} onChange={e => updateItem(idx, 'telefone', e.target.value)} className={inputClass} placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className={labelClass}>E-mail</label>
                  <input type="email" value={item.email} onChange={e => updateItem(idx, 'email', e.target.value)} className={inputClass} placeholder="email@exemplo.com" />
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all">
          + Adicionar carona
        </button>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">💡 Moradores podem oferecer ou solicitar caronas. O endereço aparece no mapa e os vizinhos entram em contato.</p>
      </div>
    );
  }

  // ======== AQUISIÇÕES ========
  if (categoryId === 'aquisicoes') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Novas Aquisições" />
        </div>
        <div>
          <label className={labelClass}>Itens Adquiridos (um por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="🛒 Equipamentos para academia&#10;🛒 Mobiliário do salão de festas&#10;🛒 Desfibrilador na portaria" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== REALIZAÇÕES ========
  if (categoryId === 'realizacoes') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Nossas Realizações" />
        </div>
        <div>
          <label className={labelClass}>Conquistas e Entregas (uma por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="🏆 Redução de 15% nas despesas&#10;🏆 Implantação de energia solar&#10;🏆 Prêmio Melhor Condomínio da região" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== CONHEÇA O SÍNDICO ========
  if (categoryId === 'conheca-sindico') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Conheça o Síndico" />
        </div>
        <div>
          <label className={labelClass}>Nome e Cargo</label>
          <input type="text" value={section.content.split('\n')[0] || ''} onChange={e => {
            const lines = section.content.split('\n');
            lines[0] = e.target.value;
            update({ content: lines.join('\n') });
          }} className={inputClass} placeholder="🏢 Ricardo Mendes — Síndico desde 2024" />
        </div>
        <div>
          <label className={labelClass}>Biografia e Mensagem</label>
          <textarea value={section.content.split('\n').slice(1).join('\n')} onChange={e => {
            const firstLine = section.content.split('\n')[0] || '';
            update({ content: `${firstLine}\n${e.target.value}` });
          }} rows={6} className={`${inputClass} resize-none`}
            placeholder="Formado em Administração, morador há 12 anos...&#10;&#10;&quot;Minha missão é trazer transparência e inovação.&quot;" />
        </div>
        <div>
          <label className={labelClass}>Horário de Atendimento / Contato</label>
          <input type="text" placeholder="Terça e Quinta, 18h às 20h" className={inputClass}
            onChange={e => {
              const base = section.content.replace(/\n🏢 Horário.*$/, '').replace(/\n📧.*$/, '');
              update({ content: `${base}\n🏢 Horário de atendimento: ${e.target.value}` });
            }} />
        </div>
        <ImageManager {...imgProps} />
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">📸 Adicione uma foto do síndico para humanizar a comunicação!</p>
      </div>
    );
  }

  // ======== REGRAS ========
  if (categoryId === 'regras') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Regras e Regulamento" />
        </div>
        <div>
          <label className={labelClass}>Regras e Normas</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={10} className={`${inputClass} resize-none`}
            placeholder="📋 Horário de silêncio: 22h às 7h&#10;📋 Mudanças: seg a sex, 8h às 17h&#10;📋 Pets: sempre na guia nas áreas comuns" />
        </div>
      </div>
    );
  }

  // ======== PETS ========
  if (categoryId === 'pets') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Espaço Pet" />
        </div>
        <div>
          <label className={labelClass}>Informações e Dicas</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="🐾 Horário do pet place: 6h às 22h&#10;🐾 Vacinas em dia são obrigatórias&#10;🐾 Dica: campanha de castração em abril" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== PUBLICIDADE / PRESTADORES / PARCEIROS ========
  if (categoryId === 'publicidade' || categoryId === 'prestadores' || categoryId === 'parceiros') {
    const labels: Record<string, { title: string; placeholder: string }> = {
      publicidade: { title: 'Publicidade Local', placeholder: '🏪 Padaria Pão Quente — Rua das Flores, 45 — 10% desc.\n🏪 Pet Shop Amigão — Rua Central, 12' },
      prestadores: { title: 'Prestadores de Serviço', placeholder: '🔧 Eletricista João — (11) 99999 — Recomendado\n🔧 Encanador Carlos — (11) 98888' },
      parceiros: { title: 'Parceiros e Convênios', placeholder: '🤝 Farmácia Popular — 15% para moradores\n🤝 Academia FitMax — 1ª mensalidade grátis' },
    };
    const cfg = labels[categoryId] || labels.publicidade;
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder={cfg.title} />
        </div>
        <div>
          <label className={labelClass}>Lista (um por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`} placeholder={cfg.placeholder} />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== ENQUETES ========
  if (categoryId === 'enquetes') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título da Enquete</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Enquete do Mês" />
        </div>
        <div>
          <label className={labelClass}>Pergunta e Opções</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="📊 Qual melhoria você mais deseja?&#10;A) Nova academia&#10;B) Brinquedoteca&#10;C) Espaço coworking&#10;D) Horta comunitária" />
        </div>
      </div>
    );
  }

  // ======== ACHADOS E PERDIDOS ========
  if (categoryId === 'achados-perdidos') {
    const parseItens = (text: string): { tipo: string; titulo: string; descricao: string; foto: string; local: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ tipo: 'achado', titulo: '', descricao: '', foto: '', local: '' }];
    };
    const itens = parseItens(section.content);
    const updateItens = (items: typeof itens) => {
      update({ content: JSON.stringify(items) });
    };
    const updateItem = (idx: number, field: string, value: string) => {
      const updated = [...itens];
      updated[idx] = { ...updated[idx], [field]: value };
      updateItens(updated);
    };
    const addItem = () => updateItens([...itens, { tipo: 'achado', titulo: '', descricao: '', foto: '', local: '' }]);
    const removeItem = (idx: number) => {
      if (itens.length <= 1) return;
      updateItens(itens.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título da Seção</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Achados e Perdidos" />
        </div>
        {itens.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1E3A5F]">🔍 Item {idx + 1}</span>
              {itens.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            {/* Tipo */}
            <div>
              <label className={labelClass}>Tipo</label>
              <div className="flex gap-2">
                <button onClick={() => updateItem(idx, 'tipo', 'achado')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${item.tipo === 'achado' ? 'border-[#10B981] bg-[#10B981]/10 text-[#10B981]' : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'}`}>
                  ✅ Achado
                </button>
                <button onClick={() => updateItem(idx, 'tipo', 'perdido')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${item.tipo === 'perdido' ? 'border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444]' : 'border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'}`}>
                  ❌ Perdido
                </button>
              </div>
            </div>
            {/* Foto + Título lado a lado */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {item.foto ? (
                  <div className="relative group w-24 h-24 rounded-xl overflow-hidden bg-[#E2E8F0]">
                    <img src={item.foto} alt={item.titulo || 'Foto'} className="w-full h-full object-cover" />
                    <button onClick={() => updateItem(idx, 'foto', '')}
                      className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">✕</button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-[#E2E8F0] flex items-center justify-center text-[#94A3B8] text-2xl">📷</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className={labelClass}>Título *</label>
                  <input type="text" value={item.titulo} onChange={e => updateItem(idx, 'titulo', e.target.value)} className={inputClass}
                    placeholder="Ex: Chave com chaveiro azul" />
                </div>
                <div>
                  <label className={labelClass}>URL da Foto (opcional)</label>
                  <input type="url" value={item.foto} onChange={e => updateItem(idx, 'foto', e.target.value)} className={inputClass}
                    placeholder="Cole a URL da foto do item..." />
                </div>
              </div>
            </div>
            {/* Descrição */}
            <div>
              <label className={labelClass}>Descrição (opcional)</label>
              <textarea value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} rows={2} className={`${inputClass} resize-none`}
                placeholder="Detalhes do item: cor, tamanho, marca..." />
            </div>
            {/* Onde ir buscar */}
            <div>
              <label className={labelClass}>📍 Onde ir buscar / entregar</label>
              <input type="text" value={item.local} onChange={e => updateItem(idx, 'local', e.target.value)} className={inputClass}
                placeholder="Ex: Portaria do Bloco A, com o porteiro Carlos" />
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all">
          + Adicionar item
        </button>
      </div>
    );
  }

  // ======== MURAL ========
  if (categoryId === 'mural') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Mural de Recados" />
        </div>
        <div>
          <label className={labelClass}>Recados (um por linha)</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="📝 Apto 302: Agradeço a equipe de limpeza!&#10;📝 Apto 105: Procuro babá para fins de semana" />
        </div>
      </div>
    );
  }

  // ======== ESPAÇO KIDS ========
  if (categoryId === 'espaco-kids') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Espaço Kids" />
        </div>
        <div>
          <label className={labelClass}>Atividades e Dicas para Crianças</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="🎨 Oficina de pintura — Sábado, 14h&#10;🎮 Campeonato de jogos — Domingo, 10h&#10;📚 Dica: livros infantis na biblioteca" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== SAÚDE ========
  if (categoryId === 'saude') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Saúde e Bem-estar" />
        </div>
        <div>
          <label className={labelClass}>Dicas e Informações de Saúde</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="❤️ Academia aberta: 6h às 22h&#10;❤️ Aula de yoga: quartas, 7h&#10;❤️ Dica: beba pelo menos 2L de água por dia" />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== ESPAÇO DO MORADOR ========
  if (categoryId === 'espaco-morador') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Espaço do Morador" />
        </div>
        <div>
          <label className={labelClass}>Textos, Histórias e Depoimentos dos Moradores</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={8} className={`${inputClass} resize-none`}
            placeholder="Moramos aqui há 5 anos e adoramos a comunidade..." />
        </div>
        <ImageManager {...imgProps} />
      </div>
    );
  }

  // ======== CHAMADO LINKS ========
  if (categoryId === 'chamado-links') {
    // Parse links from content: each link is "titulo|||imagem|||descricao|||url" per line
    const parseLinks = (text: string) => {
      if (!text.trim()) return [{ titulo: '', imagem: '', descricao: '', url: '' }];
      return text.split('\n').filter(l => l.trim()).map(line => {
        const [titulo = '', imagem = '', descricao = '', url = ''] = line.split('|||');
        return { titulo, imagem, descricao, url };
      });
    };
    const links = parseLinks(section.content);
    const updateLinks = (newLinks: { titulo: string; imagem: string; descricao: string; url: string }[]) => {
      const content = newLinks.map(l => `${l.titulo}|||${l.imagem}|||${l.descricao}|||${l.url}`).join('\n');
      update({ content });
    };
    const updateLink = (idx: number, field: string, value: string) => {
      const updated = [...links];
      updated[idx] = { ...updated[idx], [field]: value };
      updateLinks(updated);
    };
    const addLink = () => updateLinks([...links, { titulo: '', imagem: '', descricao: '', url: '' }]);
    const removeLink = (idx: number) => {
      if (links.length <= 1) return;
      updateLinks(links.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título da Seção</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Links Úteis" />
        </div>
        {links.map((link, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1E3A5F]">Link {idx + 1}</span>
              {links.length > 1 && (
                <button onClick={() => removeLink(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            <div>
              <label className={labelClass}>Título *</label>
              <input type="text" value={link.titulo} onChange={e => updateLink(idx, 'titulo', e.target.value)} className={inputClass} placeholder="Ex: Portal do Condomínio" />
            </div>
            <div>
              <label className={labelClass}>Link (URL) *</label>
              <input type="url" value={link.url} onChange={e => updateLink(idx, 'url', e.target.value)} className={inputClass} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>Descrição (opcional)</label>
              <input type="text" value={link.descricao} onChange={e => updateLink(idx, 'descricao', e.target.value)} className={inputClass} placeholder="Breve descrição do link..." />
            </div>
            <div>
              <label className={labelClass}>Imagem (opcional)</label>
              <input type="url" value={link.imagem} onChange={e => updateLink(idx, 'imagem', e.target.value)} className={inputClass} placeholder="URL da imagem de capa..." />
              {link.imagem && (
                <div className="mt-2 h-20 rounded-lg overflow-hidden bg-[#F1F5F9] w-32">
                  <img src={link.imagem} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        ))}
        <button onClick={addLink} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-all">
          + Adicionar outro link
        </button>
      </div>
    );
  }

  // ======== CAPA DA REVISTA ========
  if (categoryId === 'capa-revista') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título sobre a foto</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Ex: Edição Março 2026" />
        </div>
        <div>
          <label className={labelClass}>Descrição sobre a foto</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={3} className={`${inputClass} resize-none`}
            placeholder="Ex: As novidades do seu condomínio nesta edição" />
        </div>
        <div>
          <label className={labelClass}>Foto de Capa</label>
          {section.images.length > 0 ? (
            <div className="relative group rounded-xl overflow-hidden h-56 bg-[#F1F5F9] mb-3">
              <img src={section.images[0]} alt="Capa" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5">
                <h4 className="text-white text-xl font-bold drop-shadow-lg">{section.title || 'Título da Capa'}</h4>
                {section.content && <p className="text-white/80 text-sm mt-1 drop-shadow">{section.content}</p>}
              </div>
              <button
                onClick={() => onRemoveImage(0)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >✕</button>
            </div>
          ) : (
            <div className="h-40 border-2 border-dashed border-[#CBD5E1] rounded-xl flex items-center justify-center text-[#94A3B8] text-sm mb-3">
              📷 Adicione a foto de capa abaixo
            </div>
          )}
          <div className="flex gap-2">
            <input type="url" value={newImageUrl} onChange={e => onImageUrlChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAddImage(); } }}
              placeholder="Cole a URL da foto de capa..." className={`flex-1 ${inputClass}`} />
            <button onClick={() => { onAddImage(); }} disabled={!newImageUrl.trim()}
              className="px-3 py-2 bg-[#1E3A5F] text-white text-xs font-medium rounded-lg hover:bg-[#2A5A8F] disabled:opacity-40 flex-shrink-0">📷 Capa</button>
          </div>
        </div>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">💡 A foto será exibida como capa da revista com o título e descrição sobrepostos.</p>
      </div>
    );
  }

  // ======== AVALIAÇÕES ========
  if (categoryId === 'avaliacoes') {
    const parseAvaliacoes = (text: string): { pergunta: string; descricao: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ pergunta: '', descricao: '' }];
    };
    const avaliacoes = parseAvaliacoes(section.content);
    const updateAvaliacoes = (items: typeof avaliacoes) => {
      update({ content: JSON.stringify(items) });
    };
    const updateItem = (idx: number, field: string, value: string) => {
      const updated = [...avaliacoes];
      updated[idx] = { ...updated[idx], [field]: value };
      updateAvaliacoes(updated);
    };
    const addItem = () => updateAvaliacoes([...avaliacoes, { pergunta: '', descricao: '' }]);
    const removeItem = (idx: number) => {
      if (avaliacoes.length <= 1) return;
      updateAvaliacoes(avaliacoes.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Avaliações do Condomínio" />
        </div>
        {avaliacoes.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F59E0B]">⭐ Avaliação {idx + 1}</span>
              {avaliacoes.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            <div>
              <label className={labelClass}>Pergunta / Item a avaliar *</label>
              <input type="text" value={item.pergunta} onChange={e => updateItem(idx, 'pergunta', e.target.value)} className={inputClass}
                placeholder="Ex: Como você avalia a limpeza das áreas comuns?" />
            </div>
            <div>
              <label className={labelClass}>Descrição (opcional)</label>
              <input type="text" value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} className={inputClass}
                placeholder="Ex: Considere corredores, hall e garagem" />
            </div>
            <div>
              <label className={labelClass}>Escala de nota</label>
              <div className="flex items-center gap-1 mt-1">
                {Array.from({ length: 11 }, (_, n) => (
                  <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                    n === 0 ? 'bg-red-100 border-red-200 text-red-600'
                    : n <= 3 ? 'bg-orange-100 border-orange-200 text-orange-600'
                    : n <= 6 ? 'bg-yellow-100 border-yellow-200 text-yellow-700'
                    : n <= 8 ? 'bg-lime-100 border-lime-200 text-lime-700'
                    : 'bg-green-100 border-green-200 text-green-700'
                  }`}>{n}</div>
                ))}
              </div>
              <p className="text-[10px] text-[#94A3B8] mt-1">Preview — moradores escolhem de 0 a 10</p>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all">
          + Adicionar avaliação
        </button>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">💡 Os moradores verão cada pergunta na revista e poderão dar notas de 0 a 10.</p>
      </div>
    );
  }

  // ======== TELEFONES ÚTEIS ========
  if (categoryId === 'telefones-uteis') {
    const parseTelefones = (text: string): { nome: string; telefone: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ nome: '', telefone: '' }];
    };
    const telefones = parseTelefones(section.content);
    const updateTelefones = (items: typeof telefones) => {
      update({ content: JSON.stringify(items) });
    };
    const updateItem = (idx: number, field: string, value: string) => {
      const updated = [...telefones];
      updated[idx] = { ...updated[idx], [field]: value };
      updateTelefones(updated);
    };
    const addItem = () => updateTelefones([...telefones, { nome: '', telefone: '' }]);
    const removeItem = (idx: number) => {
      if (telefones.length <= 1) return;
      updateTelefones(telefones.filter((_, i) => i !== idx));
    };
    const copyPhone = (phone: string) => {
      navigator.clipboard.writeText(phone);
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Telefones Úteis" />
        </div>
        {telefones.map((item, idx) => (
          <div key={idx} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#0EA5E9]">📞 Contato {idx + 1}</span>
              {telefones.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            <div>
              <label className={labelClass}>Nome</label>
              <input type="text" value={item.nome} onChange={e => updateItem(idx, 'nome', e.target.value)} className={inputClass}
                placeholder="Ex: Portaria, Polícia, SAMU, Síndico..." />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <div className="flex gap-2">
                <input type="tel" value={item.telefone} onChange={e => updateItem(idx, 'telefone', e.target.value)} className={`flex-1 ${inputClass}`}
                  placeholder="(11) 99999-9999" />
                {item.telefone.trim() && (
                  <button onClick={() => copyPhone(item.telefone)} title="Copiar telefone"
                    className="px-3 py-2 bg-[#0EA5E9]/10 text-[#0EA5E9] text-xs font-medium rounded-lg hover:bg-[#0EA5E9]/20 transition-all flex items-center gap-1 flex-shrink-0">
                    📋 Copiar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#0EA5E9] hover:text-[#0EA5E9] transition-all">
          + Adicionar telefone
        </button>
      </div>
    );
  }

  // ======== QR CODES PÚBLICOS ========
  if (categoryId === 'qrcode-publico') {
    const presets = [
      { label: '📖 Ver a Revista', desc: 'Morador escaneia e visualiza a revista digital', url: '/demo/revista' },
      { label: '📢 Abrir Reclamação', desc: 'Morador abre chamado de reclamação', url: '/demo/morador' },
      { label: '🔧 Informar Problema', desc: 'Morador reporta problema de manutenção', url: '/demo/morador' },
      { label: '📱 Área do Morador', desc: 'Acesso ao painel do morador', url: '/demo/morador' },
    ];

    const parseQrs = (text: string): { titulo: string; descricao: string; url: string; tipo: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ titulo: '', descricao: '', url: '', tipo: 'personalizado' }];
    };
    const qrs = parseQrs(section.content);
    const updateQrs = (items: typeof qrs) => {
      update({ content: JSON.stringify(items) });
    };
    const updateItem = (idx: number, field: string, value: string) => {
      const updated = [...qrs];
      updated[idx] = { ...updated[idx], [field]: value };
      updateQrs(updated);
    };
    const addItem = () => updateQrs([...qrs, { titulo: '', descricao: '', url: '', tipo: 'personalizado' }]);
    const addPreset = (preset: typeof presets[0]) => {
      updateQrs([...qrs, { titulo: preset.label.replace(/^\S+\s/, ''), descricao: preset.desc, url: typeof window !== 'undefined' ? `${window.location.origin}${preset.url}` : preset.url, tipo: 'preset' }]);
    };
    const removeItem = (idx: number) => {
      if (qrs.length <= 1) return;
      updateQrs(qrs.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="QR Codes do Condomínio" />
        </div>
        {/* Atalhos rápidos */}
        <div>
          <label className={labelClass}>Atalhos Rápidos</label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p, i) => (
              <button key={i} onClick={() => addPreset(p)}
                className="p-2 rounded-lg border border-[#E2E8F0] text-left hover:border-[#7C3AED] hover:bg-[#7C3AED]/5 transition-all">
                <span className="text-sm font-medium text-[#1E293B]">{p.label}</span>
                <p className="text-[10px] text-[#94A3B8] mt-0.5">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
        {/* QR Codes criados */}
        {qrs.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#7C3AED]">📱 QR Code {idx + 1}</span>
              {qrs.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            <div className="flex gap-4">
              {/* Preview do QR */}
              <div className="flex-shrink-0">
                {item.url.trim() ? (
                  <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                    <QRCodeSVG value={item.url} size={120} bgColor="#ffffff" fgColor="#1E293B" level="M" />
                  </div>
                ) : (
                  <div className="w-[144px] h-[144px] bg-[#E2E8F0] rounded-xl flex items-center justify-center text-[#94A3B8] text-3xl">
                    📱
                  </div>
                )}
              </div>
              {/* Campos */}
              <div className="flex-1 space-y-2">
                <div>
                  <label className={labelClass}>Título do QR Code</label>
                  <input type="text" value={item.titulo} onChange={e => updateItem(idx, 'titulo', e.target.value)} className={inputClass}
                    placeholder="Ex: Acesse a Revista" />
                </div>
                <div>
                  <label className={labelClass}>URL / Link *</label>
                  <input type="url" value={item.url} onChange={e => updateItem(idx, 'url', e.target.value)} className={inputClass}
                    placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>Descrição (opcional)</label>
                  <input type="text" value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} className={inputClass}
                    placeholder="O que o morador verá ao escanear" />
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all">
          + Adicionar QR Code personalizado
        </button>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">💡 Os QR Codes aparecerão na revista. Moradores podem escanear com a câmera do celular para acessar o conteúdo.</p>
      </div>
    );
  }

  // ======== MURAL DE QR CODES ========
  if (categoryId === 'mural-qrcodes') {
    const parseQrs = (text: string): { titulo: string; descricao: string; url: string; icone: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ titulo: '', descricao: '', url: '', icone: '📱' }];
    };
    const qrs = parseQrs(section.content);
    const updateQrs = (items: typeof qrs) => {
      update({ content: JSON.stringify(items) });
    };
    const updateItem = (idx: number, field: string, value: string) => {
      const updated = [...qrs];
      updated[idx] = { ...updated[idx], [field]: value };
      updateQrs(updated);
    };
    const addItem = () => updateQrs([...qrs, { titulo: '', descricao: '', url: '', icone: '📱' }]);
    const removeItem = (idx: number) => {
      if (qrs.length <= 1) return;
      updateQrs(qrs.filter((_, i) => i !== idx));
    };
    const icones = ['📱', '📖', '📢', '🔧', '🏠', '📋', '💰', '🎉', '🔒', '⭐'];

    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Mural de QR Codes" />
        </div>
        {/* Link para a página pública */}
        <div className="p-4 bg-gradient-to-r from-[#6D28D9]/10 to-[#7C3AED]/10 rounded-xl border border-[#7C3AED]/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#6D28D9]">📱 Página Pública dos QR Codes</p>
              <p className="text-xs text-[#64748B] mt-0.5">Os moradores acessam essa página para ver todos os QR Codes</p>
            </div>
            <a href="/demo/qrcodes" target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-[#6D28D9] text-white text-xs font-medium rounded-lg hover:bg-[#7C3AED] transition-all flex items-center gap-1 flex-shrink-0">
              🔗 Abrir Página
            </a>
          </div>
        </div>
        {/* QR Codes */}
        {qrs.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6D28D9]">📱 QR Code {idx + 1}</span>
              {qrs.length > 1 && (
                <button onClick={() => removeItem(idx)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            <div className="flex gap-4 items-start">
              {/* Preview QR */}
              <div className="flex-shrink-0">
                {item.url.trim() ? (
                  <div className="bg-white p-2 rounded-xl border border-[#E2E8F0] shadow-sm">
                    <QRCodeSVG value={item.url} size={96} bgColor="#ffffff" fgColor="#1E293B" level="M" />
                  </div>
                ) : (
                  <div className="w-[112px] h-[112px] bg-[#E2E8F0] rounded-xl flex items-center justify-center text-[#94A3B8] text-2xl">📱</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <label className={labelClass}>Ícone</label>
                  <div className="flex gap-1 flex-wrap">
                    {icones.map(ic => (
                      <button key={ic} onClick={() => updateItem(idx, 'icone', ic)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${item.icone === ic ? 'bg-[#6D28D9]/10 border-2 border-[#6D28D9] scale-110' : 'bg-white border border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Título *</label>
                  <input type="text" value={item.titulo} onChange={e => updateItem(idx, 'titulo', e.target.value)} className={inputClass}
                    placeholder="Ex: Acessar a Revista" />
                </div>
                <div>
                  <label className={labelClass}>URL / Link *</label>
                  <input type="url" value={item.url} onChange={e => updateItem(idx, 'url', e.target.value)} className={inputClass}
                    placeholder="https://..." />
                </div>
                <div>
                  <label className={labelClass}>Descrição (opcional)</label>
                  <input type="text" value={item.descricao} onChange={e => updateItem(idx, 'descricao', e.target.value)} className={inputClass}
                    placeholder="O que acontece ao escanear" />
                </div>
              </div>
            </div>
          </div>
        ))}
        <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#6D28D9] hover:text-[#6D28D9] transition-all">
          + Adicionar QR Code ao mural
        </button>
      </div>
    );
  }

  // ======== BOAS-VINDAS ========
  if (categoryId === 'boas-vindas') {
    const parseItems = (text: string): { nome: string; unidade: string; mensagem: string }[] => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
      return [{ nome: '', unidade: '', mensagem: '' }];
    };
    const items = parseItems(section.content);
    const updateItems = (list: typeof items) => update({ content: JSON.stringify(list) });
    const updateItem = (idx: number, field: string, value: string) => {
      const updated = [...items];
      updated[idx] = { ...updated[idx], [field]: value };
      updateItems(updated);
    };
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Boas-Vindas aos Novos Moradores" />
        </div>
        {items.map((item, idx) => (
          <div key={idx} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#E879F9]">🎉 Morador {idx + 1}</span>
              {items.length > 1 && (
                <button onClick={() => updateItems(items.filter((_, i) => i !== idx))} className="text-xs text-red-500 hover:text-red-700">Remover</button>
              )}
            </div>
            <div>
              <label className={labelClass}>Nome</label>
              <input type="text" value={item.nome} onChange={e => updateItem(idx, 'nome', e.target.value)} className={inputClass} placeholder="Família Silva" />
            </div>
            <div>
              <label className={labelClass}>Unidade</label>
              <input type="text" value={item.unidade} onChange={e => updateItem(idx, 'unidade', e.target.value)} className={inputClass} placeholder="Apt 301 — Bloco B" />
            </div>
            <div>
              <label className={labelClass}>Mensagem de boas-vindas</label>
              <textarea value={item.mensagem} onChange={e => updateItem(idx, 'mensagem', e.target.value)} rows={2} className={`${inputClass} resize-none`}
                placeholder="Sejam muito bem-vindos ao nosso condomínio!" />
            </div>
          </div>
        ))}
        <button onClick={() => updateItems([...items, { nome: '', unidade: '', mensagem: '' }])}
          className="w-full py-2 border-2 border-dashed border-[#CBD5E1] rounded-xl text-sm font-medium text-[#64748B] hover:border-[#E879F9] hover:text-[#E879F9] transition-all">
          + Adicionar Morador
        </button>
        <ImageManager {...imgProps} />
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">📸 Adicione fotos dos novos moradores (com autorização) para deixar a seção mais pessoal!</p>
      </div>
    );
  }

  // ======== AGENDAMENTO DE MUDANÇAS ========
  if (categoryId === 'agendamento-mudancas') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Agendamento de Mudanças" />
        </div>
        <div>
          <label className={labelClass}>Regras e Horários Permitidos</label>
          <textarea value={section.content.split('\n---\n')[0] || ''} onChange={e => {
            const parts = section.content.split('\n---\n');
            parts[0] = e.target.value;
            update({ content: parts.join('\n---\n') });
          }} rows={6} className={`${inputClass} resize-none`}
            placeholder="📦 Horários permitidos: Seg a Sex, 8h às 17h&#10;📦 Sábados: 8h às 12h&#10;📦 Domingos e feriados: NÃO permitido&#10;📦 Agendar com 48h de antecedência na portaria&#10;📦 Proteger elevadores com manta" />
        </div>
        <div>
          <label className={labelClass}>Próximas Mudanças Agendadas</label>
          <textarea value={section.content.split('\n---\n')[1] || ''} onChange={e => {
            const parts = section.content.split('\n---\n');
            parts[1] = e.target.value;
            update({ content: [parts[0] || '', e.target.value].join('\n---\n') });
          }} rows={4} className={`${inputClass} resize-none`}
            placeholder="🚚 15/04 — Apt 204 Bloco A — Manhã&#10;🚚 18/04 — Apt 502 Bloco C — Tarde" />
        </div>
        <div>
          <label className={labelClass}>Contato para Agendamento</label>
          <input type="text" value={section.content.split('\n---\n')[2] || ''} onChange={e => {
            const parts = section.content.split('\n---\n');
            parts[2] = e.target.value;
            update({ content: [parts[0] || '', parts[1] || '', e.target.value].join('\n---\n') });
          }} className={inputClass} placeholder="Portaria: (11) 3333-4444 ou WhatsApp" />
        </div>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">🚚 Mantenha esta seção atualizada para evitar conflitos de horários entre moradores!</p>
      </div>
    );
  }

  // ======== AGENDAMENTO DE REFORMAS ========
  if (categoryId === 'agendamento-reformas') {
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Agendamento de Reformas" />
        </div>
        <div>
          <label className={labelClass}>Regras para Reformas</label>
          <textarea value={section.content.split('\n---\n')[0] || ''} onChange={e => {
            const parts = section.content.split('\n---\n');
            parts[0] = e.target.value;
            update({ content: parts.join('\n---\n') });
          }} rows={6} className={`${inputClass} resize-none`}
            placeholder="🔨 Horários: Seg a Sex, 8h às 17h&#10;🔨 Sábados: 8h às 12h (sem barulho pesado)&#10;🔨 Solicitar autorização com 72h de antecedência&#10;🔨 Apresentar ART/RRT para reformas estruturais&#10;🔨 Entulho: retirar no mesmo dia" />
        </div>
        <div>
          <label className={labelClass}>Reformas em Andamento</label>
          <textarea value={section.content.split('\n---\n')[1] || ''} onChange={e => {
            const parts = section.content.split('\n---\n');
            parts[1] = e.target.value;
            update({ content: [parts[0] || '', e.target.value].join('\n---\n') });
          }} rows={4} className={`${inputClass} resize-none`}
            placeholder="🔨 Apt 101 Bloco B — Reforma banheiro — até 30/04&#10;🔨 Apt 803 Bloco A — Troca de piso — até 15/04" />
        </div>
        <div>
          <label className={labelClass}>Contato / Como Solicitar</label>
          <input type="text" value={section.content.split('\n---\n')[2] || ''} onChange={e => {
            const parts = section.content.split('\n---\n');
            parts[2] = e.target.value;
            update({ content: [parts[0] || '', parts[1] || '', e.target.value].join('\n---\n') });
          }} className={inputClass} placeholder="Enviar pedido por e-mail para sindico@condominio.com" />
        </div>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">🔨 Inclua regras claras sobre documentação necessária (ART/RRT) para reformas estruturais!</p>
      </div>
    );
  }

  // ======== GESTÃO DE FUNCIONÁRIOS ========
  if (categoryId === 'gestao-funcionarios') {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-[#0D9488]/10 to-[#10B981]/10 p-4 rounded-xl border border-[#0D9488]/20">
          <h3 className="font-semibold text-[#0D9488] text-sm mb-2">👷 Gestão de Funcionários</h3>
          <p className="text-xs text-[#64748B]">Gerencie tarefas, checklists, vistorias e acompanhe funcionários em tempo real com QR Code e GPS.</p>
          <a href="/revista/funcionarios" className="inline-block mt-3 px-4 py-2 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-[#0F766E] transition-all">
            Abrir Tarefas Agendadas →
          </a>
        </div>
        <div>
          <label className={labelClass}>Título da Seção</label>
          <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Gestão de Funcionários" />
        </div>
        <div>
          <label className={labelClass}>Descrição Geral</label>
          <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={4} className={`${inputClass} resize-none`} placeholder="Descreva a equipe operacional do condomínio..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['📸 Antes e Depois', '✅ Checklist', '📋 Tarefas', '🔍 Vistorias'].map(t => (
            <div key={t} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center">
              <span className="text-sm font-medium text-[#1E293B]">{t}</span>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">QR Code automático</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#94A3B8] bg-[#F8FAFC] p-3 rounded-lg">📍 Todas as tarefas registram geolocalização, data/hora de início e término automaticamente quando o funcionário escaneia o QR Code.</p>
      </div>
    );
  }

  // ======== FALLBACK (genérico) ========
  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Título</label>
        <input type="text" value={section.title} onChange={e => update({ title: e.target.value })} className={inputClass} placeholder="Título da seção" />
      </div>
      <div>
        <label className={labelClass}>Conteúdo</label>
        <textarea value={section.content} onChange={e => update({ content: e.target.value })} rows={10} className={`${inputClass} resize-none`} placeholder="Escreva o conteúdo..." />
      </div>
      <ImageManager {...imgProps} />
    </div>
  );
}
