export type UserRole = 'user' | 'agent' | 'admin'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface TicketMessage {
  id: string
  ticket_id: string
  author_id: string
  content: string
  is_internal: boolean
  created_at: string
  profiles?: Profile
}

export interface TicketWithMessages extends Ticket {
  ticket_messages: TicketMessage[]
}
