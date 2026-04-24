'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TicketPriority } from '@/types'

export default function NewTicketPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    if (!form.title.trim() || !form.description.trim()) {
      setError('Preencha todos os campos obrigatórios.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        created_by: user.id,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/tickets/${data.id}`)
  }

  return (
    <>
      <button className="back-btn" onClick={() => router.back()}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Voltar
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Abrir novo ticket</h1>
          <p className="page-subtitle">Descreva seu problema com o máximo de detalhes</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              className="form-input"
              type="text"
              name="title"
              placeholder="Ex: Não consigo acessar minha conta"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Prioridade</label>
            <select
              className="form-select"
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição *</label>
            <textarea
              className="form-textarea"
              name="description"
              placeholder="Descreva o problema em detalhes. Inclua o que você estava fazendo, o que aconteceu e o que esperava que acontecesse."
              value={form.description}
              onChange={handleChange}
              required
              rows={6}
            />
          </div>

          <div className="modal-footer" style={{ justifyContent: 'flex-start' }}>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? <><span className="spinner" /> Enviando...</> : 'Abrir ticket'}
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
