'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  ticketId: string
  userId: string
}

export default function TicketReplyForm({ ticketId, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()

    if (!trimmed) {
      setError('Digite uma mensagem antes de enviar.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        author_id: userId,
        content: trimmed,
        is_internal: false,
      })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setContent('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="reply-box">
      <h3>Adicionar resposta</h3>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <textarea
            className="form-textarea"
            placeholder="Escreva sua resposta aqui..."
            value={content}
            onChange={e => { setContent(e.target.value); setError('') }}
            rows={4}
            disabled={loading}
          />
        </div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading || !content.trim()}>
          {loading ? <><span className="spinner" /> Enviando...</> : 'Enviar resposta'}
        </button>
      </form>
    </div>
  )
}
