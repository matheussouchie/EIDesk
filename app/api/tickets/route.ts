import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, priority } = body

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'title e description são obrigatórios' }, { status: 400 })
  }

  const validPriorities = ['low', 'medium', 'high', 'urgent']
  if (priority && !validPriorities.includes(priority)) {
    return NextResponse.json({ error: 'priority inválida' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      title: title.trim(),
      description: description.trim(),
      priority: priority ?? 'medium',
      created_by: user.id,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
