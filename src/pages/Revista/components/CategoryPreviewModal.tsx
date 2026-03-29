import { motion } from 'framer-motion';

interface CategoryPreviewModalProps {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  onClose: () => void;
}

function PhoneFrame({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[300px] h-[560px] bg-[#1A1A2E] rounded-[2.5rem] p-2 shadow-2xl border-2 border-[#2A2A4A]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#1A1A2E] rounded-b-2xl z-20" />
        <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white flex flex-col">
          <div className="flex items-center justify-between px-5 py-1.5 text-[9px] font-semibold text-white" style={{ backgroundColor: color }}>
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <div className="w-3 h-2 border border-white/60 rounded-[1px]"><div className="w-2 h-1.5 bg-white/60 rounded-[0.5px]" /></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
          <div className="flex justify-center py-1.5">
            <div className="w-24 h-1 rounded-full bg-[#E2E8F0]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ======== 39 CATEGORIAS — Conteúdo funcional real ========

function MockEditorial({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>CS</div>
        <div>
          <div className="text-[10px] font-bold text-[#1E293B]">Palavra do Síndico</div>
          <div className="text-[8px] text-[#94A3B8]">Carlos Santos · Março 2026</div>
        </div>
      </div>
      <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: `${color}08` }}>
        <p className="text-[9px] text-[#334155] leading-relaxed">
          Prezados moradores, é com grande satisfação que apresentamos mais uma edição da nossa revista digital. Neste mês, trazemos novidades sobre as obras de revitalização, nosso balanço financeiro transparente e muito mais.
        </p>
        <p className="text-[9px] text-[#334155] leading-relaxed mt-2">
          Sua participação é fundamental para construirmos juntos um condomínio cada vez melhor. Boa leitura!
        </p>
      </div>
      <div className="text-[8px] text-[#94A3B8] italic">&ldquo;Transparência e proximidade são nossos pilares.&rdquo;</div>
    </div>
  );
}

function MockFinanceiro({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">💰 Prestação de Contas — Fev/2026</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: 'Receita Total', valor: 'R$ 85.000', icon: '📈', cor: '#10B981' },
          { label: 'Despesas Fixas', valor: 'R$ 52.000', icon: '📉', cor: '#EF4444' },
          { label: 'Saldo Positivo', valor: 'R$ 14.500', icon: '✅', cor: color },
          { label: 'Inadimplência', valor: '3,2%', icon: '⚠️', cor: '#F59E0B' },
        ].map((item, i) => (
          <div key={i} className="p-2.5 rounded-xl border border-[#E2E8F0]">
            <div className="text-[8px] text-[#94A3B8]">{item.icon} {item.label}</div>
            <div className="text-[12px] font-bold" style={{ color: item.cor }}>{item.valor}</div>
          </div>
        ))}
      </div>
      <div className="p-2.5 rounded-xl bg-green-50 border border-green-100">
        <div className="text-[8px] text-green-700">✅ Redução de 12% no consumo de energia</div>
        <div className="text-[8px] text-green-700">✅ Fundo de reserva: R$ 180.000,00</div>
      </div>
      <div className="h-20 rounded-xl border border-[#E2E8F0] p-2 flex items-end gap-1.5 mt-2">
        {[40, 65, 50, 80, 70, 90, 60, 75, 85, 55, 95, 70].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 11 ? color : `${color}33` }} />
        ))}
      </div>
      <div className="text-[7px] text-[#94A3B8] text-center mt-1">Jan — Dez 2026</div>
    </div>
  );
}

