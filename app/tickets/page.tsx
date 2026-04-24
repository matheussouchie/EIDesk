import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Ticket } from '@/types'

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

export default async function TicketsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const all = (tickets ?? []) as Ticket[]

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Meus Tickets</h1>
          <p className="page-subtitle">{all.length} ticket{all.length !== 1 ? 's' : ''} encontrado{all.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/tickets/new" className="btn btn-primary">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo ticket
        </Link>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          Erro ao carregar tickets: {error.message}
        </div>
      )}

      {all.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <svg width="56" height="56" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3>Nenhum ticket ainda</h3>
            <p>Abra um novo ticket para solicitar suporte</p>
            <br />
            <Link href="/tickets/new" className="btn btn-primary btn-sm">
              Criar primeiro ticket
            </Link>
          </div>
        </div>
      ) : (
        <div className="ticket-list">
          {all.map(ticket => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="ticket-row">
              <div style={{ minWidth: 0 }}>
                <div className="ticket-row-title">{ticket.title}</div>
                <div className="ticket-row-meta">
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
              <span className={`badge badge-${ticket.priority}`}>{PRIORITY_LABEL[ticket.priority]}</span>
              <span className={`badge badge-${ticket.status}`}>{STATUS_LABEL[ticket.status]}</span>
              <span className="ticket-row-id">#{ticket.id.slice(0, 8)}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
