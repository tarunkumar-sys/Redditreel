'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Eye, EyeOff } from 'lucide-react';
import AppIcon from '@/components/AppIcon';
import { loginAction, registerAction, getRoleByEmail } from '@/app/actions/auth';
import { useScrollLock } from '@/lib/useScrollLock';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  callbackUrl?: string;
}

export default function LoginModal({ open, onClose, callbackUrl = '/dashboard' }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Per-field errors for instant feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useScrollLock(open);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const reset = () => { setError(''); setMsg(''); setFieldErrors({}); setShowPassword(false); };

  // Reset showPassword when switching between login/register
  useEffect(() => {
    setShowPassword(false);
  }, [isLogin]);

  /* ── Client-side validation (mirrors server rules) ── */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const NAME_RE  = /^[a-zA-Z0-9 _\-\.]{2,32}$/;

  function validateClient(formData: FormData): boolean {
    const errs: Record<string, string> = {};

    if (!isLogin) {
      const name = (formData.get('name') as string)?.trim();
      if (!name) errs.name = 'Display name is required.';
      else if (!NAME_RE.test(name)) errs.name = '2–32 chars, letters/numbers/spaces/_ - . only.';
    }

    const email = (formData.get('email') as string)?.trim();
    if (!email) errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.';

    const password = formData.get('password') as string;
    if (!password) {
      errs.password = 'Password is required.';
    } else if (!isLogin) {
      if (password.length < 8)       errs.password = 'At least 8 characters.';
      else if (!/[A-Z]/.test(password)) errs.password = 'Include at least one uppercase letter.';
      else if (!/[0-9]/.test(password)) errs.password = 'Include at least one number.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    reset();

    const formData = new FormData(e.currentTarget);
    if (!validateClient(formData)) return;

    setLoading(true);

    // Helper: redirect to role-appropriate destination
    const redirectByRole = async (email: string) => {
      const role = await getRoleByEmail(email);
      window.location.href = role === 'ADMIN' ? '/admin' : callbackUrl;
    };

    if (isLogin) {
      const res = await loginAction(formData);
      if (res?.error) { setError(res.error); setLoading(false); }
      else { await redirectByRole(formData.get('email') as string); }
    } else {
      const res = await registerAction(formData);
      if (res?.error) { setError(res.error); setLoading(false); }
      else {
        setMsg('Account created! Signing you in…');
        const loginRes = await loginAction(formData);
        if (loginRes?.error) { setError(loginRes.error); setLoading(false); }
        else { await redirectByRole(formData.get('email') as string); }
      }
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 900,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 901,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px',
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                width: '100%', maxWidth: 400,
                background: 'rgba(14,14,16,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 'clamp(28px, 5vw, 40px)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,45,85,0.08)',
                position: 'relative',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background .2s, color .2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                <X size={15} />
              </button>

              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                <AppIcon size={34} />
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, letterSpacing: '-.4px' }}>
                  Reddit Reel{' '}
                  <span style={{
                    background: 'linear-gradient(135deg,#ff2d55,#ff7055)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>AI</span>
                </span>
              </div>

              {/* Heading */}
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#fff', letterSpacing: '-.4px' }}>
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
                {isLogin
                  ? 'Sign in to access your personalised reel feed.'
                  : 'Join to save reels, create boards, and take notes.'}
              </p>

              {/* Alerts */}
              {error && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(255,68,68,.1)', border: '1px solid rgba(255,68,68,.25)',
                  color: '#ff6666', fontSize: 13,
                }}>{error}</div>
              )}
              {msg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                  background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.25)',
                  color: '#4ade80', fontSize: 13,
                }}>{msg}</div>
              )}

              {/* Form */}
              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {!isLogin && (
                  <div>
                    <input
                      name="name" type="text" placeholder="Display name"
                      required disabled={loading}
                      onChange={() => setFieldErrors(p => ({ ...p, name: '' }))}
                      style={{ ...inputStyle, borderColor: fieldErrors.name ? 'rgba(255,68,68,.5)' : undefined }}
                    />
                    {fieldErrors.name && <FieldError msg={fieldErrors.name} />}
                  </div>
                )}
                <div>
                  <input
                    name="email" type="email" placeholder="Email address"
                    required disabled={loading}
                    onChange={() => setFieldErrors(p => ({ ...p, email: '' }))}
                    style={{ ...inputStyle, borderColor: fieldErrors.email ? 'rgba(255,68,68,.5)' : undefined }}
                  />
                  {fieldErrors.email && <FieldError msg={fieldErrors.email} />}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    name="password" type={showPassword ? 'text' : 'password'}
                    placeholder={isLogin ? 'Password' : 'Password (8+ chars, 1 uppercase, 1 number)'}
                    required disabled={loading}
                    onChange={() => setFieldErrors(p => ({ ...p, password: '' }))}
                    style={{ 
                      ...inputStyle, 
                      borderColor: fieldErrors.password ? 'rgba(255,68,68,.5)' : undefined,
                      paddingRight: 44, // Make room for the eye icon
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex={-1}
                    style={{
                      position: 'absolute', top: '50%', right: 12,
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      padding: 4, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color .2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {fieldErrors.password && <FieldError msg={fieldErrors.password} />}
                </div>

                <button
                  type="submit" disabled={loading}
                  style={{
                    marginTop: 6,
                    padding: '13px 0', borderRadius: 10,
                    background: 'linear-gradient(135deg,#ff2d55,#ff4d66)',
                    color: '#fff', fontWeight: 800, fontSize: 15,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 20px rgba(255,45,85,.35)',
                    transition: 'opacity .2s, transform .15s',
                    opacity: loading ? 0.65 : 1,
                  }}
                >
                  {loading ? 'Please wait…' : (isLogin ? 'Sign In' : 'Create Account')}
                </button>
              </form>

              {/* Toggle */}
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); reset(); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <span style={{ color: '#ff2d55', fontWeight: 700 }}>
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Shared styles ── */
const inputStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 10, fontSize: 14, width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff', outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color .2s',
};

/* ── Inline field error ── */
function FieldError({ msg }: { msg: string }) {
  return (
    <p style={{ fontSize: 11, color: '#ff6666', marginTop: 4, paddingLeft: 2 }}>
      {msg}
    </p>
  );
}
