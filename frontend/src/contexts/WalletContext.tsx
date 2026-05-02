import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { wallets as walletsApi } from '../lib/api';
import type { WalletResponse } from '../lib/types';
import { useAuth } from './AuthContext';

interface WalletContextValue {
  wallets: WalletResponse[];
  activeWallet: WalletResponse | null;
  setActiveWallet: (wallet: WalletResponse) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const LAST_WALLET_KEY = (userId: string) => `zeni_last_wallet_${userId}`;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [activeWallet, setActiveWalletState] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await walletsApi.list();
      setWallets(list);
      setActiveWalletState((prev) => {
        if (prev) {
          const updated = list.find((w) => w.id === prev.id);
          if (updated) return updated;
        }
        const lastId = localStorage.getItem(LAST_WALLET_KEY(user.id));
        return (lastId ? list.find((w) => w.id === lastId) : null) ?? list[0] ?? null;
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setActiveWallet = (wallet: WalletResponse) => {
    setActiveWalletState(wallet);
    if (user) localStorage.setItem(LAST_WALLET_KEY(user.id), wallet.id);
  };

  return (
    <WalletContext.Provider value={{ wallets, activeWallet, setActiveWallet, loading, refresh }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
