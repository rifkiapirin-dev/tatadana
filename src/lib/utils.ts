import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format nominal Rupiah Indonesia, e.g. 15000 -> "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  const rounded = Math.round(amount);
  return 'Rp ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format tanggal dalam format WIB (Asia/Jakarta)
 */
export function formatDateWib(dateStrOrObj: string | Date | number): string {
  const d = new Date(dateStrOrObj);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Format tanggal dan jam WIB
 * Contoh: "Senin, 13 Oktober 2026 — 14:30 WIB"
 */
export function formatDateTimeWib(dateStrOrObj: string | Date | number): string {
  const d = new Date(dateStrOrObj);
  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);

  const timeFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${dateFormatted} — ${timeFormatted} WIB`;
}

/**
 * Jam dan menit WIB, e.g. "14:30 WIB"
 */
export function formatTimeWib(dateStrOrObj: string | Date | number): string {
  const d = new Date(dateStrOrObj);
  const timeFormatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${timeFormatted} WIB`;
}

/**
 * Visual Progress Bar generator dengan karakter █ dan ░
 * Contoh: [████████░░] 80%
 */
export function generateProgressBar(percent: number, length: number = 10): string {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const filledBlocks = Math.round((safePercent / 100) * length);
  const emptyBlocks = length - filledBlocks;
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}

/**
 * Parsing nominal teks bahasa Indonesia ke integer
 * 15rb / 15ribu -> 15000
 * 1.5jt / 1,5jt -> 1500000
 * 500k -> 500000
 * 25.000 / 25000 -> 25000
 */
export function parseIndonesianAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim().replace(/rp/g, '').trim();

  // Pola jutaan: e.g. 1.5jt, 1,5jt, 2jt, 10 juta
  const jtMatch = cleaned.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:jt|juta)$/);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  // Pola ribuan: e.g. 15rb, 15ribu, 500k, 2.5k
  const rbMatch = cleaned.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:rb|ribu|k)$/);
  if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  // Pola angka standar: e.g. 15000, 15.000, 15,000
  const numCleaned = cleaned.replace(/[.,]/g, '');
  const parsed = parseInt(numCleaned, 10);
  if (!isNaN(parsed) && parsed > 0) {
    return parsed;
  }

  return null;
}
