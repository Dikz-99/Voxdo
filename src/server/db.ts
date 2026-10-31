import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Task, VoiceHistoryItem, Subscription, AppNotification, Invoice, PaymentMethod } from '../types/index.ts';

interface DatabaseSchema {
  users: (User & { password_hash: string })[];
  tasks: Task[];
  voice_history: VoiceHistoryItem[];
  subscriptions: Subscription[];
  notifications: AppNotification[];
  invoices: Invoice[];
}

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'VOICE_TASK_SALT').digest('hex');
}

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

const SEED_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr_demo_sarah',
      name: 'Sarah Pratama',
      email: 'sarah@voicetask.ai',
      password_hash: hashPassword('password123'),
      subscription_type: 'PREMIUM',
      created_at: '2026-10-15T08:00:00.000Z',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      daily_voice_count: 2,
      last_voice_date: '2026-10-31'
    },
    {
      id: 'usr_demo_budi',
      name: 'Budi Santoso',
      email: 'budi@gmail.com',
      password_hash: hashPassword('password123'),
      subscription_type: 'FREE',
      created_at: '2026-10-20T10:00:00.000Z',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      daily_voice_count: 3,
      last_voice_date: '2026-10-31'
    }
  ],
  tasks: [
    {
      id: 'tsk_1',
      user_id: 'usr_demo_sarah',
      title: 'Menghubungi Pak Andi tentang proyek website',
      description: 'Diskusikan revisi wireframe dan timeline deployment kuartal 4.',
      category: 'Pekerjaan',
      priority: 'Tinggi',
      deadline: '2026-11-01T09:00:00.000Z',
      execution_time: '09:00 Pagi',
      status: 'Sedang Dikerjakan',
      source: 'Suara',
      created_at: '2026-10-30T14:20:00.000Z'
    },
    {
      id: 'tsk_2',
      user_id: 'usr_demo_sarah',
      title: 'Kirim laporan performa ke kantor',
      description: 'Laporan bulanan KPI dan metrik kepuasan pengguna.',
      category: 'Pekerjaan',
      priority: 'Sedang',
      deadline: '2026-11-01T13:00:00.000Z',
      execution_time: '13:00 Siang',
      status: 'Belum Dimulai',
      source: 'Suara',
      created_at: '2026-10-30T14:21:00.000Z'
    },
    {
      id: 'tsk_3',
      user_id: 'usr_demo_sarah',
      title: 'Menyelesaikan desain aplikasi VoiceTask',
      description: 'Finalisasi mockup UI/UX di Figma dan komponen audio waveform.',
      category: 'Proyek',
      priority: 'Tinggi',
      deadline: '2026-11-06T17:00:00.000Z',
      execution_time: 'Hari Jumat 17:00',
      status: 'Belum Dimulai',
      source: 'Suara',
      created_at: '2026-10-30T14:22:00.000Z'
    },
    {
      id: 'tsk_4',
      user_id: 'usr_demo_sarah',
      title: 'Evaluasi sprint mingguan tim backend',
      description: 'Review integrasi API audio dan speech-to-text.',
      category: 'Pekerjaan',
      priority: 'Sedang',
      deadline: '2026-11-02T10:00:00.000Z',
      execution_time: '10:00 Pagi',
      status: 'Belum Dimulai',
      source: 'Manual',
      created_at: '2026-10-29T11:00:00.000Z'
    },
    {
      id: 'tsk_5',
      user_id: 'usr_demo_sarah',
      title: 'Beli perlengkapan kerja & kopi bean arabika',
      description: 'Persiapan stok coffee bar rumah untuk sprint kerja.',
      category: 'Pribadi',
      priority: 'Rendah',
      deadline: '2026-10-31T19:00:00.000Z',
      execution_time: '19:00 Malam',
      status: 'Selesai',
      source: 'Suara',
      created_at: '2026-10-28T09:00:00.000Z'
    }
  ],
  voice_history: [
    {
      id: 'vh_1',
      user_id: 'usr_demo_sarah',
      original_transcript: 'Besok pagi saya harus menghubungi Pak Andi tentang proyek website, terus siang jangan lupa kirim laporan ke kantor, dan hari Jumat saya harus menyelesaikan desain aplikasi.',
      processed_result: {
        tasks_count: 3,
        tasks_summary: [
          'Menghubungi Pak Andi tentang proyek website (Besok pagi)',
          'Kirim laporan performa ke kantor (Besok siang)',
          'Menyelesaikan desain aplikasi VoiceTask (Hari Jumat)'
        ],
        ai_feedback: 'Saya berhasil memisahkan ucapan Anda menjadi 3 tugas terstruktur.'
      },
      created_at: '2026-10-30T14:20:00.000Z'
    }
  ],
  subscriptions: [
    {
      id: 'sub_sarah',
      user_id: 'usr_demo_sarah',
      plan: 'PREMIUM',
      status: 'ACTIVE',
      start_date: '2026-10-01T00:00:00.000Z',
      end_date: '2027-10-01T00:00:00.000Z',
      features: [
        'Konversi suara tanpa batas',
        'AI Assistant cerdas bertenaga Gemini 3.8',
        'Pengingat otomatis & push notification',
        'Ekspor Google Calendar (.ics)',
        'Sinkronisasi format Notion & Markdown',
        'Analisis produktivitas lengkap'
      ]
    }
  ],
  notifications: [
    {
      id: 'notif_1',
      user_id: 'usr_demo_sarah',
      task_id: 'tsk_1',
      message: 'Pengingat: Menghubungi Pak Andi tentang proyek website dijadwalkan besok pagi pukul 09:00.',
      scheduled_at: '2026-11-01T08:30:00.000Z',
      is_read: false,
      type: 'DEADLINE',
      created_at: '2026-10-31T08:00:00.000Z'
    },
    {
      id: 'notif_2',
      user_id: 'usr_demo_sarah',
      message: 'Selamat datang di VoiceTask AI! Tekan tombol mikrofon untuk mulai mencatat tugas dengan suara.',
      scheduled_at: '2026-10-30T14:25:00.000Z',
      is_read: true,
      type: 'SYSTEM',
      created_at: '2026-10-30T14:25:00.000Z'
    }
  ],
  invoices: [
    {
      id: 'inv_seed_sarah_1',
      invoice_number: 'INV-202610-001',
      user_id: 'usr_demo_sarah',
      plan: 'PREMIUM',
      billing_cycle: 'monthly',
      amount: 49000,
      payment_method: 'qris',
      status: 'PAID',
      qr_string: '00020101021226600016ID.CO.VOICETASK.WWW01189360000201234567895204581253033605405490005802ID5913VOICETASK AI6007JAKARTA6304A1B2',
      created_at: '2026-10-01T00:00:00.000Z',
      paid_at: '2026-10-01T00:02:15.000Z'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    if (!this.data.invoices) {
      this.data.invoices = [...SEED_DATA.invoices];
      this.save();
    }
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load database file, using seed data:', e);
    }
    this.save(SEED_DATA);
    return SEED_DATA;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- Users ---
  getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  getUserById(id: string) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  createUser(name: string, email: string, passwordPlain: string): User {
    const today = getTodayString();
    const newUser = {
      id: 'usr_' + crypto.randomUUID().slice(0, 8),
      name,
      email: email.toLowerCase(),
      password_hash: hashPassword(passwordPlain),
      subscription_type: 'FREE' as const,
      created_at: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      daily_voice_count: 0,
      last_voice_date: today
    };
    this.data.users.push(newUser);

    // Create free subscription
    this.data.subscriptions.push({
      id: 'sub_' + crypto.randomUUID().slice(0, 8),
      user_id: newUser.id,
      plan: 'FREE',
      status: 'ACTIVE',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
      features: ['Maksimal 10 konversi suara per hari', 'Manajemen tugas dasar', 'Dashboard produktivitas']
    });

    // Create welcome notification
    this.data.notifications.push({
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: newUser.id,
      message: `Selamat datang ${name}! Mulai kelola produktivitasmu hanya dengan berbicara.`,
      scheduled_at: new Date().toISOString(),
      is_read: false,
      type: 'SYSTEM',
      created_at: new Date().toISOString()
    });

    this.save();
    const { password_hash, ...safe } = newUser;
    return safe;
  }

  verifyUser(email: string, passwordPlain: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    if (user.password_hash === hashPassword(passwordPlain)) {
      const { password_hash, ...safe } = user;
      return safe;
    }
    return null;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.save();
    const { password_hash, ...safe } = this.data.users[idx];
    return safe;
  }

  incrementVoiceCount(userId: string): { allowed: boolean; remaining: number; plan: string } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { allowed: false, remaining: 0, plan: 'FREE' };

    const today = getTodayString();
    if (user.last_voice_date !== today) {
      user.daily_voice_count = 0;
      user.last_voice_date = today;
    }

    if (user.subscription_type === 'FREE') {
      const MAX_FREE = 10;
      if (user.daily_voice_count >= MAX_FREE) {
        return { allowed: false, remaining: 0, plan: 'FREE' };
      }
      user.daily_voice_count += 1;
      this.save();
      return { allowed: true, remaining: MAX_FREE - user.daily_voice_count, plan: 'FREE' };
    } else {
      user.daily_voice_count += 1;
      this.save();
      return { allowed: true, remaining: 9999, plan: 'PREMIUM' };
    }
  }

  // --- Tasks ---
  getTasks(userId: string): Task[] {
    return this.data.tasks.filter(t => t.user_id === userId);
  }

  getTaskById(id: string, userId: string): Task | null {
    return this.data.tasks.find(t => t.id === id && t.user_id === userId) || null;
  }

  createTask(taskData: Omit<Task, 'id' | 'created_at'>): Task {
    const task: Task = {
      ...taskData,
      id: 'tsk_' + crypto.randomUUID().slice(0, 8),
      created_at: new Date().toISOString()
    };
    this.data.tasks.unshift(task);

    // Auto generate notification for upcoming deadline if within 48h
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const now = new Date();
      if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() > now.getTime()) {
        const notifTime = new Date(deadlineDate.getTime() - 3600000); // 1 hour before
        this.data.notifications.unshift({
          id: 'notif_' + crypto.randomUUID().slice(0, 8),
          user_id: task.user_id,
          task_id: task.id,
          message: `Pengingat tugas: "${task.title}" akan jatuh tempo segera (${task.execution_time || task.deadline.slice(0, 10)}).`,
          scheduled_at: notifTime.toISOString(),
          is_read: false,
          type: 'DEADLINE',
          created_at: new Date().toISOString()
        });
      }
    }

    this.save();
    return task;
  }

  createMultipleTasks(tasksData: Omit<Task, 'id' | 'created_at'>[]): Task[] {
    const created: Task[] = [];
    for (const t of tasksData) {
      created.push(this.createTask(t));
    }
    return created;
  }

  updateTask(id: string, userId: string, updates: Partial<Task>): Task | null {
    const idx = this.data.tasks.findIndex(t => t.id === id && t.user_id === userId);
    if (idx === -1) return null;
    this.data.tasks[idx] = {
      ...this.data.tasks[idx],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    return this.data.tasks[idx];
  }

  deleteTask(id: string, userId: string): boolean {
    const initialLen = this.data.tasks.length;
    this.data.tasks = this.data.tasks.filter(t => !(t.id === id && t.user_id === userId));
    const deleted = this.data.tasks.length < initialLen;
    if (deleted) {
      this.data.notifications = this.data.notifications.filter(n => n.task_id !== id);
      this.save();
    }
    return deleted;
  }

  // --- Voice History ---
  getVoiceHistory(userId: string): VoiceHistoryItem[] {
    return this.data.voice_history
      .filter(vh => vh.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addVoiceHistory(userId: string, original_transcript: string, processed_result: VoiceHistoryItem['processed_result']): VoiceHistoryItem {
    const item: VoiceHistoryItem = {
      id: 'vh_' + crypto.randomUUID().slice(0, 8),
      user_id: userId,
      original_transcript,
      processed_result,
      created_at: new Date().toISOString()
    };
    this.data.voice_history.unshift(item);
    this.save();
    return item;
  }

  deleteVoiceHistory(id: string, userId: string): boolean {
    const len = this.data.voice_history.length;
    this.data.voice_history = this.data.voice_history.filter(vh => !(vh.id === id && vh.user_id === userId));
    const deleted = this.data.voice_history.length < len;
    if (deleted) this.save();
    return deleted;
  }

  // --- Notifications ---
  getNotifications(userId: string): AppNotification[] {
    return this.data.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  markNotificationAsRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id && n.user_id === userId);
    if (notif) {
      notif.is_read = true;
      this.save();
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead(userId: string): void {
    for (const n of this.data.notifications) {
      if (n.user_id === userId) n.is_read = true;
    }
    this.save();
  }

  // --- Subscription ---
  getSubscription(userId: string): Subscription | null {
    return this.data.subscriptions.find(s => s.user_id === userId) || null;
  }

  upgradeSubscription(userId: string, plan: 'FREE' | 'PREMIUM'): Subscription {
    let sub = this.data.subscriptions.find(s => s.user_id === userId);
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.subscription_type = plan;
    }

    const premiumFeatures = [
      'Konversi suara tanpa batas',
      'AI Assistant cerdas bertenaga Gemini 3.8',
      'Pengingat otomatis & push notification',
      'Ekspor Google Calendar (.ics)',
      'Sinkronisasi format Notion & Markdown',
      'Analisis produktivitas lengkap'
    ];

    const freeFeatures = [
      'Maksimal 10 konversi suara per hari',
      'Manajemen tugas dasar',
      'Dashboard produktivitas'
    ];

    if (!sub) {
      sub = {
        id: 'sub_' + crypto.randomUUID().slice(0, 8),
        user_id: userId,
        plan,
        status: 'ACTIVE',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 86400000).toISOString(),
        features: plan === 'PREMIUM' ? premiumFeatures : freeFeatures
      };
      this.data.subscriptions.push(sub);
    } else {
      sub.plan = plan;
      sub.status = 'ACTIVE';
      sub.features = plan === 'PREMIUM' ? premiumFeatures : freeFeatures;
      sub.start_date = new Date().toISOString();
      sub.end_date = new Date(Date.now() + 365 * 86400000).toISOString();
    }

    // Add notification
    this.data.notifications.unshift({
      id: 'notif_' + crypto.randomUUID().slice(0, 8),
      user_id: userId,
      message: plan === 'PREMIUM' 
        ? 'Selamat! Akun Anda telah berhasil di-upgrade ke VoiceTask AI Premium. Nikmati konversi tanpa batas!'
        : 'Paket Anda telah disesuaikan kembali ke Paket Gratis.',
      scheduled_at: new Date().toISOString(),
      is_read: false,
      type: 'SYSTEM',
      created_at: new Date().toISOString()
    });

    this.save();
    return sub;
  }

  // --- Invoices & Payment Gateway Simulation ---
  getInvoices(userId: string): Invoice[] {
    return (this.data.invoices || [])
      .filter(inv => inv.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getInvoiceById(id: string): Invoice | null {
    return (this.data.invoices || []).find(inv => inv.id === id || inv.invoice_number === id) || null;
  }

  createInvoice(
    userId: string,
    billingCycle: 'monthly' | 'yearly',
    paymentMethod: PaymentMethod
  ): Invoice {
    const amount = billingCycle === 'yearly' ? 490000 : 49000;
    const invCount = (this.data.invoices || []).length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(invCount).padStart(3, '0')}`;

    let vaNumber: string | undefined;
    let qrString: string | undefined;

    if (paymentMethod === 'qris') {
      qrString = `00020101021226600016ID.CO.VOICETASK.WWW011893600002${Date.now()}520458125303360540${amount}5802ID5913VOICETASK AI6007JAKARTA6304${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    } else if (paymentMethod.endsWith('_va')) {
      const bankCode = paymentMethod === 'bca_va' ? '80777' : paymentMethod === 'mandiri_va' ? '88908' : '88012';
      vaNumber = `${bankCode}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }

    const newInvoice: Invoice = {
      id: 'inv_' + crypto.randomUUID().slice(0, 8),
      invoice_number: invoiceNumber,
      user_id: userId,
      plan: 'PREMIUM',
      billing_cycle: billingCycle,
      amount,
      payment_method: paymentMethod,
      status: 'PENDING',
      va_number: vaNumber,
      qr_string: qrString,
      created_at: new Date().toISOString()
    };

    if (!this.data.invoices) this.data.invoices = [];
    this.data.invoices.unshift(newInvoice);
    this.save();
    return newInvoice;
  }

  payInvoice(invoiceId: string, userId: string): { invoice: Invoice; subscription: Subscription } | null {
    const inv = (this.data.invoices || []).find(i => i.id === invoiceId && i.user_id === userId);
    if (!inv) return null;

    inv.status = 'PAID';
    inv.paid_at = new Date().toISOString();

    // Upgrade user & subscription
    const sub = this.upgradeSubscription(userId, 'PREMIUM');
    sub.billing_cycle = inv.billing_cycle;
    this.save();

    return { invoice: inv, subscription: sub };
  }
}

export const db = new Database();
