import { Router, Request, Response } from 'express';
import { db } from './db.ts';
import { parseVoiceTranscript, askAssistant } from './gemini.ts';

export const apiRouter = Router();

// Middleware to extract user ID from header or query (for direct download links/tabs)
function getUserId(req: Request): string {
  const authHeader = req.headers['x-user-id'];
  if (typeof authHeader === 'string' && authHeader.trim()) {
    return authHeader.trim();
  }
  if (typeof req.query.user_id === 'string' && req.query.user_id.trim()) {
    return req.query.user_id.trim();
  }
  // Default to demo Sarah if not authenticated
  return 'usr_demo_sarah';
}

// --- Auth Routes ---
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
  }

  const user = db.verifyUser(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
  }

  const subscription = db.getSubscription(user.id);
  res.json({ user, subscription });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email ini sudah terdaftar. Silakan login.' });
  }

  const user = db.createUser(name, email, password);
  const subscription = db.getSubscription(user.id);
  res.status(201).json({ user, subscription });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  const subscription = db.getSubscription(userId);
  res.json({ user, subscription });
});

apiRouter.put('/auth/profile', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { name, avatar } = req.body;
  const updated = db.updateUser(userId, { name, avatar });
  if (!updated) {
    return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  }
  res.json({ user: updated });
});

// --- Tasks CRUD ---
apiRouter.get('/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { category, priority, status, search } = req.query;

  let tasks = db.getTasks(userId);

  if (category && typeof category === 'string') {
    tasks = tasks.filter(t => t.category.toLowerCase() === category.toLowerCase());
  }
  if (priority && typeof priority === 'string') {
    tasks = tasks.filter(t => t.priority.toLowerCase() === priority.toLowerCase());
  }
  if (status && typeof status === 'string') {
    tasks = tasks.filter(t => t.status.toLowerCase() === status.toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }

  res.json({ tasks });
});

apiRouter.post('/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { title, description, category, priority, deadline, execution_time, status, source } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Judul tugas wajib diisi.' });
  }

  const task = db.createTask({
    user_id: userId,
    title: title.trim(),
    description: description || '',
    category: category || 'Pekerjaan',
    priority: priority || 'Sedang',
    deadline: deadline || '',
    execution_time: execution_time || '',
    status: status || 'Belum Dimulai',
    source: source || 'Manual',
  });

  res.status(201).json({ task });
});

apiRouter.post('/tasks/batch', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { tasks } = req.body;

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: 'Daftar tugas kosong.' });
  }

  const tasksToCreate = tasks.map((t: any) => ({
    user_id: userId,
    title: t.title || 'Tugas Baru',
    description: t.description || '',
    category: t.category || 'Pekerjaan',
    priority: t.priority || 'Sedang',
    deadline: t.deadline || '',
    execution_time: t.execution_time || '',
    status: t.status || 'Belum Dimulai',
    source: 'Suara' as const,
  }));

  const created = db.createMultipleTasks(tasksToCreate);
  res.status(201).json({ tasks: created, count: created.length });
});

apiRouter.put('/tasks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateTask(id, userId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
  }

  res.json({ task: updated });
});

apiRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const deleted = db.deleteTask(id, userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Tugas tidak ditemukan.' });
  }

  res.json({ success: true, message: 'Tugas berhasil dihapus.' });
});

// --- AI Voice to Task & Assistant ---
apiRouter.post('/ai/parse-voice', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { transcript, referenceDate } = req.body;

  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: 'Teks transkripsi suara kosong.' });
  }

  // Quota check
  const quota = db.incrementVoiceCount(userId);
  if (!quota.allowed) {
    return res.status(403).json({
      error: 'Batas kuota harian paket Free telah tercapai (10 konversi/hari). Upgrade ke Premium untuk konversi tanpa batas!',
      quota_exceeded: true,
    });
  }

  try {
    const parsedResult = await parseVoiceTranscript(
      transcript.trim(),
      referenceDate || '2026-10-31T11:38:00'
    );

    // Save to voice history
    db.addVoiceHistory(userId, transcript.trim(), {
      tasks_count: parsedResult.tasks.length,
      tasks_summary: parsedResult.tasks.map(t => `${t.title} (${t.execution_time || 'Waktu fleksibel'})`),
      ai_feedback: parsedResult.ai_response,
    });

    res.json({
      ...parsedResult,
      remaining_quota: quota.remaining,
      plan: quota.plan,
    });
  } catch (error: any) {
    console.error('Failed to parse voice transcript:', error);
    res.status(500).json({ error: 'Gagal memproses suara menggunakan AI: ' + error.message });
  }
});

