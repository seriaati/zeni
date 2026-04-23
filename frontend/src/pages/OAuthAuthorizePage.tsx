import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';
import { users } from '../lib/api';
import type { UserResponse } from '../lib/types';
import logoSrc from '../assets/logo-white.svg';

const BASE = (import.meta.env.VITE_API_URL ?? '') + '/api';

function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

type Mode = 'loading' | 'logged-in' | 'login-required' | 'denied' | 'error';

export function OAuthAuthorizePage() {
  const [searchParams] = useSearchParams();
  const state = searchParams.get('state') ?? '';
  const clientName = searchParams.get('client_name') ?? 'An application';
  const scopesRaw = searchParams.get('scopes') ?? 'user';

  const [mode, setMode] = useState<Mode>('loading');
  const [currentUser, setCurrentUser] = useState<UserResponse | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!state) {
      setMode('error');
      return;
    }
    const token = getAccessToken();
    if (!token) {
      setMode('login-required');
      return;
    }
    users.me()
      .then((u) => {
        setCurrentUser(u);
        setMode('logged-in');
      })
      .catch(() => {
        setMode('login-required');
      });
  }, [state]);

  const handleApproveWithSession = async () => {
    setSubmitting(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${BASE}/oauth/approve/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Authorization failed');
      }
      const { redirect_uri } = await res.json();
      window.location.href = redirect_uri;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Authorization failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveWithCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}/oauth/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? 'Invalid credentials');
      }
      const { redirect_uri } = await res.json();
      window.location.href = redirect_uri;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Authorization failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const scopeLabels: Record<string, string> = {
    user: 'Access your wallets, transactions, and categories',
  };
  const scopes = scopesRaw.split(' ').filter(Boolean);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', background: 'var(--cream)' }}>
      {/* Left panel */}
      <div
        className="auth-panel-left"
        style={{
          flex: '0 0 420px',
          background: 'var(--forest)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 80%, oklch(42% 0.1 155 / 0.6) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, oklch(52% 0.1 155 / 0.4) 0%, transparent 50%)`,
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={logoSrc} alt="" width="28" height="28" style={{ borderRadius: 6 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)' }}>Keni</span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 3vw, 38px)',
            color: 'var(--cream)',
            lineHeight: 1.25,
            marginBottom: 20,
            fontStyle: 'italic',
          }}>
            Secure<br />authorization.
          </p>
          <p style={{ fontSize: 14, color: 'oklch(90% 0.04 155)', lineHeight: 1.6 }}>
            Grant access to a connected application<br />
            using your Keni account.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            padding: '16px',
            background: 'oklch(30% 0.08 155 / 0.4)',
            borderRadius: 10,
            border: '1px solid oklch(60% 0.08 155 / 0.3)',
          }}>
            <p style={{ fontSize: 12, color: 'oklch(80% 0.04 155)', marginBottom: 8 }}>Requesting access</p>
            <p style={{ fontSize: 15, color: 'var(--cream)', fontWeight: 600 }}>{clientName}</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeIn 0.3s ease both' }}>
          {mode === 'loading' && (
            <p style={{ color: 'var(--ink-light)', fontSize: 14 }}>Loading…</p>
          )}

          {mode === 'error' && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 8, fontStyle: 'italic' }}>
                Invalid request
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-light)' }}>
                This authorization link is invalid or has expired.
              </p>
            </>
          )}

          {mode === 'denied' && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 8, fontStyle: 'italic' }}>
                Access denied
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-light)' }}>
                You denied access to <strong>{clientName}</strong>. You can close this window.
              </p>
            </>
          )}

          {mode === 'logged-in' && currentUser && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 6, fontStyle: 'italic' }}>
                Hi, {currentUser.display_name ?? currentUser.username}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 24 }}>
                <strong style={{ color: 'var(--ink)' }}>{clientName}</strong> is requesting access to your Keni account.
              </p>

              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
              }}>
                <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Permissions requested
                </p>
                {scopes.map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>
                      {scopeLabels[s] ?? s}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleApproveWithSession}
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  {submitting && <span className="btn-spinner" />}
                  Authorize
                </button>
                <button
                  className="btn btn-lg"
                  onClick={() => setMode('denied')}
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  Deny
                </button>
              </div>

              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <button
                  onClick={() => { setCurrentUser(null); setMode('login-required'); }}
                  style={{ fontSize: 13, color: 'var(--ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Not you? Sign in with a different account
                </button>
              </div>
            </>
          )}

          {mode === 'login-required' && (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 6, fontStyle: 'italic' }}>
                Sign in to authorize
              </h1>
              <p style={{ fontSize: 14, color: 'var(--ink-light)', marginBottom: 24 }}>
                <strong style={{ color: 'var(--ink)' }}>{clientName}</strong> is requesting access to your Keni account.
              </p>

              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
                marginBottom: 24,
              }}>
                <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Permissions requested
                </p>
                {scopes.map((s) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--ink-light)' }}>
                      {scopeLabels[s] ?? s}
                    </span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleApproveWithCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={submitting}
                    style={{ width: '100%' }}
                  >
                    {submitting && <span className="btn-spinner" />}
                    Sign in &amp; authorize
                  </button>
                  <button
                    type="button"
                    className="btn btn-lg"
                    onClick={() => setMode('denied')}
                    disabled={submitting}
                    style={{ width: '100%' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .auth-panel-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
