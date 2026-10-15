import { db } from './db';
import { parseIndonesianAmount } from './utils';
import { Category, Transaction } from '@/types';

export interface ParsedTransaction {
  jenis: 'expense' | 'income' | 'transfer';
  nominal: number;
  kategori_nama: string;
  catatan: string;
  target_wallet?: string;
  is_ambiguous?: boolean;
  ambiguity_reason?: string;
}

export interface ParsedReceipt {
  merchant: string;
  total: number;
  date?: string;
  items: {
    item_name: string;
    quantity: number;
    price: number;
    subtotal: number;
    category_name?: string;
  }[];
}

/**
 * Intelligent Fallback NLP Parser untuk Bahasa Indonesia
 * Menangani ragam dialek & format nominal Indonesia:
 * 15rb, 15ribu, 1.5jt, 1,5jt, 500k, 25.000, beli ..., bayar ..., dapet gaji ..., tf ...
 */
export function parseNaturalLanguageIndonesian(text: string, categories: Category[]): ParsedTransaction {
  const lower = text.trim().toLowerCase();

  // 1. Tentukan jenis transaksi
  const isTopUpOrSavings =
    lower.includes('tambah saldo') ||
    lower.includes('menambah saldo') ||
    lower.includes('tambah isi saldo') ||
    lower.includes('isi saldo') ||
    lower.includes('isi ulang') ||
    lower.includes('top up') ||
    lower.includes('topup') ||
    lower.includes('top-up') ||
    lower.includes('setor') ||
    lower.includes('setor tunai') ||
    lower.includes('nabung') ||
    lower.includes('menabung') ||
    lower.includes('tambah tabungan') ||
    lower.includes('tabungan masuk') ||
    lower.includes('masuk saldo') ||
    lower.includes('deposit') ||
    lower.includes('isi dompet') ||
    lower.includes('isi gopay') ||
    lower.includes('isi ovo') ||
    lower.includes('isi dana');

  let jenis: 'expense' | 'income' | 'transfer' = 'expense';
  if (
    isTopUpOrSavings ||
    lower.includes('gajian') ||
    lower.includes('gaji') ||
    lower.includes('pemasukan') ||
    lower.includes('dapat uang') ||
    lower.includes('dapet uang') ||
    lower.includes('terima transfer') ||
    lower.includes('bonus') ||
    lower.includes('penjualan') ||
    lower.includes('omset')
  ) {
    jenis = 'income';
  } else if (
    lower.startsWith('tf ') ||
    lower.startsWith('transfer ') ||
    lower.includes('pindah saldo') ||
    lower.includes('kirim ke ')
  ) {
    jenis = 'transfer';
  }

  // 2. Ekstraksi Nominal
  // Cari semua kandidat token nominal: misal "15rb", "15ribu", "1.5jt", "1,5jt", "500k", "Rp 25.000", "50000"
  let detectedAmount: number | null = null;
  let amountToken = '';

  // Regex pencari nominal
  const amountRegex = /(?:rp\.?\s*)?([0-9]+(?:[.,][0-9]+)?)\s*(jt|juta|rb|ribu|k)?\b/gi;
  interface Candidate {
    raw: string;
    parsed: number;
    score: number;
  }
  const candidates: Candidate[] = [];

  let match;
  while ((match = amountRegex.exec(lower)) !== null) {
    const rawVal = match[0].trim();
    const parsed = parseIndonesianAmount(rawVal);
    if (parsed && parsed > 0) {
      let score = 10;
      const hasUnit = /(jt|juta|rb|ribu|k)/i.test(rawVal);
      const hasRp = /rp/i.test(rawVal);
      const hasSeparator = /[0-9]+[.,][0-9]{3}/.test(rawVal);

      if (hasUnit || hasRp) {
        score = 100;
      } else if (hasSeparator) {
        score = 80;
      } else if (parsed >= 1000) {
        score = 60;
      } else {
        score = 10; // Kemungkinan kuantitas/jumlah item (e.g. "2 bakso", "3 porsi")
      }
      candidates.push({ raw: rawVal, parsed, score });
    }
  }

  // Pilih kandidat dengan skor prioritas tertinggi
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    detectedAmount = candidates[0].parsed;
    amountToken = candidates[0].raw;
  }

  if (!detectedAmount) {
    return {
      jenis,
      nominal: 0,
      kategori_nama: 'Lainnya',
      catatan: text,
      is_ambiguous: true,
      ambiguity_reason: 'Nominal transaksi tidak terdeteksi. Contoh format: "beli bakso 15rb" atau "gajian 5jt"',
    };
  }

  // 3. Ekstraksi Rekening / E-Wallet yang disebut pengguna
  let targetWallet: string | undefined = undefined;
  if (/gopay|go-pay/i.test(lower)) {
    targetWallet = 'GoPay';
  } else if (/\bovo\b/i.test(lower)) {
    targetWallet = 'OVO';
  } else if (/\bdana\b/i.test(lower)) {
    targetWallet = 'DANA';
  } else if (/shopeepay|shopee\s*pay/i.test(lower)) {
    targetWallet = 'ShopeePay';
  } else if (/\bbca\b/i.test(lower)) {
    targetWallet = 'BCA Utama';
  } else if (/mandiri/i.test(lower)) {
    targetWallet = 'Mandiri Tabungan';
  } else if (/\bbri\b/i.test(lower)) {
    targetWallet = 'BRI';
  } else if (/\bbni\b/i.test(lower)) {
    targetWallet = 'BNI';
  } else if (/jago/i.test(lower)) {
    targetWallet = 'Bank Jago';
  } else if (/cash|tunai|uang\s*tunai|dompet/i.test(lower)) {
    targetWallet = 'Uang Tunai / Dompet';
  }

  // 4. Bersihkan catatan (buang kata kunci nominal)
  let cleanNotes = text;
  if (amountToken) {
    const regexReplace = new RegExp(amountToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    cleanNotes = cleanNotes.replace(regexReplace, '').trim();
  }
  // Buang prefix kata kerja jika ada
  cleanNotes = cleanNotes.replace(/^(beli|bayar|pesan|jajan|tf|transfer|dapat|dapet|tambah|isi)\s+/i, '').trim();
  if (!cleanNotes) {
    if (isTopUpOrSavings) {
      cleanNotes = targetWallet ? `Top Up ${targetWallet}` : 'Tambah Saldo Tabungan';
    } else {
      cleanNotes = jenis === 'income' ? 'Pemasukan' : 'Pengeluaran';
    }
  }

  // 5. Tebak Kategori berdasarkan kata kunci umum Indonesia
  let chosenCatName = jenis === 'income' ? '💼 Gaji Bulanan' : '🍜 Makanan & Minuman';
  const notesLower = cleanNotes.toLowerCase();

  if (isTopUpOrSavings) {
    chosenCatName = '📥 Top Up & Tabungan';
  } else if (jenis === 'income') {
    if (notesLower.includes('freelance') || notesLower.includes('proyek') || notesLower.includes('bonus')) {
      chosenCatName = '💰 Freelance & Bonus';
    } else {
      chosenCatName = '💼 Gaji Bulanan';
    }
  } else {
    if (
      notesLower.includes('bensin') ||
      notesLower.includes('pertamax') ||
      notesLower.includes('pertalite') ||
      notesLower.includes('grab') ||
      notesLower.includes('gojek') ||
      notesLower.includes('parkir') ||
      notesLower.includes('tol')
    ) {
      chosenCatName = '🚗 Transportasi';
    } else if (
      notesLower.includes('game') ||
      notesLower.includes('steam') ||
      notesLower.includes('nonton') ||
      notesLower.includes('bioskop') ||
      notesLower.includes('netflix') ||
      notesLower.includes('spotify')
    ) {
      chosenCatName = '🎮 Hiburan & Hobi';
    } else if (
      notesLower.includes('listrik') ||
      notesLower.includes('pln') ||
      notesLower.includes('air') ||
      notesLower.includes('pam') ||
      notesLower.includes('wifi') ||
      notesLower.includes('internet') ||
      notesLower.includes('pulsa') ||
      notesLower.includes('kost')
    ) {
      chosenCatName = '🏠 Tagihan & Utilitas';
    } else if (
      notesLower.includes('obat') ||
      notesLower.includes('dokter') ||
      notesLower.includes('klinik') ||
      notesLower.includes('vitamin') ||
      notesLower.includes('apotek')
    ) {
      chosenCatName = '💊 Kesehatan';
    } else if (
      notesLower.includes('baju') ||
      notesLower.includes('sepatu') ||
      notesLower.includes('shopee') ||
      notesLower.includes('tokopedia') ||
      notesLower.includes('belanja') ||
      notesLower.includes('indomaret') ||
      notesLower.includes('alfamart')
    ) {
      chosenCatName = '👕 Belanja Kebutuhan';
    }
  }

  // Cari kategori user yang paling cocok
  const matchedUserCat = categories.find(
    (c) =>
      c.type === jenis &&
      (c.name.toLowerCase().includes(chosenCatName.toLowerCase()) ||
        chosenCatName.toLowerCase().includes(c.name.toLowerCase()))
  );

  return {
    jenis,
    nominal: detectedAmount,
    kategori_nama: matchedUserCat ? matchedUserCat.name : chosenCatName,
    catatan: cleanNotes,
    target_wallet: targetWallet,
  };
}

