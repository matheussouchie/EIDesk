import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { ticket_id, content } = body

  if (!ticket_id || !content?.trim()) {
    return NextResponse.json({ error: 'ticket_id e content são obrigatórios' }, { status: 400 })
  }

  // Verify user has access to this ticket (RLS handles this, but explicit check for API)
  const { data: ticket } = await supabase
    .from('tickets')
    .select('id, created_by, status')
    .eq('id', ticket_id)
    .single()

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket não encontrado' }, { status: 404 })
  }

  if (ticket.status === 'closed') {
    return NextResponse.json({ error: 'Ticket fechado não aceita respostas' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id,
      author_id: user.id,
      content: content.trim(),
      is_internal: false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
