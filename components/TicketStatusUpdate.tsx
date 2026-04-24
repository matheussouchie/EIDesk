'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TicketStatus } from '@/types'

interface Props {
  ticketId: string
  currentStatus: TicketStatus
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open',        label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'resolved',    label: 'Resolvido' },
  { value: 'closed',      label: 'Fechado' },
]

export default function TicketStatusUpdate({ ticketId, currentStatus }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [status, setStatus] = useState<TicketStatus>(currentStatus)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleUpdate() {
    if (status === currentStatus) return
    setLoading(true)
    setSaved(false)

    const { error } = await supabase
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)

    setLoading(false)

    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
  }

  return (
    <div className="status-select-row">
      <label>Status (agente):</label>
      <select
        value={status}
        onChange={e => setStatus(e.target.value as TicketStatus)}
        disabled={loading}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        className="btn btn-primary btn-sm"
        onClick={handleUpdate}
        disabled={loading || status === currentStatus}
      >
        {loading ? <span className="spinner" /> : saved ? '✓ Salvo' : 'Atualizar'}
      </button>
    </div>
  )
}
