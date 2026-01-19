// Ticket status enum matching database
export type TicketStatus = 
  | 'OPEN' 
  | 'NEEDS_REVIEW' 
  | 'ASSIGNED' 
  | 'EN_ROUTE' 
  | 'ON_SITE' 
  | 'RESOLVED_PENDING_VERIFICATION' 
  | 'RESOLVED' 
  | 'REOPENED';

// User role enum
export type UserRole = 'STAFF' | 'FIELD_EXECUTIVE' | 'ADMIN' | 'SUPER_ADMIN';

// WhatsApp event types
export type WhatsAppEventType = 'SENT' | 'CLICKED' | 'EN_ROUTE' | 'UPLOAD' | 'RESOLUTION';

// Comment source types
export type CommentSource = 'EMAIL' | 'FE' | 'STAFF' | 'SYSTEM';

// Email processing status - State Machine
export type EmailProcessingStatus = 
  | 'RECEIVED' 
  | 'PARSED' 
  | 'DRAFT' 
  | 'NEEDS_REVIEW' 
  | 'TICKET_CREATED' 
  | 'COMMENT_ADDED' 
  | 'ERROR';

// JSON type matching Supabase
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Raw email from database
export interface RawEmail {
  id: string;
  message_id: string;
  thread_id: string | null;
  from_email: string;
  to_email: string;
  subject: string | null;
  received_at: string;
  payload: Json;
  ticket_created: boolean | null;
  created_at: string | null;
}

// Raw email with parsed data
export interface RawEmailWithParsed extends RawEmail {
  parsed_email?: ParsedEmail | null;
  processing_status: EmailProcessingStatus;
  linked_ticket_id?: string | null;
}

// Parsed email from database
export interface ParsedEmail {
  id: string;
  raw_email_id: string;
  complaint_id: string | null;
  vehicle_number: string | null;
  category: string | null;
  issue_type: string | null;
  location: string | null;
  reported_at: string | null;
  remarks: string | null;
  confidence_score: number | null;
  needs_review: boolean;
  created_at: string;
}

// Field Executive from database
export interface FieldExecutive {
  id: string;
  name: string;
  phone: string | null;
  base_location: string | null;
  skills: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
}

// Field Executive with stats
export interface FieldExecutiveWithStats extends FieldExecutive {
  active_tickets: number;
  resolved_this_week: number;
  avg_resolution_time_hours: number;
  sla_compliance_rate: number;
}

// Ticket from database
export interface Ticket {
  id: string;
  ticket_number: string;
  status: TicketStatus;
  complaint_id: string | null;
  vehicle_number: string | null;
  category: string | null;
  issue_type: string | null;
  location: string | null;
  opened_by_email: string | null;
  opened_at: string;
  confidence_score: number | null;
  needs_review: boolean;
  source: string | null;
  current_assignment_id: string | null;
  created_at: string;
  updated_at: string;
}

// Ticket with assignment info
export interface TicketWithAssignment extends Ticket {
  current_assignment?: TicketAssignment | null;
  assigned_fe?: FieldExecutive | null;
}

// Ticket Assignment from database
export interface TicketAssignment {
  id: string;
  ticket_id: string;
  fe_id: string;
  assigned_by: string | null;
  assigned_at: string;
  override_reason: string | null;
  created_at: string;
  field_executive?: FieldExecutive;
}

// Ticket Comment from database
export interface TicketComment {
  id: string;
  ticket_id: string;
  source: CommentSource;
  author_id: string | null;
  body: string | null;
  attachments: Record<string, unknown> | null;
  created_at: string;
}

// SLA Tracking from database
export interface SLATracking {
  id: string;
  ticket_id: string;
  assignment_deadline: string | null;
  onsite_deadline: string | null;
  resolution_deadline: string | null;
  assignment_breached: boolean;
  onsite_breached: boolean;
  resolution_breached: boolean;
  created_at: string;
  updated_at: string;
}

// User from database
export interface User {
  id: string;
  auth_id: string | null;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

// Dashboard stats
export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  needsReviewCount: number;
  assignedTickets: number;
  resolvedToday: number;
  avgConfidenceScore: number;
  slaBreaches: number;
}

// Filter options for tickets
export interface TicketFilters {
  status?: TicketStatus | 'all';
  needsReview?: boolean;
  confidenceRange?: 'high' | 'medium' | 'low' | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  unassignedOnly?: boolean;
}

// Audit log entry
export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  performed_by: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}