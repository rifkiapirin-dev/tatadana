'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  Camera,
  Mic,
  Sparkles,
  Bot,
  User as UserIcon,
  Wallet as WalletIcon,
  CreditCard,
  Building,
  Smartphone,
  Banknote,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatRupiah } from '@/lib/utils';
import { Wallet, PendingTransactionConfirmation } from '@/types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  photoUrl?: string;
  isVoice?: boolean;
  time: string;
  isConfirmationPrompt?: boolean;
  pendingTx?: PendingTransactionConfirmation;
  availableWallets?: Wallet[];
}

export default function TelegramSimulatorModal({ onClose }: { onClose: () => void }) {
  const { currentUser, wallets, refreshData } = useApp();
  const [selectedWalletId, setSelectedWalletId] = useState<string>('auto');
  const [activePendingConfirmation, setActivePendingConfirmation] =
    useState<PendingTransactionConfirmation | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'bot',
      text: `👋 *Halo ${
        currentUser?.full_name || 'Teman TataDana'
      }!*\n\nSelamat datang di Bot Telegram TataDana. Coba ketik transaksi:\n• _"beli bakso 15rb"_ → *Bot akan konfirmasi pilihan dompet*\n• _"bayar listrik 100rb"_\n• _"tambah saldo gopay 100rb"_\n• _/saldo_\n\nAtau klik tombol prompt instan di bawah ini!`,
      time: '14:30',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const getWalletIcon = (wallet: Wallet) => {
    if (wallet.type === 'ewallet') return '📱';
    if (wallet.name.toLowerCase().includes('bca')) return '💳';
    if (wallet.type === 'bank') return '🏛️';
    return '💵';
  };

  const sendMessage = async (
    customText?: string,
    isPhoto = false,
    isVoice = false,
    explicitWalletId?: string
  ) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend && !isPhoto && !isVoice) return;

    const userTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: isPhoto
        ? '📷 [Mengirim Foto Struk Indomaret]'
        : isVoice
        ? '🎙️ [Mengirim Voice Note: "Beli bakso 15 ribu"]'
        : textToSend,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const updateId = Math.floor(100000 + Math.random() * 900000);
      const payload: any = {
        update_id: updateId,
        message: {
          message_id: Math.floor(Math.random() * 10000),
          from: {
            id: currentUser?.id === 'usr-siti-02' ? 987654321 : 123456789,
            first_name: currentUser?.full_name || 'Budi',
            username: currentUser?.id === 'usr-siti-02' ? 'sitirahma' : 'budisantoso_id',
          },
          chat: {
            id: 123456789,
            type: 'private',
          },
          date: Math.floor(Date.now() / 1000),
        },
      };

      if (explicitWalletId) {
        payload.message.selected_wallet_id = explicitWalletId;
      } else if (selectedWalletId !== 'auto') {
        payload.message.selected_wallet_id = selectedWalletId;
      }

      if (isPhoto) {
        payload.message.photo = [
          { file_id: 'ph-dummy-thumb', width: 100, height: 100 },
          { file_id: 'ph-dummy-full', width: 800, height: 1200 },
        ];
      } else if (isVoice) {
        payload.message.voice = {
          file_id: 'voice-dummy-id',
          duration: 12,
        };
      } else {
        payload.message.text = textToSend;
      }

      // Call internal webhook endpoint
      const res = await fetch('/api/telegram/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      await refreshData();

      const botTime = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // Handle awaiting wallet confirmation state
      if (data.status === 'awaiting_wallet_confirmation') {
        setActivePendingConfirmation(data.pending_confirmation);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-conf-${Date.now()}`,
            sender: 'bot',
            text:
              data.reply ||
              'Mau bayar melalui rekening atau e-wallet yang mana? Silakan pilih salah satu dompet di bawah ini:',
            time: botTime,
            isConfirmationPrompt: true,
            pendingTx: data.pending_confirmation,
            availableWallets: data.wallets || wallets,
          },
        ]);
        return;
      }

      // If pending transaction was just completed or cancelled
      if (data.status === 'expense_recorded' || data.status === 'confirmation_cancelled') {
        setActivePendingConfirmation(null);
      }

      // Formulate display based on server response
      let botResponseText = '';
      if (data.reply) {
        botResponseText = data.reply;
      } else if (data.status === 'already_processed') {
        botResponseText = '⚠️ Update telah diproses sebelumnya (idempotency guard).';
      } else if (data.status === 'limit_reached') {
        botResponseText = `⚠️ *Limit Transaksi Bulanan Tercapai*\n\nAkun Starter kamu telah mencapai batas 50 transaksi untuk bulan ini.\n\n🚀 Upgrade ke Paket Pro untuk transaksi unlimited!`;
      } else if (data.status === 'photo_restricted_starter') {
        botResponseText = `📷 *Fitur Foto Struk Khusus Paket Pro*\n\nKamu saat ini menggunakan paket Starter. Fitur AI OCR foto struk otomatis hanya tersedia untuk pengguna Pro.`;
      } else {
        botResponseText = `📅 Hari ini — WIB\nTransaksi berhasil diproses dan disinkronisasi ke dashboard!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botResponseText,
          time: botTime,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `⚠️ Error simulator: ${err.message}`,
          time: userTime,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWalletChoice = (wallet: Wallet) => {
    // Send wallet choice to resolve pending confirmation
    sendMessage(wallet.name, false, false, wallet.id);
  };

  const handleCancelChoice = () => {
    sendMessage('batal');
  };

  const quickPrompts = [
    { label: '💸 Beli Bakso 15rb (Minta Dompet)', action: () => sendMessage('beli bakso 15rb') },
    { label: '⚡ Bayar Listrik 100rb (Minta Dompet)', action: () => sendMessage('bayar listrik 100rb') },
    { label: '➕ Tambah Saldo GoPay 100rb', action: () => sendMessage('tambah saldo gopay 100rb') },
    { label: '➕ Top Up Mandiri 500rb', action: () => sendMessage('top up mandiri 500rb') },
    { label: '💰 Gajian 15jt', action: () => sendMessage('gajian 15jt') },
    { label: '👛 /saldo', action: () => sendMessage('/saldo') },
    { label: '🎯 /budget', action: () => sendMessage('/budget') },
    { label: '📷 Foto Struk AI', action: () => sendMessage('', true, false) },
    { label: '🎙️ Voice Note AI', action: () => sendMessage('', false, true) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col h-[690px]">
        {/* Telegram Header */}
        <div className="bg-gradient-to-r from-[#24A1DE] via-teal-500 to-[#10B981] text-white px-5 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white text-teal-600 font-black flex items-center justify-center text-sm shadow">
              TD
            </div>
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5">
                TataDana FinBot (@tatadana2_bot)
                <span className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse" />
              </div>
              <div className="text-[11px] text-white/90">
                User: {currentUser?.full_name} ({currentUser?.plan?.toUpperCase()})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              onClick={q.action}
              disabled={loading}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 border border-slate-200 whitespace-nowrap transition-all disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e4ecf2] bg-opacity-70">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm text-xs leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user'
                    ? 'bg-[#EEFFDE] text-slate-900 rounded-tr-none'
                    : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                }`}
              >
                <div>{m.text}</div>

                {/* INTERACTIVE WALLET SELECTION BUTTONS */}
                {m.isConfirmationPrompt && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span>👉 Klik untuk memilih dompet pemotong saldo:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {(m.availableWallets || wallets).map((w) => (
                        <button
                          key={w.id}
                          onClick={() => handleSelectWalletChoice(w)}
                          disabled={loading}
                          className="px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 active:scale-[0.98] text-slate-800 hover:text-emerald-900 border border-slate-200 hover:border-emerald-400 font-bold text-xs flex items-center justify-between transition-all shadow-xs group"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{getWalletIcon(w)}</span>
                            <span className="truncate">{w.name}</span>
                          </span>
                          <span className="text-[10px] text-teal-600 font-semibold shrink-0 ml-1">
                            {formatRupiah(w.balance)}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px]">
                      <span className="text-slate-400">Atau ketik angka [1-{wallets.length}]</span>
                      <button
                        onClick={handleCancelChoice}
                        disabled={loading}
                        className="text-rose-500 hover:text-rose-700 font-bold hover:underline"
                      >
                        ✕ Batalkan
                      </button>
                    </div>
                  </div>
                )}

                <div
                  className={`text-[9px] text-right mt-1.5 ${
                    m.sender === 'user' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm text-xs text-slate-500 italic flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                TataDana Bot sedang memproses transaksi...
              </div>
            </div>
          )}
        </div>

        {/* Floating Pending Confirmation Action Bar */}
        {activePendingConfirmation && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center justify-between gap-2 text-xs">
            <div className="truncate text-amber-900">
              <span className="font-bold">Konfirmasi:</span> {activePendingConfirmation.notes} (
              {formatRupiah(activePendingConfirmation.amount)})
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {wallets.slice(0, 3).map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWalletChoice(w)}
                  disabled={loading}
                  className="px-2 py-0.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold text-[10px] hover:bg-emerald-50 hover:border-emerald-400"
                >
                  {w.name.split(' ')[0]}
                </button>
              ))}
              <button
                onClick={handleCancelChoice}
                className="p-1 rounded-lg text-rose-600 hover:bg-rose-100"
                title="Batal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={() => sendMessage('', true, false)}
            title="Kirim Foto Struk (OCR)"
            className="p-2.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Camera className="w-5 h-5" />
          </button>
          <button
            onClick={() => sendMessage('', false, true)}
            title="Kirim Voice Note (STT)"
            className="p-2.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={
              activePendingConfirmation
                ? `Pilih dompet: balas 1-${wallets.length} atau nama dompet (BCA, GoPay)...`
                : "Ketik 'beli bakso 15rb' atau 'bayar listrik 100rb'..."
            }
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#24A1DE] text-xs text-slate-800 placeholder:text-slate-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-full bg-[#24A1DE] text-white hover:bg-[#1f8ec4] transition-all disabled:opacity-40 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
