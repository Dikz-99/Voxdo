import { User, Task, VoiceHistoryItem, Subscription, AppNotification, VoiceParseResponse, AssistantChatResponse, Invoice, PaymentMethod } from '../types/index.ts';

const USER_STORAGE_KEY = 'voicetask_current_user';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function getAuthHeaders(): HeadersInit {
  const user = getStoredUser();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user?.id) {
    headers['x-user-id'] = user.id;
  }
  return headers;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ user: User; subscription: Subscription }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal login.');
    }
    const data = await res.json();
    setStoredUser(data.user);
    return data;
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; subscription: Subscription }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mendaftar.');
    }
    const data = await res.json();
    setStoredUser(data.user);
    return data;
  },

  async getMe(): Promise<{ user: User; subscription: Subscription }> {
    const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memuat profil.');
    }
    const data = await res.json();
    setStoredUser(data.user);
    return data;
  },

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Gagal memperbarui profil.');
    const data = await res.json();
    setStoredUser(data.user);
    return data;
  },

  // Tasks
  async getTasks(params?: { category?: string; priority?: string; status?: string; search?: string }): Promise<Task[]> {
    const url = new URL('/api/tasks', window.location.origin);
    if (params?.category && params.category !== 'Semua') url.searchParams.set('category', params.category);
    if (params?.priority && params.priority !== 'Semua') url.searchParams.set('priority', params.priority);
    if (params?.status && params.status !== 'Semua') url.searchParams.set('status', params.status);
    if (params?.search) url.searchParams.set('search', params.search);

    const res = await fetch(url.toString(), { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Gagal memuat tugas.');
    const data = await res.json();
    return data.tasks;
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat tugas.');
    }
    const data = await res.json();
    return data.task;
  },

  async createBatchTasks(tasks: Partial<Task>[]): Promise<Task[]> {
    const res = await fetch('/api/tasks/batch', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tasks }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan tugas-tugas hasil suara.');
    }
    const data = await res.json();
    return data.tasks;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Gagal memperbarui tugas.');
    const data = await res.json();
    return data.task;
  },

  async deleteTask(id: string): Promise<boolean> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal menghapus tugas.');
    return true;
  },

  // AI Voice & Assistant
  async parseVoice(transcript: string, referenceDate?: string): Promise<VoiceParseResponse & { remaining_quota?: number; plan?: string }> {
    const res = await fetch('/api/ai/parse-voice', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ transcript, referenceDate }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memproses suara dengan AI.');
    }
    return res.json();
  },

  async askAssistant(message: string): Promise<AssistantChatResponse> {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Gagal berkomunikasi dengan asisten.');
    return res.json();
  },

  // Voice History
  async getVoiceHistory(): Promise<VoiceHistoryItem[]> {
    const res = await fetch('/api/voice-history', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Gagal memuat riwayat suara.');
    const data = await res.json();
    return data.history;
  },

  async deleteVoiceHistory(id: string): Promise<boolean> {
    const res = await fetch(`/api/voice-history/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal menghapus riwayat suara.');
    return true;
  },

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch('/api/notifications', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Gagal memuat notifikasi.');
    const data = await res.json();
    return data.notifications;
  },

  async markNotificationRead(id: string): Promise<boolean> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  async markAllNotificationsRead(): Promise<boolean> {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  },

  // Subscription & Payment
  async getSubscription(): Promise<{ subscription: Subscription; user: User; invoices: Invoice[] }> {
    const res = await fetch('/api/subscriptions', { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Gagal memuat paket langganan.');
    return res.json();
  },

  async upgradeSubscription(plan: 'FREE' | 'PREMIUM'): Promise<{ subscription: Subscription; user: User }> {
    const res = await fetch('/api/subscriptions/upgrade', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) throw new Error('Gagal memperbarui paket langganan.');
    const data = await res.json();
    setStoredUser(data.user);
    return data;
  },

  async createCheckout(billingCycle: 'monthly' | 'yearly', paymentMethod: PaymentMethod): Promise<{ invoice: Invoice }> {
    const res = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ billingCycle, paymentMethod }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat tagihan pembayaran.');
    }
    return res.json();
  },

  async payInvoice(invoiceId: string): Promise<{ success: boolean; invoice: Invoice; subscription: Subscription; user: User }> {
    const res = await fetch(`/api/subscriptions/pay/${invoiceId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Pembayaran gagal diverifikasi.');
    }
    const data = await res.json();
    setStoredUser(data.user);
    return data;
  },

  async getInvoices(): Promise<Invoice[]> {
    const res = await fetch('/api/subscriptions/invoices', { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.invoices || [];
  },

  getReceiptUrl(invoiceId: string): string {
    const user = getStoredUser();
    return `/api/subscriptions/invoices/${invoiceId}/receipt${user ? `?user_id=${user.id}` : ''}`;
  },

  // Calendar & Notion Export
  getExportCalendarUrl(): string {
    const user = getStoredUser();
    return `/api/export/calendar.ics${user ? `?user_id=${user.id}` : ''}`;
  },

  getExportNotionUrl(): string {
    const user = getStoredUser();
    return `/api/export/notion.md${user ? `?user_id=${user.id}` : ''}`;
  }
};
