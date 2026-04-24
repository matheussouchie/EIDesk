import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import type { Ticket, TicketMessage, Profile } from '@/types'
import TicketReplyForm from '@/components/TicketReplyForm'
import TicketStatusUpdate from '@/components/TicketStatusUpdate'

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getInitials(profile: Profile | undefined): string {
  if (!profile) return '?'
  if (profile.full_name) {
    return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  return profile.email?.[0]?.toUpperCase() ?? '?'
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch ticket with creator profile
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      profiles!tickets_created_by_fkey (
        id, email, full_name, role, avatar_url
      )
    `)
    .eq('id', id)
    .single()

  if (error || !ticket) notFound()

  // Fetch messages with author profiles
  const { data: messages } = await supabase
    .from('ticket_messages')
    .select(`
      *,
      profiles!ticket_messages_author_id_fkey (
        id, email, full_name, role, avatar_url
      )
    `)
    .eq('ticket_id', id)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAgent = profile?.role === 'agent' || profile?.role === 'admin'
  const ticketData = ticket as Ticket & { profiles: Profile }
  const messagesData = (messages ?? []) as (TicketMessage & { profiles: Profile })[]

  return (
    <>
      <a href="/tickets" className="back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13, fontWeight: 600, marginBottom: 20, textDecoration: 'none' }}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Todos os tickets
      </a>

      <div className="card">
        <div className="ticket-detail-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', display: 'block', marginBottom: 6 }}>
                #{ticketData.id.slice(0, 8)}
              </span>
              <h1 className="ticket-detail-title">{ticketData.title}</h1>
            </div>
          </div>

          <div className="ticket-detail-badges">
            <span className={`badge badge-${ticketData.status}`}>{STATUS_LABEL[ticketData.status]}</span>
            <span className={`badge badge-${ticketData.priority}`}>{PRIORITY_LABEL[ticketData.priority]}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
              Aberto em {formatDate(ticketData.created_at)}
            </span>
          </div>
        </div>

        {isAgent && (
          <TicketStatusUpdate ticketId={ticketData.id} currentStatus={ticketData.status} />
        )}

        <div>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
            Descrição
          </div>
          <div className="ticket-description-box">{ticketData.description}</div>
        </div>

        {/* MESSAGES */}
        <div className="messages-section">
          <h3>Mensagens ({messagesData.length})</h3>

          {messagesData.length === 0 ? (
            <div style={{ color: 'var(--text-3)', fontSize: 14, padding: '20px 0' }}>
              Nenhuma resposta ainda. Seja o primeiro a responder.
            </div>
          ) : (
            <div className="message-list">
              {messagesData.map(msg => (
                <div key={msg.id} className="message-item">
                  <div className="message-avatar">
                    {getInitials(msg.profiles)}
                  </div>
                  <div className="message-bubble">
                    <div className="message-header">
                      <span className="message-author">
                        {msg.profiles?.full_name ?? msg.profiles?.email ?? 'Usuário'}
                      </span>
                      {msg.profiles?.role && msg.profiles.role !== 'user' && (
                        <span className="badge badge-in_progress" style={{ fontSize: 10, padding: '1px 5px' }}>
                          {msg.profiles.role}
                        </span>
                      )}
                      <span className="message-time">{formatDate(msg.created_at)}</span>
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* REPLY BOX */}
        {ticketData.status !== 'closed' && (
          <TicketReplyForm ticketId={ticketData.id} userId={user.id} />
        )}

        {ticketData.status === 'closed' && (
          <div style={{
            padding: '16px',
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 14,
          }}>
            Este ticket está fechado e não aceita mais respostas.
          </div>
        )}
      </div>
    </>
  )
}
