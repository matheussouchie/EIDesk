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

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  const all = (tickets ?? []) as Ticket[]

  const stats = {
    total: all.length,
    open: all.filter(t => t.status === 'open').length,
    in_progress: all.filter(t => t.status === 'in_progress').length,
    resolved: all.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  }

  const recent = all.slice(0, 5)

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral dos seus tickets de suporte</p>
        </div>
        <Link href="/tickets/new" className="btn btn-primary">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Novo ticket
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-label">Total</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-label">Abertos</div>
          <div className="stat-value">{stats.open}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Em andamento</div>
          <div className="stat-value">{stats.in_progress}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Resolvidos</div>
          <div className="stat-value">{stats.resolved}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Tickets recentes</h2>
          <Link href="/tickets" className="btn btn-ghost btn-sm">Ver todos →</Link>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3>Nenhum ticket ainda</h3>
            <p>Crie seu primeiro ticket de suporte</p>
          </div>
        ) : (
          <div className="ticket-list">
            {recent.map(ticket => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="ticket-row">
                <div>
                  <div className="ticket-row-title">{ticket.title}</div>
                  <div className="ticket-row-meta">
                    {new Date(ticket.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
                <span className={`badge badge-${ticket.priority}`}>{PRIORITY_LABEL[ticket.priority]}</span>
                <span className={`badge badge-${ticket.status}`}>{STATUS_LABEL[ticket.status]}</span>
                <span className="ticket-row-id">
                  #{ticket.id.slice(0, 8)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
