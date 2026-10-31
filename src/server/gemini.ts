import { GoogleGenAI, Type } from '@google/genai';
import { Task, VoiceParseResponse, AssistantChatResponse } from '../types/index.ts';

// Initialize Gemini client on the server side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function parseVoiceTranscript(
  transcript: string,
  referenceDateStr: string = '2026-10-31T11:38:00'
): Promise<VoiceParseResponse> {
  const refDate = new Date(referenceDateStr);
  const dateContext = `Tanggal dan waktu sekarang adalah: ${refDate.toISOString()} (Hari: ${new Intl.DateTimeFormat('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(refDate)}).`;

  const prompt = `Transkripsi Suara Pengguna:
"""${transcript}"""

${dateContext}
Petunjuk Penanganan Waktu:
- Jika pengguna berkata "besok pagi", hitung 1 hari ke depan dari tanggal sekarang sekitar pukul 09:00.
- Jika "besok siang", sekitar pukul 13:00.
- Jika "besok sore", sekitar pukul 16:00.
- Jika "besok malam", sekitar pukul 19:00.
- Jika "nanti sore" atau "nanti malam", gunakan tanggal hari ini.
- Jika menyebut hari tertentu (misal "hari Jumat"), hitung hari Jumat terdekat berikutnya.
- PENTING: Jangan mengarang deadline jika pengguna sama sekali tidak menyebutkan waktu atau tanggal! Set deadline ke string kosong jika tidak ada waktu.
- Pisahkan kalimat majemuk menjadi masing-masing tugas terpisah.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah AI Voice-to-Task Engine untuk aplikasi VoiceTask AI dalam Bahasa Indonesia.
Ubah ucapan pengguna menjadi daftar tugas (To-Do List) yang rapi, terstruktur, dan terpisah.
Keluarkan JSON sesuai skema yang diminta.
Pastikan ai_response adalah kalimat respon asisten yang ramah, natural, dan siap dibacakan oleh Text-to-Speech (TTS).`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Judul tugas ringkas dan jelas' },
                  description: { type: Type.STRING, description: 'Detail/konteks tugas' },
                  category: { type: Type.STRING, description: 'Pekerjaan, Pribadi, Proyek, Belajar, Keuangan, Kesehatan, dll.' },
                  priority: { type: Type.STRING, description: 'Tinggi, Sedang, atau Rendah' },
                  deadline: { type: Type.STRING, description: 'ISO 8601 string tanggal deadline (contoh: 2026-11-01T09:00:00.000Z) atau kosong jika tidak disebutkan' },
                  execution_time: { type: Type.STRING, description: 'Waktu pelaksanaan yang mudah dipahami (contoh: Besok pagi 09:00)' },
                  confidence: { type: Type.NUMBER, description: 'Tingkat keyakinan 0.0 - 1.0' },
                  clarification_needed: { type: Type.BOOLEAN, description: 'True jika waktu atau maksud masih sangat ambigu' },
                },
                required: ['title', 'description', 'category', 'priority', 'deadline', 'execution_time', 'confidence'],
              },
            },
            ai_response: {
              type: Type.STRING,
              description: 'Respon lisan natural dari AI untuk dibacakan oleh TTS',
            },
            needs_clarification: {
              type: Type.BOOLEAN,
              description: 'True jika ada instruksi yang ambigu',
            },
            clarification_question: {
              type: Type.STRING,
              description: 'Pertanyaan klarifikasi jika needs_clarification true',
            },
          },
          required: ['tasks', 'ai_response', 'needs_clarification'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return {
      tasks: parsedJson.tasks || [],
      ai_response: parsedJson.ai_response || 'Baik, tugas Anda sudah saya proses.',
      needs_clarification: Boolean(parsedJson.needs_clarification),
      clarification_question: parsedJson.clarification_question || undefined,
      raw_transcript: transcript,
    };
  } catch (error) {
    console.error('Error calling Gemini parseVoiceTranscript:', error);
    // Fallback parser if API call encounters issue
    const simpleTitle = transcript.length > 50 ? transcript.slice(0, 50) + '...' : transcript;
    return {
      tasks: [
        {
          title: simpleTitle,
          description: transcript,
          category: 'Pekerjaan',
          priority: 'Sedang',
          deadline: '',
          execution_time: 'Belum ditentukan',
          confidence: 0.8,
          clarification_needed: false,
        },
      ],
      ai_response: `Saya telah mencatat: "${simpleTitle}". Silakan periksa detailnya sebelum menyimpan.`,
      needs_clarification: false,
      raw_transcript: transcript,
    };
  }
}

export async function askAssistant(
  userQuery: string,
  userTasks: Task[],
  referenceDateStr: string = '2026-10-31T11:38:00'
): Promise<AssistantChatResponse> {
  const tasksSummary = userTasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    category: t.category,
    deadline: t.deadline,
    execution_time: t.execution_time,
  }));

  const prompt = `Tanggal sekarang: ${referenceDateStr} (Sabtu, 31 Oktober 2026).
Daftar Tugas Pengguna Saat Ini:
${JSON.stringify(tasksSummary, null, 2)}

Pertanyaan/Perintah Pengguna:
"${userQuery}"

Tugas Anda:
1. Pahami maksud pengguna dalam Bahasa Indonesia.
2. Jika pengguna bertanya tentang tugas (misal: "Apa saja tugas saya hari ini?", "Tugas mana yang paling mendesak?"), analisa daftar tugas di atas dan berikan jawaban yang cerdas, terstruktur, dan solutif.
3. Jika pengguna meminta membuat jadwal harian (misal: "Buatkan jadwal untuk besok"), susun pembagian jam kerja yang realistis dan produktif.
4. Jika pengguna bermaksud menandai tugas selesai (misal: "Tandai pekerjaan laporan sebagai selesai"), tentukan action "COMPLETE_TASK" dan target_task_id.
5. Jika pengguna ingin menambahkan tugas baru secara lisan (misal: "Tambahkan tugas beli vitamin sore nanti"), tentukan action "ADD_TASKS" dan data tugas baru.
6. Kembalikan balasan ramah dan siap disuarakan.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `Anda adalah VoiceTask AI Assistant - asisten produktivitas pribadi yang sangat cerdas, ramah, dan solutif dalam Bahasa Indonesia.
Anda selalu membantu pengguna mengelola pekerjaan harian dengan efisien.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Teks balasan ramah dan jelas untuk pengguna, bisa dibacakan oleh TTS',
            },
            action: {
              type: Type.STRING,
              description: 'NONE, ADD_TASKS, COMPLETE_TASK, RESCHEDULE_TASK, SHOW_DAILY_PLAN',
            },
            action_data: {
              type: Type.OBJECT,
              properties: {
                task_id: { type: Type.STRING },
                new_tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      category: { type: Type.STRING },
                      priority: { type: Type.STRING },
                      deadline: { type: Type.STRING },
                      execution_time: { type: Type.STRING },
                    },
                    required: ['title'],
                  },
                },
              },
            },
          },
          required: ['reply', 'action'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      reply: parsed.reply || 'Ada yang bisa saya bantu terkait tugas Anda?',
      action: parsed.action || 'NONE',
      action_data: parsed.action_data || undefined,
    };
  } catch (error) {
    console.error('Error calling Gemini askAssistant:', error);
    return {
      reply: 'Maaf, saya sedang mengalami kendala jaringan. Namun daftar tugas Anda tetap tersimpan dengan aman.',
      action: 'NONE',
    };
  }
}