apiRouter.post('/ai/assistant', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { message, referenceDate } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Pesan pertanyaan kosong.' });
  }

  const tasks = db.getTasks(userId);

  try {
    const aiResponse = await askAssistant(message.trim(), tasks, referenceDate || '2026-10-31T11:38:00');

    // If AI decided to complete a task automatically:
    if (aiResponse.action === 'COMPLETE_TASK' && aiResponse.action_data?.task_id) {
      db.updateTask(aiResponse.action_data.task_id, userId, { status: 'Selesai' });
    }

    // If AI decided to add tasks:
    if (aiResponse.action === 'ADD_TASKS' && Array.isArray(aiResponse.action_data?.new_tasks)) {
      for (const t of aiResponse.action_data.new_tasks) {
        db.createTask({
          user_id: userId,
          title: t.title,
          description: t.description || '',
          category: t.category || 'Pekerjaan',
          priority: t.priority || 'Sedang',
          deadline: t.deadline || '',
          execution_time: t.execution_time || '',
          status: 'Belum Dimulai',
          source: 'Suara',
        });
      }
    }

    res.json(aiResponse);
  } catch (error: any) {
    console.error('Assistant error:', error);
    res.status(500).json({ error: 'Gagal memproses pertanyaan asisten.' });
  }
});

// --- Voice History ---
apiRouter.get('/voice-history', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const history = db.getVoiceHistory(userId);
  res.json({ history });
});

apiRouter.delete('/voice-history/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const deleted = db.deleteVoiceHistory(id, userId);
  res.json({ success: deleted });
});

// --- Notifications ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const notifications = db.getNotifications(userId);
  res.json({ notifications });
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;
  const success = db.markNotificationAsRead(id, userId);
  res.json({ success });
});

apiRouter.post('/notifications/mark-all-read', (req: Request, res: Response) => {
  const userId = getUserId(req);
  db.markAllNotificationsAsRead(userId);
  res.json({ success: true });
});

// --- Subscriptions & Payment Gateway ---
apiRouter.get('/subscriptions', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const subscription = db.getSubscription(userId);
  const user = db.getUserById(userId);
  const invoices = db.getInvoices(userId);
  res.json({ subscription, user, invoices });
});

apiRouter.post('/subscriptions/upgrade', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { plan } = req.body; // 'FREE' | 'PREMIUM'
  const targetPlan = plan === 'FREE' ? 'FREE' : 'PREMIUM';
  const updatedSub = db.upgradeSubscription(userId, targetPlan);
  const user = db.getUserById(userId);
  res.json({ subscription: updatedSub, user });
});

// Create payment invoice (Checkout)
apiRouter.post('/subscriptions/checkout', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { billingCycle, paymentMethod } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({ error: 'Metode pembayaran wajib dipilih.' });
  }

  const invoice = db.createInvoice(userId, billingCycle || 'monthly', paymentMethod);
  res.status(201).json({ invoice });
});

// Confirm & Pay Invoice (Simulated Payment Gateway Webhook / Immediate Confirmation)
apiRouter.post('/subscriptions/pay/:id', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const result = db.payInvoice(id, userId);
  if (!result) {
    return res.status(404).json({ error: 'Tagihan tidak ditemukan atau tidak valid.' });
  }

  const user = db.getUserById(userId);
  res.json({
    success: true,
    invoice: result.invoice,
    subscription: result.subscription,
    user
  });
});

// Get Invoice List
apiRouter.get('/subscriptions/invoices', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const invoices = db.getInvoices(userId);
  res.json({ invoices });
});

