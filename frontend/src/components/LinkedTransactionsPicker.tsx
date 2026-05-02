import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { transactionLinks } from '../lib/api';
import { Modal } from './ui/Modal';
import { CategoryIcon } from '../lib/categoryIcons';
import type { TransactionResponse, WalletResponse } from '../lib/types';
import { fmt, fmtDate } from '../lib/utils';

interface LinkedTransactionsPickerProps {
  open: boolean;
  onClose: () => void;
  currentTransactionId: string;
  currentWalletId: string;
  wallets: WalletResponse[];
  alreadyLinkedIds: string[];
  onLink: (transaction: TransactionResponse) => Promise<void>;
}

export function LinkedTransactionsPicker({
  open,
  onClose,
  currentTransactionId,
  currentWalletId,
  wallets,
  alreadyLinkedIds,
  onLink,
}: LinkedTransactionsPickerProps) {
  const [selectedWalletId, setSelectedWalletId] = useState(currentWalletId);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedWalletId(currentWalletId);
    setSearch('');
    setResults([]);
  }, [open, currentWalletId]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await transactionLinks.search({
          q: search || undefined,
          wallet_id: selectedWalletId,
          exclude_id: currentTransactionId,
          page_size: 30,
        });
        setResults(res.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, search, selectedWalletId, currentTransactionId]);

  const walletCurrency = (walletId: string) =>
    wallets.find((w) => w.id === walletId)?.currency ?? 'USD';

  const handleLink = async (target: TransactionResponse) => {
    setLinkingId(target.id);
    try {
      await onLink(target);
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Link a transaction" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="input"
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            style={{ flex: '0 0 auto', width: 'auto' }}
          >
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <input
            autoFocus
            className="input"
            type="text"
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minHeight: 200, maxHeight: 360, overflowY: 'auto', scrollbarGutter: 'stable', paddingRight: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--ink-faint, #aaa)' }} />
            </div>
          ) : results.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--ink-faint, #aaa)', fontSize: 13, padding: 32, fontStyle: 'italic' }}>
              No transactions found
            </p>
          ) : (
            results.map((t, i) => {
              const linked = alreadyLinkedIds.includes(t.id);
              const isLinking = linkingId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => !linked && !isLinking && handleLink(t)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 4px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--cream, #f5f0e8)',
                    cursor: linked ? 'default' : 'pointer',
                    opacity: linked ? 0.6 : 1,
                    borderRadius: 6,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!linked) (e.currentTarget as HTMLDivElement).style.background = 'var(--cream, #f5f0e8)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <CategoryIcon
                    iconName={t.category.icon}
                    color={t.category.color}
                    size={14}
                    containerSize={30}
                    borderRadius={8}
                    fallbackLetter={t.category.name[0]}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description ?? t.category.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint, #aaa)' }}>
                      {t.category.name} · {fmtDate(t.date)}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.type === 'income' ? 'var(--forest)' : 'var(--ink)', flexShrink: 0 }}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount, walletCurrency(t.wallet_id))}
                  </div>
                  {linked && (
                    <span style={{ fontSize: 11, color: 'var(--forest)', fontWeight: 600, flexShrink: 0 }}>Linked</span>
                  )}
                  {isLinking && (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', flexShrink: 0, color: 'var(--ink-faint, #aaa)' }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
