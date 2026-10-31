export type TaskPriority = 'Rendah' | 'Sedang' | 'Tinggi';
export type TaskStatus = 'Belum Dimulai' | 'Sedang Dikerjakan' | 'Selesai';
export type TaskSource = 'Suara' | 'Manual';
export type SubscriptionPlan = 'FREE' | 'PREMIUM';
export type PaymentMethod = 'qris' | 'bca_va' | 'mandiri_va' | 'bri_va' | 'credit_card';

export interface User {
  id: string;
  name: string;
  email: string;
  subscription_type: SubscriptionPlan;
  created_at: string;
  avatar?: string;
  daily_voice_count: number;
  last_voice_date: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  deadline: string; // ISO date string or formatted date
  execution_time?: string; // e.g. "09:00", "Pagi", "Siang"
  status: TaskStatus;
  source: TaskSource;
  created_at: string;
  updated_at?: string;
}

export interface VoiceHistoryItem {
  id: string;
  user_id: string;
  original_transcript: string;
  processed_result: {
    tasks_count: number;
    tasks_summary: string[];
    ai_feedback?: string;
  };
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  plan: SubscriptionPlan;
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  payment_method: PaymentMethod;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  va_number?: string;
  qr_string?: string;
  created_at: string;
  paid_at?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  billing_cycle?: 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  features: string[];
}

export interface AppNotification {
  id: string;
  user_id: string;
  task_id?: string;
  message: string;
  scheduled_at: string;
  is_read: boolean;
  type: 'DEADLINE' | 'REMINDER' | 'DAILY_DIGEST' | 'SYSTEM';
  created_at: string;
}

export interface ParsedVoiceTask {
  title: string;
  description: string;
  category: string;
  priority: TaskPriority;
  deadline: string;
  execution_time: string;
  confidence: number;
  clarification_needed?: boolean;
}

export interface VoiceParseResponse {
  tasks: ParsedVoiceTask[];
  ai_response: string;
  needs_clarification: boolean;
  clarification_question?: string;
  raw_transcript: string;
}

export interface AssistantChatResponse {
  reply: string;
  action?: 'NONE' | 'ADD_TASKS' | 'COMPLETE_TASK' | 'RESCHEDULE_TASK' | 'SHOW_DAILY_PLAN';
  action_data?: any;
}