// Printable Receipt / Proof of Payment
apiRouter.get('/subscriptions/invoices/:id/receipt', (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = db.getInvoiceById(id);

  if (!invoice) {
    return res.status(404).send('Invoice tidak ditemukan.');
  }

  const user = db.getUserById(invoice.user_id);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bukti Pembayaran - ${invoice.invoice_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; margin: 0; }
    .receipt-card { max-width: 600px; margin: 0 auto; background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; }
    .logo { font-size: 20px; font-weight: 800; color: #2563eb; }
    .status-badge { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .meta-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 13px; }
    .label { color: #64748b; }
    .val { font-weight: 600; text-align: right; }
    .line-items { width: 100%; border-collapse: collapse; margin: 24px 0; }
    .line-items th { text-align: left; padding: 10px 0; border-bottom: 1px solid #cbd5e1; font-size: 12px; color: #64748b; }
    .line-items td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .total-box { background: #f8fafc; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 800; }
    .print-btn { display: block; width: 100%; text-align: center; margin-top: 24px; padding: 12px; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 14px; }
    @media print { .print-btn { display: none; } body { padding: 0; background: white; } .receipt-card { border: none; box-shadow: none; } }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div>
        <div class="logo">VoiceTask AI</div>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">Kwitansi Resmi Pembayaran Langganan</p>
      </div>
      <span class="status-badge">${invoice.status === 'PAID' ? 'LUNAS / BERHASIL' : 'MENUNGGU PEMBAYARAN'}</span>
    </div>

    <div style="margin: 24px 0;">
      <div class="meta-row">
        <span class="label">Nomor Invoice:</span>
        <span class="val">${invoice.invoice_number}</span>
      </div>
      <div class="meta-row">
        <span class="label">Pelanggan:</span>
        <span class="val">${user?.name || 'Pelanggan'} (${user?.email})</span>
      </div>
      <div class="meta-row">
        <span class="label">Metode Pembayaran:</span>
        <span class="val">${invoice.payment_method.toUpperCase().replace('_', ' ')}</span>
      </div>
      <div class="meta-row">
        <span class="label">Tanggal Bayar:</span>
        <span class="val">${invoice.paid_at ? new Date(invoice.paid_at).toLocaleString('id-ID') : new Date(invoice.created_at).toLocaleString('id-ID')}</span>
      </div>
    </div>

    <table class="line-items">
      <thead>
        <tr>
          <th>Deskripsi Layanan</th>
          <th style="text-align: right;">Durasi</th>
          <th style="text-align: right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>VoiceTask AI Premium Plan (Konversi Tanpa Batas, AI Gemini 3.8, Notifikasi, Notion Sync)</td>
          <td style="text-align: right;">${invoice.billing_cycle === 'yearly' ? '1 Tahun' : '1 Bulan'}</td>
          <td style="text-align: right;">Rp ${invoice.amount.toLocaleString('id-ID')}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <span>Total Dibayar:</span>
      <span style="color: #2563eb;">Rp ${invoice.amount.toLocaleString('id-ID')}</span>
    </div>

    <button onclick="window.print()" class="print-btn">Cetak Kwitansi / Unduh PDF</button>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// --- Export Notion Format (Markdown & CSV) ---
apiRouter.get('/export/notion.md', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tasks = db.getTasks(userId);
  const user = db.getUserById(userId);

  let mdContent = `# VoiceTask AI Tasks Export\n`;
  mdContent += `*Diperbarui: ${new Date().toLocaleDateString('id-ID')} | Pengguna: ${user?.name || 'Pengguna'}*\n\n`;
  mdContent += `## Daftar Tugas & Jadwal\n\n`;

  for (const t of tasks) {
    const check = t.status === 'Selesai' ? '[x]' : '[ ]';
    const deadlineStr = t.deadline ? ` @deadline(${new Date(t.deadline).toLocaleDateString('id-ID')})` : '';
    const timeStr = t.execution_time ? ` (${t.execution_time})` : '';
    mdContent += `- ${check} **${t.title}**${timeStr} - #${t.category} #${t.priority}${deadlineStr}\n`;
    if (t.description) {
      mdContent += `  > ${t.description}\n`;
    }
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="voicetask-notion.md"');
  res.send(mdContent);
});

// --- Export iCalendar (.ics) for Google Calendar ---
apiRouter.get('/export/calendar.ics', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const tasks = db.getTasks(userId);

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VoiceTask AI//NONSGML Productivity Calendar//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:VoiceTask AI Schedule'
  ];

  for (const t of tasks) {
    if (!t.deadline) continue;
    const d = new Date(t.deadline);
    if (isNaN(d.getTime())) continue;

    const startStr = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endStr = new Date(d.getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:voicetask-${t.id}@voicetask.ai`);
    icsContent.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
    icsContent.push(`DTSTART:${startStr}`);
    icsContent.push(`DTEND:${endStr}`);
    icsContent.push(`SUMMARY:${t.title.replace(/[,;]/g, ' ')}`);
    icsContent.push(`DESCRIPTION:${(t.description || t.execution_time || '').replace(/[,;]/g, ' ')} [Kategori: ${t.category} | Prioritas: ${t.priority}]`);
    icsContent.push(`STATUS:${t.status === 'Selesai' ? 'COMPLETED' : 'CONFIRMED'}`);
    icsContent.push('END:VEVENT');
  }

  icsContent.push('END:VCALENDAR');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="voicetask-schedule.ics"');
  res.send(icsContent.join('\r\n'));
});

