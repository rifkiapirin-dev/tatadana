'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Wallet, Category, Budget, Transaction, DailyReminder, TelegramLink } from '@/types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  isImpersonating: boolean;
  setIsImpersonating: (val: boolean) => void;
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  reminder: DailyReminder | null;
  telegramLink: TelegramLink | null;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [reminder, setReminder] = useState<DailyReminder | null>(null);
  const [telegramLink, setTelegramLink] = useState<TelegramLink | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const loadData = async (userId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Wallets
      const wRes = await fetch(`/api/wallets?userId=${userId}`);
      const wData = await wRes.json();
      if (wData.ok) setWallets(wData.wallets);

      // 2. Fetch Categories
      const cRes = await fetch(`/api/categories?userId=${userId}`);
      const cData = await cRes.json();
      if (cData.ok) setCategories(cData.categories);

      // 3. Fetch Budgets
      const bRes = await fetch(`/api/budgets?userId=${userId}`);
      const bData = await bRes.json();
      if (bData.ok) setBudgets(bData.budgets);

      // 4. Fetch Transactions
      const tRes = await fetch(`/api/transactions?userId=${userId}`);
      const tData = await tRes.json();
      if (tData.ok) setTransactions(tData.transactions);

      // 5. Fetch Reminders
      const rRes = await fetch(`/api/reminders?userId=${userId}`);
      const rData = await rRes.json();
      if (rData.ok) setReminder(rData.reminder);

      // 6. Fetch Telegram Link status
      const tgRes = await fetch(`/api/telegram/test-connection?userId=${userId}`);
      const tgData = await tgRes.json();
      if (tgData.ok && tgData.link) setTelegramLink(tgData.link);

      // 7. Fetch Admin info for current user
      const aRes = await fetch(`/api/admin`);
      const aData = await aRes.json();
      if (aData.ok && aData.users) {
        const found = aData.users.find((u: User) => u.id === userId || u.email === 'rifkiarifin@gmail.com');
        if (found) {
          setCurrentUserState(found);
        } else if (aData.users.length > 0) {
          setCurrentUserState(aData.users[0]);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let savedUserId = typeof window !== 'undefined' ? localStorage.getItem('tatadana_user_id') : null;
    if (!savedUserId || savedUserId === 'usr-budi-01' || savedUserId === 'usr-admin-00' || savedUserId === 'usr-admin-02') {
      savedUserId = 'usr-admin-rifki';
      if (typeof window !== 'undefined') {
        localStorage.setItem('tatadana_user_id', 'usr-admin-rifki');
      }
    }
    loadData(savedUserId);
  }, []);

  const switchUser = (userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_user_id', userId);
    }
    loadData(userId);
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_user_id', user.id);
    }
    loadData(user.id);
  };

  const refreshData = async () => {
    const effectiveId =
      currentUser?.id ||
      (typeof window !== 'undefined' ? localStorage.getItem('tatadana_user_id') : null) ||
      'usr-admin-rifki';
    await loadData(effectiveId);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        isImpersonating,
        setIsImpersonating,
        wallets,
        categories,
        budgets,
        transactions,
        reminder,
        telegramLink,
        isLoading,
        refreshData,
        notify,
        notification,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
      }}
    >
      {children}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm font-medium transition-all animate-bounce bg-white border-emerald-500 text-slate-800">
          <span
            className={`w-3 h-3 rounded-full ${
              notification.type === 'error' ? 'bg-rose-500' : notification.type === 'info' ? 'bg-sky-500' : 'bg-emerald-500'
            }`}
          />
          {notification.message}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
