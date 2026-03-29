import { MagazineSection, Condominium } from '../types';

interface Props {
  section: MagazineSection;
  condo: Condominium;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getElapsed(start?: string, end?: string): string {
  if (!start || !end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return '';
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return `${Math.floor(ms / 60000)}min`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days} dia${days > 1 ? 's' : ''}`;
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const tipoLabels: Record<string, { label: string; color: string }> = {
  manutencao: { label: 'Manutenção', color: '#F59E0B' },
  reclamacao: { label: 'Reclamação', color: '#EF4444' },
  sugestao: { label: 'Sugestão', color: '#3B82F6' },
  outros: { label: 'Outros', color: '#6B7280' },
};

export default function SpecialSection({ section, condo }: Props) {
  const { richData } = section;
  if (!richData) return null;

  /* ── EQUIPE EM AÇÃO ── */
  if (richData.type === 'equipe-em-acao') {
    const byFunc: Record<string, any[]> = {};
    for (const item of richData.items) {
      const nome = item.funcionario_nome || item.funcionarioNome || 'Funcionário';
      if (!byFunc[nome]) byFunc[nome] = [];
      byFunc[nome].push(item);
    }
    const employees = Object.entries(byFunc);

    return (
      <div>
        {/* Resumo */}
        <div style={{
          background: `${condo.accentColor}18`,
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          border: `1px solid ${condo.accentColor}40`,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Tarefas concluídas no mês</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: condo.accentColor, lineHeight: 1 }}>{richData.items.length}</div>
          </div>
          <div style={{ width: 1, height: 40, background: `${condo.accentColor}30` }} />
          <div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Funcionários ativos</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: condo.themeColor, lineHeight: 1 }}>{employees.length}</div>
          </div>
        </div>

        {/* Employees */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {employees.map(([nome, tarefas]) => (
            <div key={nome}>
              {/* Employee header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: condo.themeColor, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 15, flexShrink: 0,
                }}>
                  {initials(nome)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>{nome}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    <span style={{
                      backgroundColor: `${condo.accentColor}20`, color: condo.accentColor,
                      padding: '1px 8px', borderRadius: 20, fontWeight: 600, fontSize: 11,
                    }}>
                      ✅ {tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''} concluída{tarefas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 56 }}>
                {tarefas.map((t: any, i: number) => (
                  <div key={i} style={{
                    background: '#F8FAFC', borderRadius: 10, padding: '12px 14px',
                    borderLeft: `3px solid ${condo.accentColor}`,
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1E293B', marginBottom: 4 }}>
                      {t.tarefa_titulo || t.tarefaTitulo || 'Tarefa'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>📅 {formatDate(t.data_execucao || t.dataExecucao)}</span>
                      {(t.hora_execucao || t.horaExecucao) && (
                        <span>🕐 {t.hora_execucao || t.horaExecucao}</span>
                      )}
                      <span style={{
                        backgroundColor: '#D1FAE5', color: '#065F46',
                        padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      }}>✅ Concluída</span>
                    </div>
                    {t.observacao && (
                      <div style={{
                        fontSize: 12, color: '#475569', fontStyle: 'italic',
                        borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 8,
                      }}>
                        💬 "{t.observacao}"
                      </div>
                    )}
                    {(t.fotos || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        {(t.fotos as string[]).slice(0, 4).map((foto: string, fi: number) => (
                          <div key={fi} style={{
                            width: 80, height: 60, borderRadius: 8,
                            overflow: 'hidden', position: 'relative', flexShrink: 0,
                          }}>
                            <img src={foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {richData.items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔧</div>
            <div style={{ fontSize: 14 }}>Nenhuma tarefa registrada ainda este mês.</div>
          </div>
        )}
      </div>
    );
  }

  /* ── ATENDEMOS VOCÊ ── */
  if (richData.type === 'moradores-atendidos') {
    return (
      <div>
        {/* Resumo */}
        <div style={{
          background: '#D1FAE518',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 24,
          border: '1px solid #D1FAE5',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Chamados resolvidos</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>{richData.items.length}</div>
          </div>
          {richData.resumo?.tempoMedio && (
            <>
              <div style={{ width: 1, height: 40, background: '#D1FAE5' }} />
              <div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Tempo médio</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#065F46' }}>{richData.resumo.tempoMedio}</div>
              </div>
            </>
          )}
          {richData.resumo?.satisfacao && (
            <>
              <div style={{ width: 1, height: 40, background: '#D1FAE5' }} />
              <div>
                <div style={{ fontSize: 13, color: '#64748B', marginBottom: 2 }}>Satisfação</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#16A34A' }}>{richData.resumo.satisfacao}</div>
              </div>
            </>
          )}
        </div>

        {/* Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {richData.items.map((s: any, i: number) => {
            const tipo = tipoLabels[s.tipo] || tipoLabels.outros;
            const elapsed = getElapsed(s.criado_em || s.criadoEm, s.respondido_em || s.respondidoEm);
            return (
              <div key={i} style={{
                background: '#F8FAFC', borderRadius: 12,
                overflow: 'hidden', border: '1px solid #E2E8F0',
              }}>
                <div style={{ height: 3, backgroundColor: tipo.color }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1E293B', marginBottom: 4 }}>
                        {s.titulo}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          backgroundColor: `${tipo.color}20`, color: tipo.color,
                          padding: '1px 8px', borderRadius: 20, fontWeight: 600, fontSize: 11,
                        }}>{tipo.label}</span>
                        <span>{s.morador_nome || s.moradorNome}</span>
                        {(s.bloco || s.apartamento) && (
                          <span>· Bloco {s.bloco || '–'}, Apto {s.apartamento || '–'}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        backgroundColor: '#D1FAE5', color: '#065F46',
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      }}>✅ Resolvido</div>
                      {elapsed && (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>⏱ {elapsed}</div>
                      )}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{
                    display: 'flex', gap: 16, fontSize: 11, color: '#94A3B8',
                    borderTop: '1px solid #E2E8F0', paddingTop: 8,
                    marginBottom: (s.resposta || s.resolucao) ? 10 : 0,
                  }}>
                    <span>📬 Aberto: <strong style={{ color: '#475569' }}>{formatDate(s.criado_em || s.criadoEm)}</strong></span>
                    <span>✅ Resolvido: <strong style={{ color: '#475569' }}>{formatDate(s.respondido_em || s.respondidoEm)}</strong></span>
                  </div>

                  {/* Resolution */}
                  {(s.resposta || s.resolucao) && (
                    <div style={{
                      background: '#EFF6FF', borderRadius: 8, padding: '8px 12px',
                      fontSize: 12, color: '#1E40AF',
                    }}>
                      💬 <strong>Resolução:</strong> {s.resposta || s.resolucao}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {richData.items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📬</div>
            <div style={{ fontSize: 14 }}>Nenhum chamado resolvido registrado ainda este mês.</div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