function MockGaleria({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-1">📸 Galeria de Fotos</div>
      <div className="text-[8px] text-[#94A3B8] mb-3">Março 2026 · 12 fotos</div>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { emoji: '🏊', label: 'Piscina revitalizada' },
          { emoji: '🌳', label: 'Novo paisagismo' },
          { emoji: '🎨', label: 'Pintura fachada' },
          { emoji: '🏋️', label: 'Academia nova' },
          { emoji: '🎪', label: 'Festa junina' },
          { emoji: '🌺', label: 'Jardim central' },
        ].map((item, i) => (
          <div key={i} className={`rounded-xl overflow-hidden ${i === 0 ? 'col-span-2 h-24' : 'h-20'}`}
            style={{ backgroundColor: `${color}${10 + i * 5}` }}>
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-[7px] text-[#475569] mt-0.5">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAntesDepois({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🔄 Antes e Depois</div>
      <div className="flex gap-2 mb-2">
        <div className="flex-1 rounded-xl overflow-hidden border-2 border-red-200">
          <div className="bg-red-50 text-center py-0.5 text-[8px] font-bold text-red-500">ANTES</div>
          <div className="h-28 bg-red-50/50 flex flex-col items-center justify-center">
            <span className="text-2xl">🏚️</span>
            <span className="text-[7px] text-red-400 mt-1">Parede com manchas</span>
          </div>
        </div>
        <div className="flex-1 rounded-xl overflow-hidden border-2 border-green-200">
          <div className="bg-green-50 text-center py-0.5 text-[8px] font-bold text-green-500">DEPOIS</div>
          <div className="h-28 bg-green-50/50 flex flex-col items-center justify-center">
            <span className="text-2xl">🏡</span>
            <span className="text-[7px] text-green-500 mt-1">Pintura renovada</span>
          </div>
        </div>
      </div>
      <div className="text-[9px] font-bold text-[#1E293B]">Pintura do Hall — Bloco A</div>
      <div className="text-[8px] text-[#94A3B8]">Realizado em 10/03/2026 · Zelador José</div>
      <div className="mt-2 p-2 rounded-lg bg-green-50 text-[8px] text-green-700">✅ 3 transformações este mês</div>
    </div>
  );
}

function MockEquipe({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">👥 Nossa Equipe</div>
      {[
        { nome: 'Carlos Santos', cargo: 'Síndico', ini: 'CS' },
        { nome: 'José da Silva', cargo: 'Zelador · 15 anos', ini: 'JS' },
        { nome: 'Maria Oliveira', cargo: 'Porteira Diurna', ini: 'MO' },
        { nome: 'Roberto Santos', cargo: 'Jardineiro', ini: 'RS' },
      ].map((p, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>{p.ini}</div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-[#1E293B]">{p.nome}</div>
            <div className="text-[8px] text-[#94A3B8]">{p.cargo}</div>
          </div>
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-[10px]">📱</div>
        </div>
      ))}
    </div>
  );
}

function MockObras({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🏗️ Obras em Andamento</div>
      {[
        { titulo: 'Reforma da Piscina + Deck', progresso: 75, prazo: 'Abril 2026' },
        { titulo: 'Playground Infantil', progresso: 40, prazo: 'Maio 2026' },
        { titulo: 'Pintura Fachada Bloco A e B', progresso: 100, prazo: 'Concluída ✅' },
      ].map((obra, i) => (
        <div key={i} className="p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex justify-between items-center mb-1">
            <div className="text-[10px] font-bold text-[#1E293B]">{obra.titulo}</div>
            <div className="text-[9px] font-bold" style={{ color }}>{obra.progresso}%</div>
          </div>
          <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden mb-1">
            <div className="h-full rounded-full" style={{ width: `${obra.progresso}%`, backgroundColor: obra.progresso === 100 ? '#10B981' : color }} />
          </div>
          <div className="text-[7px] text-[#94A3B8]">Prazo: {obra.prazo}</div>
        </div>
      ))}
    </div>
  );
}

function MockComunicados({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📢 Comunicados</div>
      {[
        { titulo: 'Assembleia Ordinária', texto: 'Dia 25/03 às 19h no salão de festas. Pauta: aprovação de contas e eleição do conselho.', tipo: 'Importante', tempo: '2h' },
        { titulo: 'Manutenção dos Elevadores', texto: 'Dias 15 e 16/03 os elevadores ficarão em manutenção preventiva das 8h às 12h.', tipo: 'Urgente', tempo: '5h' },
        { titulo: 'Novo Horário da Piscina', texto: 'A partir de abril, o horário da piscina será das 7h às 22h.', tipo: 'Informativo', tempo: '1d' },
      ].map((c, i) => (
        <div key={i} className="p-3 rounded-xl border-l-4 bg-[#F8FAFC] mb-2" style={{ borderLeftColor: color }}>
          <div className="text-[10px] font-bold text-[#1E293B]">{c.titulo}</div>
          <div className="text-[8px] text-[#475569] mt-1 leading-relaxed">{c.texto}</div>
          <div className="text-[7px] text-[#94A3B8] mt-1.5">{c.tipo} · {c.tempo} atrás</div>
        </div>
      ))}
    </div>
  );
}

function MockEventos({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🎉 Próximos Eventos</div>
      {[
        { dia: '15', mes: 'MAR', nome: 'Feira de Trocas', local: 'Hall de Entrada · 10h', desc: 'Traga itens em bom estado para trocar com vizinhos!' },
        { dia: '22', mes: 'MAR', nome: 'Aula de Yoga', local: 'Jardim Central · 8h', desc: 'Gratuita para moradores. Traga seu tapete.' },
        { dia: '29', mes: 'MAR', nome: 'Festa de Páscoa', local: 'Salão de Festas · 15h', desc: 'Atividades para crianças: caça aos ovos e pintura.' },
      ].map((ev, i) => (
        <div key={i} className="p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-[8px] font-bold flex-shrink-0" style={{ backgroundColor: color }}>
              <span className="text-[11px] leading-none">{ev.dia}</span>
              <span className="text-[6px]">{ev.mes}</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#1E293B]">{ev.nome}</div>
              <div className="text-[8px] text-[#94A3B8]">{ev.local}</div>
              <div className="text-[8px] text-[#64748B] mt-0.5">{ev.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockRegras({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📋 Regras do Condomínio</div>
      {[
        { titulo: 'Horário de Silêncio', texto: 'Das 22h às 7h (dias úteis) e das 22h às 9h (finais de semana). Obras apenas dias úteis das 8h às 17h.' },
        { titulo: 'Uso da Piscina', texto: 'Obrigatório uso de touca. Crianças menores de 12 anos acompanhadas. Proibido alimentos de vidro.' },
        { titulo: 'Animais de Estimação', texto: 'Permitido 1 animal por unidade (até 15kg). Elevador de serviço obrigatório. Recolher dejetos.' },
        { titulo: 'Garagem', texto: 'Velocidade máxima 10 km/h. Proibido lavar ou reparar veículos nas áreas comuns.' },
      ].map((r, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="text-[9px] font-bold text-[#1E293B] mb-0.5">{r.titulo}</div>
          <div className="text-[8px] text-[#64748B] leading-relaxed">{r.texto}</div>
        </div>
      ))}
    </div>
  );
}

function MockEspacoKids({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🧸 Espaço Kids</div>
      <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: `${color}10` }}>
        <div className="text-[9px] font-bold mb-1" style={{ color }}>🕐 Horário de Funcionamento</div>
        <div className="text-[8px] text-[#475569]">Segunda a Sexta: 8h às 20h</div>
        <div className="text-[8px] text-[#475569]">Sábado e Domingo: 9h às 21h</div>
      </div>
      <div className="text-[9px] font-bold text-[#1E293B] mb-2">Atividades da Semana</div>
      {[
        { dia: 'Terça 15h', ativ: 'Contação de Histórias', icon: '📚' },
        { dia: 'Quinta 16h', ativ: 'Oficina de Artes', icon: '🎨' },
        { dia: 'Sábado 10h', ativ: 'Cinema Infantil', icon: '🎬' },
      ].map((a, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#E2E8F0] mb-1.5">
          <span className="text-sm">{a.icon}</span>
          <div>
            <div className="text-[9px] font-bold text-[#1E293B]">{a.ativ}</div>
            <div className="text-[7px] text-[#94A3B8]">{a.dia}</div>
          </div>
        </div>
      ))}
      <div className="mt-2 p-2 rounded-lg bg-yellow-50 text-[8px] text-yellow-700">⚠ Crianças menores de 6 anos devem estar acompanhadas por responsável.</div>
    </div>
  );
}

function MockSustentabilidade({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🌱 Condomínio Verde</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { icon: '💧', label: 'Água', valor: '-18%', desc: 'Sensores automáticos' },
          { icon: '⚡', label: 'Energia', valor: '-30%', desc: 'Painéis solares' },
          { icon: '♻️', label: 'Reciclagem', valor: '82%', desc: 'Adesão dos aptos' },
          { icon: '🌿', label: 'Compostagem', valor: '45kg', desc: 'Esta semana' },
        ].map((m, i) => (
          <div key={i} className="p-2.5 rounded-xl border border-[#E2E8F0] text-center">
            <div className="text-lg">{m.icon}</div>
            <div className="text-[11px] font-bold" style={{ color }}>{m.valor}</div>
            <div className="text-[7px] text-[#94A3B8]">{m.desc}</div>
          </div>
        ))}
      </div>
      <div className="p-2.5 rounded-xl bg-green-50 text-[8px] text-green-700">
        🎯 Meta 2026: Reduzir pegada de carbono em 25%
      </div>
    </div>
  );
}

function MockSeguranca({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🔒 Segurança</div>
      <div className="p-3 rounded-xl border border-green-200 bg-green-50/50 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🛡️</span>
          <div>
            <div className="text-[10px] font-bold text-green-700">Tudo tranquilo</div>
            <div className="text-[8px] text-green-600">Última ocorrência há 15 dias</div>
          </div>
        </div>
      </div>
      <div className="text-[9px] font-bold text-[#1E293B] mb-2">Novidades</div>
      <div className="text-[8px] text-[#475569] leading-relaxed mb-2">
        ✅ 12 novas câmeras HD instaladas<br/>
        ✅ Reconhecimento facial na portaria<br/>
        ✅ App de controle de acesso para visitantes
      </div>
      <div className="p-2.5 rounded-xl bg-yellow-50 border border-yellow-100">
        <div className="text-[9px] font-bold text-yellow-700">⚠ Dicas de Segurança</div>
        <div className="text-[8px] text-yellow-600 mt-0.5">Sempre feche portões ao passar. Registre visitantes na portaria.</div>
      </div>
    </div>
  );
}

function MockPets({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🐾 Pets do Condomínio</div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { nome: 'Rex', raca: 'Labrador', apto: 'Apt 201', emoji: '🐕' },
          { nome: 'Mia', raca: 'Siamês', apto: 'Apt 305', emoji: '🐈' },
          { nome: 'Thor', raca: 'Golden', apto: 'Apt 402', emoji: '🐕‍🦺' },
          { nome: 'Luna', raca: 'Persa', apto: 'Apt 601', emoji: '🐱' },
        ].map((pet, i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="h-14 flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
              <span className="text-2xl">{pet.emoji}</span>
            </div>
            <div className="p-2">
              <div className="text-[10px] font-bold text-[#1E293B]">{pet.nome}</div>
              <div className="text-[7px] text-[#94A3B8]">{pet.raca} · {pet.apto}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 rounded-lg text-[8px] text-[#64748B]" style={{ backgroundColor: `${color}08` }}>
        🐾 Regras: Elevador de serviço obrigatório. Recolher dejetos nas áreas comuns.
      </div>
    </div>
  );
}

function MockSaude({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🏥 Saúde e Bem-estar</div>
      {[
        { titulo: 'Campanha de Vacinação — Gripe', texto: 'Dia 20/03 no hall de entrada, das 9h às 16h. Traga documento com foto.', icon: '💉' },
        { titulo: 'Aula de Ginástica (gratuita)', texto: 'Terça e Quinta às 7h no jardim. Prof. Ana Maria — CREF 12345.', icon: '🏃' },
        { titulo: 'Primeiros Socorros', texto: 'Desfibrilador (DEA) disponível na portaria 24h. Treinamento em abril.', icon: '🩺' },
      ].map((item, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{item.icon}</span>
            <div className="text-[9px] font-bold text-[#1E293B]">{item.titulo}</div>
          </div>
          <div className="text-[8px] text-[#64748B] leading-relaxed">{item.texto}</div>
        </div>
      ))}
    </div>
  );
}

function MockClassificados({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🏷️ Classificados</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { nome: 'Bicicleta aro 29', preco: 'R$ 800', apto: 'Apt 302', emoji: '🚲', tipo: 'Venda' },
          { nome: 'Sofá 3 lugares', preco: 'Doação', apto: 'Apt 701', emoji: '🛋️', tipo: 'Doação' },
          { nome: 'Aulas de Inglês', preco: 'R$ 80/h', apto: 'Apt 105', emoji: '📚', tipo: 'Serviço' },
          { nome: 'Air Fryer 4L', preco: 'R$ 200', apto: 'Apt 503', emoji: '🍳', tipo: 'Venda' },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="h-14 flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
              <span className="text-lg">{item.emoji}</span>
            </div>
            <div className="p-2">
              <div className="text-[9px] font-bold text-[#1E293B]">{item.nome}</div>
              <div className="text-[10px] font-bold" style={{ color }}>{item.preco}</div>
              <div className="text-[7px] text-[#94A3B8]">{item.apto} · {item.tipo}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPublicidade({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📣 Espaço Publicitário</div>
      {[
        { nome: 'Pizzaria Bella Napoli', desc: '10% de desconto para moradores! Peça pelo app.', tel: '(11) 3456-7890', icon: '🍕' },
        { nome: 'Pet Shop AuMiau', desc: 'Banho e tosa com busca grátis no condomínio.', tel: '(11) 2345-6789', icon: '🐾' },
        { nome: 'Dra. Carla — Dentista', desc: 'Clareamento com condições especiais. CRO 45678.', tel: '(11) 9876-5432', icon: '🦷' },
      ].map((ad, i) => (
        <div key={i} className="p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{ad.icon}</span>
            <div className="text-[10px] font-bold text-[#1E293B]">{ad.nome}</div>
          </div>
          <div className="text-[8px] text-[#64748B] mb-1">{ad.desc}</div>
          <div className="text-[8px] font-bold" style={{ color }}>📞 {ad.tel}</div>
        </div>
      ))}
      <div className="text-[7px] text-center text-[#94A3B8] mt-2">Anuncie aqui! Fale com a administração.</div>
    </div>
  );
}

function MockPrestadores({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🔧 Prestadores de Serviço</div>
      {[
        { nome: 'Sr. Paulo', area: 'Eletricista', avaliacao: '⭐ 4.9', tel: '(11) 98765-1234', icon: '⚡' },
        { nome: 'Sr. Marcos', area: 'Encanador', avaliacao: '⭐ 4.7', tel: '(11) 98765-5678', icon: '🔧' },
        { nome: 'Sr. Antônio', area: 'Pintor', avaliacao: '⭐ 4.8', tel: '(11) 98765-9012', icon: '🎨' },
        { nome: 'Dona Maria', area: 'Faxineira', avaliacao: '⭐ 5.0', tel: '(11) 98765-3456', icon: '🧹' },
      ].map((p, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${color}10` }}>{p.icon}</div>
          <div className="flex-1">
            <div className="text-[9px] font-bold text-[#1E293B]">{p.nome}</div>
            <div className="text-[7px] text-[#94A3B8]">{p.area} · {p.avaliacao}</div>
          </div>
          <div className="px-2 py-1 rounded-md text-[7px] font-bold text-white" style={{ backgroundColor: color }}>Ligar</div>
        </div>
      ))}
    </div>
  );
}

function MockAchadosPerdidos({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🔍 Achados e Perdidos</div>
      <div className="flex gap-2 mb-3">
        <div className="flex-1 py-1.5 rounded-lg text-center text-[9px] font-bold text-white" style={{ backgroundColor: color }}>Achados (3)</div>
        <div className="flex-1 py-1.5 rounded-lg text-center text-[9px] font-bold text-[#64748B] bg-[#F1F5F9]">Perdidos (2)</div>
      </div>
      {[
        { item: 'Chave com chaveiro azul', local: 'Achado na portaria em 12/03', icone: '🔑', status: 'Achado' },
        { item: 'Óculos de sol Ray-Ban', local: 'Perdido na piscina em 10/03', icone: '👓', status: 'Perdido' },
        { item: 'Guarda-chuva preto', local: 'Achado no hall Bloco B em 08/03', icone: '☂️', status: 'Achado' },
      ].map((item, i) => (
        <div key={i} className="flex gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
            <span className="text-lg">{item.icone}</span>
          </div>
          <div>
            <div className="text-[9px] font-bold text-[#1E293B]">{item.item}</div>
            <div className="text-[8px] text-[#94A3B8]">{item.local}</div>
            <div className="text-[7px] font-bold mt-0.5" style={{ color: item.status === 'Achado' ? '#10B981' : '#F59E0B' }}>{item.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockEnquetes({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📊 Enquete do Mês</div>
      <div className="p-3 rounded-xl border border-[#E2E8F0] mb-3">
        <div className="text-[10px] font-bold text-[#1E293B] mb-2">Qual melhoria priorizar em 2026?</div>
        {[
          { opcao: 'Reforma da Piscina', votos: 42 },
          { opcao: 'Novo Playground', votos: 28 },
          { opcao: 'Salão de Festas', votos: 18 },
          { opcao: 'Modernizar Portaria', votos: 12 },
        ].map((opt, i) => (
          <div key={i} className="mb-1.5">
            <div className="flex justify-between text-[8px] mb-0.5">
              <span className="text-[#475569]">{opt.opcao}</span>
              <span className="font-bold" style={{ color }}>{opt.votos}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${opt.votos}%`, backgroundColor: i === 0 ? color : `${color}66` }} />
            </div>
          </div>
        ))}
        <div className="text-[7px] text-[#94A3B8] mt-2">127 votos · Encerra em 5 dias</div>
      </div>
      <div className="px-3 py-2 rounded-lg text-center text-[9px] font-bold text-white" style={{ backgroundColor: color }}>Votar Agora</div>
    </div>
  );
}

function MockDicasSindico({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">💡 Dicas do Síndico</div>
      {[
        { titulo: 'Economia na conta de luz', texto: 'Desligue luzes ao sair. Use lâmpadas LED. Aproveite a luz natural sempre que possível.', icon: '💡' },
        { titulo: 'Manutenção preventiva', texto: 'Verifique registros e torneiras periodicamente. Vazamentos pequenos geram grandes custos.', icon: '🔧' },
        { titulo: 'Convivência harmoniosa', texto: 'Respeite o horário de silêncio. Avise vizinhos sobre festas com antecedência.', icon: '🤝' },
      ].map((dica, i) => (
        <div key={i} className="p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{dica.icon}</span>
            <div className="text-[10px] font-bold text-[#1E293B]">{dica.titulo}</div>
          </div>
          <div className="text-[8px] text-[#64748B] leading-relaxed">{dica.texto}</div>
        </div>
      ))}
    </div>
  );
}

function MockEspacoMorador({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🏠 Espaço do Morador</div>
      <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: `${color}08` }}>
        <div className="text-[9px] font-bold mb-1" style={{ color }}>📝 Depoimento do Mês</div>
        <div className="text-[8px] text-[#475569] italic">&ldquo;Moro aqui há 5 anos e a gestão atual transformou o condomínio. Parabéns a todos!&rdquo;</div>
        <div className="text-[7px] text-[#94A3B8] mt-1">— Ana Paula, Apt 405</div>
      </div>
      {[
        { nome: 'Receita: Bolo de Cenoura', autor: 'Dona Maria — Apt 302', icon: '🍰' },
        { nome: 'Dica de Livro: O Alquimista', autor: 'Pedro — Apt 508', icon: '📖' },
        { nome: 'Playlist do Mês', autor: 'Lucas — Apt 201', icon: '🎵' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-[#E2E8F0] mb-1.5">
          <span className="text-sm">{item.icon}</span>
          <div>
            <div className="text-[9px] font-bold text-[#1E293B]">{item.nome}</div>
            <div className="text-[7px] text-[#94A3B8]">{item.autor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockMural({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📌 Mural de Recados</div>
      {[
        { autor: 'Fernanda — Apt 302', texto: 'Alguém sabe de diarista? Precisando para sexta-feira!', tempo: '2h', respostas: 4 },
        { autor: 'Carlos — Apt 105', texto: 'Agradeço ao zelador José pelo conserto rápido do portão. Excelente trabalho!', tempo: '5h', respostas: 8 },
        { autor: 'Ana — Apt 701', texto: 'Vamos organizar um grupo de corrida matinal? Quem topa? 🏃‍♀️', tempo: '1d', respostas: 12 },
      ].map((msg, i) => (
        <div key={i} className="p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: color }}>
              {msg.autor.charAt(0)}
            </div>
            <div>
              <div className="text-[9px] font-bold text-[#1E293B]">{msg.autor}</div>
              <div className="text-[7px] text-[#94A3B8]">{msg.tempo} atrás</div>
            </div>
          </div>
          <div className="text-[8px] text-[#475569] leading-relaxed">{msg.texto}</div>
          <div className="text-[7px] mt-1.5" style={{ color }}>💬 {msg.respostas} respostas</div>
        </div>
      ))}
    </div>
  );
}

function MockParceiros({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🤝 Parceiros do Condomínio</div>
      {[
        { nome: 'Supermercado Bom Preço', beneficio: '5% de desconto em compras acima de R$100', icon: '🛒', cat: 'Alimentação' },
        { nome: 'Drogaria Saúde+', beneficio: 'Entrega gratuita para moradores', icon: '💊', cat: 'Saúde' },
        { nome: 'Lavanderia Express', beneficio: '15% de desconto na 1ª utilização', icon: '👔', cat: 'Serviços' },
        { nome: 'Auto Center Rápido', beneficio: 'Troca de óleo grátis na revisão completa', icon: '🚗', cat: 'Automotivo' },
      ].map((p, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{p.icon}</span>
            <div className="text-[9px] font-bold text-[#1E293B]">{p.nome}</div>
            <div className="ml-auto text-[7px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{p.cat}</div>
          </div>
          <div className="text-[8px] text-[#64748B]">🎁 {p.beneficio}</div>
        </div>
      ))}
    </div>
  );
}

function MockCaronas({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🚗 Caronas Coletivas</div>
      <div className="h-24 rounded-xl bg-[#E8F4FD] mb-3 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl">🗺️</span>
          <div className="text-[7px] text-[#64748B] mt-0.5">Mapa de rotas</div>
        </div>
      </div>
      {[
        { motorista: 'Carlos — Apt 201', destino: 'Av. Paulista', horario: 'Seg-Sex · 7h30', vagas: 2 },
        { motorista: 'Ana — Apt 405', destino: 'Metrô Butantã', horario: 'Seg-Sex · 8h00', vagas: 3 },
        { motorista: 'Roberto — Apt 602', destino: 'Shopping Morumbi', horario: 'Sáb · 10h00', vagas: 2 },
      ].map((c, i) => (
        <div key={i} className="p-2.5 rounded-xl border border-[#E2E8F0] mb-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: color }}>
            {c.motorista.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-bold text-[#1E293B]">{c.destino}</div>
            <div className="text-[7px] text-[#94A3B8]">{c.motorista} · {c.horario}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold" style={{ color }}>{c.vagas}</div>
            <div className="text-[6px] text-[#94A3B8]">vagas</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockAquisicoes({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🛒 Novas Aquisições</div>
      {[
        { item: 'Esteiras e Bicicletas — Academia', data: 'Março 2026', valor: 'R$ 12.000', icon: '🏋️' },
        { item: 'Mobiliário — Salão de Festas', data: 'Fevereiro 2026', valor: 'R$ 8.500', icon: '🪑' },
        { item: 'Sistema de Automação — Iluminação', data: 'Janeiro 2026', valor: 'R$ 15.000', icon: '💡' },
        { item: 'Desfibrilador (DEA) — Portaria', data: 'Janeiro 2026', valor: 'R$ 5.200', icon: '🩺' },
      ].map((a, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${color}10` }}>{a.icon}</div>
          <div className="flex-1">
            <div className="text-[9px] font-bold text-[#1E293B]">{a.item}</div>
            <div className="text-[7px] text-[#94A3B8]">{a.data} · {a.valor}</div>
          </div>
        </div>
      ))}
      <div className="p-2 rounded-lg text-[8px] text-center" style={{ backgroundColor: `${color}08`, color }}>Total investido em 2026: R$ 40.700</div>
    </div>
  );
}

function MockRealizacoes({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🏆 Nossas Realizações</div>
      {[
        { texto: 'Redução de 15% nas despesas condominiais', icon: '📉' },
        { texto: 'Implantação do sistema de energia solar', icon: '☀️' },
        { texto: 'Revitalização completa da área de lazer', icon: '🏊' },
        { texto: 'Programa "Vizinho Solidário" criado', icon: '🤝' },
        { texto: 'Nota A+ na auditoria de contas', icon: '📊' },
        { texto: 'Prêmio "Melhor Condomínio" da região', icon: '🥇' },
      ].map((r, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg mb-1.5" style={{ backgroundColor: i === 0 ? `${color}10` : 'transparent' }}>
          <span className="text-sm">{r.icon}</span>
          <div className="text-[9px] text-[#334155]">{r.texto}</div>
        </div>
      ))}
    </div>
  );
}

function MockSemanaCondominio({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📅 Semana do Condomínio</div>
      {[
        { dia: 'Segunda', ativ: 'Manutenção preventiva dos elevadores', icon: '🔧' },
        { dia: 'Terça', ativ: 'Reunião do conselho fiscal', icon: '📋' },
        { dia: 'Quarta', ativ: 'Limpeza especial da garagem B2', icon: '🧹' },
        { dia: 'Quinta', ativ: 'Visita técnica — paisagismo', icon: '🌳' },
        { dia: 'Sexta', ativ: 'Inauguração do espaço gourmet', icon: '🍽️' },
        { dia: 'Sábado', ativ: 'Feira orgânica no jardim', icon: '🥬' },
        { dia: 'Domingo', ativ: 'Cinema ao ar livre', icon: '🎬' },
      ].map((d, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border-b border-[#F1F5F9]">
          <div className="w-16 text-[8px] font-bold" style={{ color }}>{d.dia}</div>
          <span className="text-sm">{d.icon}</span>
          <div className="text-[8px] text-[#475569]">{d.ativ}</div>
        </div>
      ))}
    </div>
  );
}

function MockConhecaSindico({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">👤 Conheça o Síndico</div>
      <div className="flex flex-col items-center mb-3">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-2" style={{ backgroundColor: color }}>RM</div>
        <div className="text-[11px] font-bold text-[#1E293B]">Ricardo Mendes</div>
        <div className="text-[8px] text-[#94A3B8]">Síndico desde 2024 · Morador há 12 anos</div>
      </div>
      <div className="p-3 rounded-xl mb-3" style={{ backgroundColor: `${color}08` }}>
        <div className="text-[8px] text-[#475569] italic leading-relaxed">
          &ldquo;Minha missão é trazer transparência, inovação e proximidade com cada morador. Formado em Administração pela USP, me dedico a tornar nosso condomínio cada vez melhor.&rdquo;
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[8px] text-[#475569]">🏢 Atendimento: Terça e Quinta, 18h às 20h</div>
        <div className="flex items-center gap-2 text-[8px] text-[#475569]">📧 sindico@jardimdasflores.com.br</div>
        <div className="flex items-center gap-2 text-[8px] text-[#475569]">📱 (11) 99999-0001</div>
      </div>
    </div>
  );
}

function MockBenfeitorias({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">⭐ Benfeitorias Realizadas</div>
      {[
        { texto: 'Tomadas USB nas áreas comuns', data: 'Mar/2026', icon: '🔌' },
        { texto: 'Iluminação LED nos corredores (−40% energia)', data: 'Fev/2026', icon: '💡' },
        { texto: 'Impermeabilização Blocos C e D', data: 'Jan/2026', icon: '🏗️' },
        { texto: 'Reforma dos banheiros do salão', data: 'Dez/2025', icon: '🚿' },
        { texto: 'Ar-condicionado e espelhos na academia', data: 'Nov/2025', icon: '❄️' },
        { texto: 'Pintura artística no muro da entrada', data: 'Out/2025', icon: '🎨' },
      ].map((b, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#E2E8F0] mb-1.5">
          <span className="text-sm">{b.icon}</span>
          <div className="flex-1">
            <div className="text-[8px] font-bold text-[#1E293B]">{b.texto}</div>
            <div className="text-[7px] text-[#94A3B8]">{b.data}</div>
          </div>
          <span className="text-[10px]">✅</span>
        </div>
      ))}
    </div>
  );
}

function MockLinks({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🔗 Links Úteis</div>
      {[
        { nome: 'Portal do Condomínio', desc: 'Acesse boletos, atas e documentos', icon: '🌐' },
        { nome: '2ª Via de Boleto', desc: 'Gere seu boleto atualizado', icon: '💳' },
        { nome: 'Reserva de Espaço', desc: 'Agende salão, churrasqueira e quadra', icon: '📅' },
        { nome: 'Regulamento Interno', desc: 'Convenção e regimento atualizado', icon: '📄' },
      ].map((link, i) => (
        <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}10` }}>
            <span className="text-sm">{link.icon}</span>
          </div>
          <div className="flex-1">
            <div className="text-[9px] font-bold text-[#1E293B]">{link.nome}</div>
            <div className="text-[7px] text-[#94A3B8]">{link.desc}</div>
          </div>
          <span className="text-[12px]" style={{ color }}>→</span>
        </div>
      ))}
    </div>
  );
}

function MockCapaRevista({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: `${color}44` }}>
        <div className="p-4 text-center text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}>
          <div className="text-[8px] tracking-widest uppercase opacity-70">Residencial Jardim das Flores</div>
          <div className="text-[16px] font-bold mt-1">APP REVISTA</div>
          <div className="text-[9px] opacity-80 mt-0.5">Edição #3 · Março 2026</div>
        </div>
        <div className="p-3 bg-white">
          <div className="text-[9px] font-bold text-[#1E293B] mb-2">Nesta Edição:</div>
          {['Reforma da piscina: 75% concluída', 'Balanço financeiro positivo', 'Nova academia inaugurada', 'Feira de trocas dia 15/03'].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <div className="text-[8px] text-[#475569]">{item}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockAvaliacoes({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">⭐ Avaliações</div>
      {[
        { pergunta: 'Como está a limpeza das áreas comuns?', media: 8.2, votos: 45 },
        { pergunta: 'Satisfação com a portaria?', media: 9.1, votos: 52 },
        { pergunta: 'Qualidade da manutenção?', media: 7.5, votos: 38 },
      ].map((av, i) => (
        <div key={i} className="p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="text-[9px] font-bold text-[#1E293B] mb-1.5">{av.pergunta}</div>
          <div className="flex gap-0.5 mb-1">
            {[...Array(10)].map((_, j) => (
              <div key={j} className={`w-5 h-5 rounded-md flex items-center justify-center text-[7px] font-bold ${j < Math.round(av.media) ? 'text-white' : 'text-[#CBD5E1] border border-[#E2E8F0]'}`}
                style={j < Math.round(av.media) ? { backgroundColor: color } : {}}>
                {j + 1}
              </div>
            ))}
          </div>
          <div className="text-[7px] text-[#94A3B8]">Média: <span className="font-bold" style={{ color }}>{av.media}</span> · {av.votos} votos</div>
        </div>
      ))}
    </div>
  );
}

function MockTelefones({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📞 Telefones Úteis</div>
      {[
        { nome: 'Portaria 24h', tel: '(11) 3456-7890', icon: '🏢' },
        { nome: 'Zelador José', tel: '(11) 98888-1111', icon: '🔧' },
        { nome: 'Síndico Ricardo', tel: '(11) 99999-0001', icon: '👔' },
        { nome: 'SAMU', tel: '192', icon: '🚑' },
        { nome: 'Bombeiros', tel: '193', icon: '🚒' },
        { nome: 'Polícia Militar', tel: '190', icon: '🚔' },
        { nome: 'CET / Trânsito', tel: '1188', icon: '🚦' },
      ].map((t, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-xl border border-[#E2E8F0] mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">{t.icon}</span>
            <div className="text-[9px] font-bold text-[#1E293B]">{t.nome}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-[#64748B]">{t.tel}</span>
            <div className="px-1.5 py-0.5 rounded-md text-[7px] font-bold text-white" style={{ backgroundColor: color }}>Ligar</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockQRCode({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">📱 QR Codes do Condomínio</div>
      {[
        { titulo: 'Acessar Revista Digital', desc: 'Escaneie para ler a edição de março' },
        { titulo: 'Área do Morador', desc: 'Abra chamados e classificados' },
        { titulo: 'Wi-Fi Visitantes', desc: 'Conecte-se à rede do condomínio' },
      ].map((qr, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-12 h-12 rounded-lg border border-[#E2E8F0] flex items-center justify-center" style={{ backgroundColor: `${color}06` }}>
            <div className="grid grid-cols-4 gap-0.5">
              {[...Array(16)].map((_, j) => (
                <div key={j} className="w-1.5 h-1.5 rounded-[1px]" style={{ backgroundColor: (j + i) % 3 === 0 ? '#1E293B' : 'transparent' }} />
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-bold text-[#1E293B]">{qr.titulo}</div>
            <div className="text-[7px] text-[#94A3B8]">{qr.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockBoasVindas({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🎉 Boas-Vindas!</div>
      <div className="p-3 rounded-xl mb-3" style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)` }}>
        <div className="text-[9px] text-[#475569] leading-relaxed">
          Bem-vindos ao Residencial Jardim das Flores! Estamos felizes em tê-los como nossos novos vizinhos. 🏠
        </div>
      </div>
      {[
        { nome: 'Família Rodriguez', apto: 'Apt 204 — Bloco B', data: 'Março 2026' },
        { nome: 'Sr. Tanaka', apto: 'Apt 601 — Bloco A', data: 'Março 2026' },
      ].map((m, i) => (
        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E2E8F0] mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
            {m.nome.charAt(0)}
          </div>
          <div>
            <div className="text-[9px] font-bold text-[#1E293B]">{m.nome}</div>
            <div className="text-[7px] text-[#94A3B8]">{m.apto} · {m.data}</div>
          </div>
          <span className="ml-auto text-sm">👋</span>
        </div>
      ))}
      <div className="text-center text-[8px] mt-2" style={{ color }}>Bem-vindos à nossa comunidade! 🎊</div>
    </div>
  );
}

function MockAgendamentoMudancas({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🚚 Agendamento de Mudanças</div>
      <div className="p-2.5 rounded-xl mb-3" style={{ backgroundColor: `${color}08` }}>
        <div className="text-[9px] font-bold mb-1" style={{ color }}>📋 Regras para Mudança</div>
        <div className="text-[8px] text-[#475569] leading-relaxed">
          • Horário: Segunda a Sábado, 8h às 17h<br/>
          • Agendar com 48h de antecedência<br/>
          • Elevador de serviço reservado<br/>
          • Proteção obrigatória nas áreas comuns
        </div>
      </div>
      <div className="text-[9px] font-bold text-[#1E293B] mb-2">Próximas Mudanças</div>
      {[
        { data: '15/04', info: 'Apt 204 — Bloco B · Manhã (8h–12h)' },
        { data: '18/04', info: 'Apt 502 — Bloco A · Tarde (13h–17h)' },
        { data: '22/04', info: 'Apt 701 — Bloco C · Manhã (8h–12h)' },
      ].map((m, i) => (
        <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-lg border border-[#E2E8F0]">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: color }}>{m.data.split('/')[0]}</div>
          <div className="text-[8px] text-[#475569]">{m.info}</div>
        </div>
      ))}
    </div>
  );
}

function MockAgendamentoReformas({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">🔨 Agendamento de Reformas</div>
      <div className="p-2.5 rounded-xl mb-3" style={{ backgroundColor: `${color}08` }}>
        <div className="text-[9px] font-bold mb-1" style={{ color }}>📋 Regras para Reformas</div>
        <div className="text-[8px] text-[#475569] leading-relaxed">
          • Somente dias úteis, 8h às 17h<br/>
          • Comunicar administração com 15 dias de antecedência<br/>
          • Apresentar ART/RRT do responsável<br/>
          • Proibido impacto estrutural sem laudo
        </div>
      </div>
      <div className="text-[9px] font-bold text-[#1E293B] mb-2">Reformas em Andamento</div>
      {[
        { apto: 'Apt 101', tipo: 'Banheiro social', prazo: 'até 30/04', status: 'Em andamento' },
        { apto: 'Apt 803', tipo: 'Troca de piso', prazo: 'até 15/04', status: 'Em andamento' },
        { apto: 'Apt 305', tipo: 'Cozinha', prazo: 'Concluída', status: 'Finalizada ✅' },
      ].map((r, i) => (
        <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-lg border border-[#E2E8F0]">
          <span className="text-sm">🔨</span>
          <div className="flex-1">
            <div className="text-[8px] font-bold text-[#1E293B]">{r.apto} — {r.tipo}</div>
            <div className="text-[7px] text-[#94A3B8]">{r.prazo}</div>
          </div>
          <div className="text-[7px] font-bold" style={{ color: r.status.includes('✅') ? '#10B981' : color }}>{r.status}</div>
        </div>
      ))}
    </div>
  );
}

function MockFuncionarios({ color }: { color: string }) {
  return (
    <div className="p-4">
      <div className="text-[11px] font-bold text-[#1E293B] mb-3">👷 Gestão de Funcionários</div>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[
          { label: 'Tarefas Hoje', valor: '7', icon: '📋' },
          { label: 'Concluídas', valor: '4', icon: '✅' },
          { label: 'Em Execução', valor: '2', icon: '🔄' },
          { label: 'Pendentes', valor: '1', icon: '⏳' },
        ].map((s, i) => (
          <div key={i} className="p-2 rounded-lg border border-[#E2E8F0] text-center">
            <div className="text-sm">{s.icon}</div>
            <div className="text-[12px] font-bold" style={{ color }}>{s.valor}</div>
            <div className="text-[7px] text-[#94A3B8]">{s.label}</div>
          </div>
        ))}
      </div>
      {[
        { nome: 'José da Silva', cargo: 'Zelador', tarefa: 'Pintura do Hall — Bloco A', status: '✅ Finalizado' },
        { nome: 'Fernanda Lima', cargo: 'Limpeza', tarefa: 'Checklist Diário', status: '🔄 Em Exec.' },
        { nome: 'Roberto Santos', cargo: 'Jardineiro', tarefa: 'Poda das árvores frontais', status: '📸 Antes/Dep.' },
      ].map((e, i) => (
        <div key={i} className="flex items-center gap-2 mb-2 p-2 rounded-lg border border-[#E2E8F0]">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: color }}>
            {e.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold text-[#1E293B] truncate">{e.tarefa}</div>
            <div className="text-[7px] text-[#94A3B8]">{e.nome} · {e.cargo}</div>
          </div>
          <div className="text-[7px] font-semibold whitespace-nowrap" style={{ color }}>{e.status}</div>
        </div>
      ))}
      <div className="mt-2 p-2 rounded-lg" style={{ backgroundColor: `${color}08` }}>
        <div className="text-[8px] text-center" style={{ color }}>📍 GPS · ⏱ Controle de tempo · 📱 QR Code</div>
      </div>
    </div>
  );
}

// ======== Mapa de todas as 39 categorias ========

const categoryMockups: Record<string, (color: string) => React.ReactNode> = {
  'editorial':            (c) => <MockEditorial color={c} />,
  'financeiro':           (c) => <MockFinanceiro color={c} />,
  'galeria':              (c) => <MockGaleria color={c} />,
  'antes-depois':         (c) => <MockAntesDepois color={c} />,
  'equipe':               (c) => <MockEquipe color={c} />,
  'obras':                (c) => <MockObras color={c} />,
  'comunicados':          (c) => <MockComunicados color={c} />,
  'eventos':              (c) => <MockEventos color={c} />,
  'regras':               (c) => <MockRegras color={c} />,
  'espaco-kids':          (c) => <MockEspacoKids color={c} />,
  'sustentabilidade':     (c) => <MockSustentabilidade color={c} />,
  'seguranca':            (c) => <MockSeguranca color={c} />,
  'pets':                 (c) => <MockPets color={c} />,
  'saude':                (c) => <MockSaude color={c} />,
  'classificados':        (c) => <MockClassificados color={c} />,
  'publicidade':          (c) => <MockPublicidade color={c} />,
  'prestadores':          (c) => <MockPrestadores color={c} />,
  'achados-perdidos':     (c) => <MockAchadosPerdidos color={c} />,
  'enquetes':             (c) => <MockEnquetes color={c} />,
  'dicas-sindico':        (c) => <MockDicasSindico color={c} />,
  'espaco-morador':       (c) => <MockEspacoMorador color={c} />,
  'mural':                (c) => <MockMural color={c} />,
  'parceiros':            (c) => <MockParceiros color={c} />,
  'caronas':              (c) => <MockCaronas color={c} />,
  'aquisicoes':           (c) => <MockAquisicoes color={c} />,
  'realizacoes':          (c) => <MockRealizacoes color={c} />,
  'semana-condominio':    (c) => <MockSemanaCondominio color={c} />,
  'conheca-sindico':      (c) => <MockConhecaSindico color={c} />,
  'benfeitorias':         (c) => <MockBenfeitorias color={c} />,
  'chamado-links':        (c) => <MockLinks color={c} />,
  'capa-revista':         (c) => <MockCapaRevista color={c} />,
  'avaliacoes':           (c) => <MockAvaliacoes color={c} />,
  'telefones-uteis':      (c) => <MockTelefones color={c} />,
  'qrcode-publico':       (c) => <MockQRCode color={c} />,
  'mural-qrcodes':        (c) => <MockQRCode color={c} />,
  'boas-vindas':          (c) => <MockBoasVindas color={c} />,
  'agendamento-mudancas': (c) => <MockAgendamentoMudancas color={c} />,
  'agendamento-reformas': (c) => <MockAgendamentoReformas color={c} />,
  'gestao-funcionarios':  (c) => <MockFuncionarios color={c} />,
};

export default function CategoryPreviewModal({ categoryId, categoryName, categoryColor, onClose }: CategoryPreviewModalProps) {
  const renderMockup = categoryMockups[categoryId];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: categoryColor }}>
            {categoryName.charAt(0)}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{categoryName}</h3>
            <p className="text-[10px] text-white/40 uppercase tracking-wider">👁 Visão do Morador</p>
          </div>
          <button onClick={onClose}
            className="ml-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Phone Mockup */}
        <PhoneFrame color={categoryColor}>
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-[#E2E8F0]" style={{ backgroundColor: `${categoryColor}08` }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[8px] font-bold" style={{ backgroundColor: categoryColor }}>
              {categoryName.charAt(0)}
            </div>
            <div>
              <div className="text-[9px] font-bold text-[#1E293B]">Residencial Jardim das Flores</div>
              <div className="text-[7px] text-[#94A3B8]">Edição #3 · Março 2026</div>
            </div>
          </div>
          {renderMockup ? renderMockup(categoryColor) : (
            <div className="p-4 text-center text-[10px] text-[#94A3B8]">Prévia não disponível</div>
          )}
        </PhoneFrame>
      </motion.div>
    </motion.div>
  );
}