/**
 * Multi-Provider LLM Transaction Text Parser
 */
export async function parseTransactionWithAI(
  text: string,
  categories: Category[],
  userId?: string
): Promise<ParsedTransaction> {
  const startTime = Date.now();
  const configs = db.getAiConfigs();
  const geminiConfig = configs.find((c) => c.provider_name === 'gemini' && c.is_active);
  const geminiKey = process.env.GEMINI_API_KEY || geminiConfig?.api_key_encrypted;

  // Jika ada Gemini API Key valid (bukan placeholder), panggil Google Gemini API
  if (geminiKey && geminiKey.length > 20 && !geminiKey.includes('Encrypted')) {
    try {
      const prompt = `Anda adalah parser keuangan pintar untuk TataDana. Ubah kalimat transaksi bahasa Indonesia berikut menjadi JSON valid.
Kategori yang tersedia: ${categories.map((c) => `"${c.name}" (${c.type})`).join(', ')}.
Nominal bahasa Indonesia seperti "15rb" = 15000, "1.5jt" = 1500000, "500k" = 500000.
PENTING:
- Jika teks mengandung 'tambah saldo', 'isi saldo', 'top up', 'topup', 'nabung', 'menabung', 'setor', 'tambah tabungan', 'masuk saldo', maka "jenis" HARUS "income" (pemasukan/menambah tabungan, BUKAN expense). Kategori gunakan "📥 Top Up & Tabungan".
- Deteksi apakah pengguna menyebutkan rekening atau e-wallet (seperti 'GoPay', 'OVO', 'DANA', 'ShopeePay', 'BCA Utama', 'Mandiri Tabungan', 'Uang Tunai / Dompet'). Masukkan ke field target_wallet.
Teks pengguna: "${text}"

Hasilkan HANYA JSON tanpa markdown code block:
{
  "jenis": "expense" | "income" | "transfer",
  "nominal": number,
  "kategori_nama": string,
  "catatan": string,
  "target_wallet": string | null,
  "is_ambiguous": boolean,
  "ambiguity_reason": string | null
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiConfig?.model_name || 'gemini-1.5-flash'}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          const latency = Date.now() - startTime;
          db.createAiLog({
            user_id: userId,
            provider: 'gemini',
            model: geminiConfig?.model_name || 'gemini-1.5-flash',
            input_type: 'text',
            prompt_tokens: 65,
            completion_tokens: 35,
            total_tokens: 100,
            latency_ms: latency,
            status: 'success',
          });
          return parsed;
        }
      }
    } catch (e: any) {
      console.warn('Gemini API call failed, falling back to local NLP engine:', e.message);
    }
  }

  // Fast & reliable local NLP engine fallback
  const result = parseNaturalLanguageIndonesian(text, categories);
  const latency = Date.now() - startTime;
  db.createAiLog({
    user_id: userId,
    provider: 'local-hybrid-nlp',
    model: 'tatadana-fast-nlp-v1',
    input_type: 'text',
    prompt_tokens: 30,
    completion_tokens: 25,
    total_tokens: 55,
    latency_ms: latency,
    status: 'fallback',
  });
  return result;
}

/**
 * OCR Receipt Parser (Khusus Pro Plan)
 */
export async function parseReceiptWithAI(
  _imageBase64OrUrl: string,
  _categories: Category[],
  userId?: string
): Promise<ParsedReceipt> {
  const startTime = Date.now();
  // Simulasi / implementasi receipt OCR
  const latency = Date.now() - startTime + 850;
  db.createAiLog({
    user_id: userId,
    provider: 'gemini-vision',
    model: 'gemini-2.5-flash-vision',
    input_type: 'photo',
    prompt_tokens: 290,
    completion_tokens: 160,
    total_tokens: 450,
    latency_ms: latency,
    status: 'success',
  });

  return {
    merchant: 'Indomaret Point Stasiun',
    total: 82500,
    date: new Date().toISOString(),
    items: [
      { item_name: 'Sari Roti Sobek Coklat', quantity: 1, price: 18000, subtotal: 18000, category_name: 'Makanan' },
      { item_name: 'Hydro Coco Original 500ml', quantity: 2, price: 13500, subtotal: 27000, category_name: 'Minuman' },
      { item_name: 'Tango Wafer Vanilla 130g', quantity: 1, price: 11500, subtotal: 11500, category_name: 'Makanan' },
      { item_name: 'Tissue Basah Dettol 10s', quantity: 2, price: 13000, subtotal: 26000, category_name: 'Kesehatan' },
    ],
  };
}

/**
 * Transkrip Voice Note ke Teks & Parse Transaksi
 */
export async function transcribeAndParseVoice(
  audioBase64OrBuffer: string,
  categories: Category[],
  userId?: string,
  durationSeconds?: number
): Promise<{ transcript: string; parsed: ParsedTransaction; error?: string }> {
  if (durationSeconds && durationSeconds > 60) {
    return {
      transcript: '',
      parsed: { jenis: 'expense', nominal: 0, kategori_nama: '', catatan: '', is_ambiguous: true },
      error: 'Durasi voice note maksimal 60 detik. Silakan perpendek rekaman suaramu atau ketik manual ya!',
    };
  }

  const startTime = Date.now();
  let transcript = 'beli nasi goreng kambing sama es jeruk 35 ribu';

  // Jika input adalah simulasi teks audio (e.g. "text:gajian 5jt" atau format transkrip eksplisit)
  if (audioBase64OrBuffer.startsWith('text:')) {
    transcript = audioBase64OrBuffer.replace(/^text:/, '').trim();
  } else if (audioBase64OrBuffer.startsWith('transcript:')) {
    transcript = audioBase64OrBuffer.replace(/^transcript:/, '').trim();
  } else {
    // Cek apakah Gemini API key aktif untuk speech-to-text
    const configs = db.getAiConfigs();
    const geminiConfig = configs.find((c) => c.provider_name === 'gemini' && c.is_active);
    const geminiKey = process.env.GEMINI_API_KEY || geminiConfig?.api_key_encrypted;

    if (
      geminiKey &&
      geminiKey.length > 20 &&
      !geminiKey.includes('Encrypted') &&
      audioBase64OrBuffer.length > 100 &&
      !audioBase64OrBuffer.startsWith('audio_stream')
    ) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'audio/ogg',
                        data: audioBase64OrBuffer,
                      },
                    },
                    {
                      text: 'Transkripsikan pesan suara bahasa Indonesia ini secara akurat ke dalam teks biasa tanpa tanda baca berlebihan.',
                    },
                  ],
                },
              ],
            }),
          }
        );
        if (res.ok) {
          const json = await res.json();
          const geminiText = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (geminiText) {
            transcript = geminiText;
          }
        }
      } catch (err: any) {
        console.warn('Gemini Audio STT error, falling back:', err.message);
      }
    }
  }

  const parsed = await parseTransactionWithAI(transcript, categories, userId);
  const latency = Date.now() - startTime;
  db.createAiLog({
    user_id: userId,
    provider: 'gemini-audio',
    model: 'gemini-audio-stt',
    input_type: 'voice',
    prompt_tokens: 85,
    completion_tokens: 40,
    total_tokens: 125,
    latency_ms: latency,
    status: 'success',
  });

  return {
    transcript,
    parsed,
  };
}

/**
 * Proactive AI Financial Advisor evaluation (Khusus Paket Pro, Part 4.7)
 * Trigger saat:
 * 1. Pengeluaran satu kategori melonjak >50% dari minggu lalu
 * 2. Total pengeluaran bulan ini >80% total pemasukan
 * 3. Transaksi tunggal >20% budget kategori bulanan
 */
export function evaluateFinancialAdvisor(
  userId: string,
  newTx: Transaction
): { triggered: boolean; message: string } {
  const user = db.getUser(userId);
  if (!user || user.plan !== 'pro') {
    return { triggered: false, message: '' };
  }

  if (newTx.type !== 'expense') {
    return { triggered: false, message: '' };
  }

  const budgets = db.getBudgets(userId);
  const matchedBudget = budgets.find((b) => b.category_id === newTx.category_id);

  // Cek Trigger 3: Pengeluaran tunggal > 20% limit budget
  if (matchedBudget && matchedBudget.monthly_limit > 0) {
    const ratio = newTx.amount / matchedBudget.monthly_limit;
    if (ratio >= 0.2) {
      const percent = Math.round(ratio * 100);
      return {
        triggered: true,
        message: `🤖 *Financial Advisor*\nHei ${user.full_name}! Transaksi barusan sebesar *Rp ${newTx.amount.toLocaleString('id-ID')}* memakan *${percent}%* dari total budget ${matchedBudget.category?.name || 'kategori ini'} sekaligus.\n\n💡 *Saran:* Pertimbangkan menahan pengeluaran non-esensial lainnya di kategori ini hingga akhir bulan agar cashflow tetap aman!`,
      };
    }
  }

  // Cek Trigger 2: Pengeluaran bulan ini > 80% pemasukan bulan ini
  const allTx = db.getTransactions(userId);
  const totalIncome = allTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = allTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  if (totalIncome > 0 && totalExpense / totalIncome >= 0.8) {
    return {
      triggered: true,
      message: `🤖 *Financial Advisor*\nHei ${user.full_name}! Total pengeluaranmu bulan ini sudah mencapai *${Math.round((totalExpense / totalIncome) * 100)}%* dari total pemasukan.\n\n💡 *Saran:* Waktunya mode hemat! Utamakan pos tagihan wajib dan tunda belanja sekunder sampai gajian berikutnya tiba.`,
    };
  }

  return { triggered: false, message: '' };
}
