import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LoveMateLogo } from '../common/LoveMateLogo';
import { cloudEnabled, cloudSendPasswordReset, cloudSignInWithGoogle, cloudUpdatePassword } from '../../services/cloud';

type Mode = 'login' | 'signup' | 'forgot' | 'verify' | 'reset';

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, login, signup, setPasswordForEmail, accountExists, showToast } = useApp();

  const [mode, setMode] = useState<Mode>(authModalMode || 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '']);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMode(authModalMode);
    setError('');
    setNotice('');
    setOtpCode(['', '', '', '']);
    setIssuedCode(null);
  }, [authModalMode, authModalOpen]);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuthModal();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [authModalOpen, closeAuthModal]);

  if (!authModalOpen) return null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setNotice('');
  };

  const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.';

  /** There is no mail server in this build, so the recovery code is shown on screen. */
  const issueCode = () => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    setIssuedCode(code);
    setOtpCode(['', '', '', '']);
    showToast(`No email service is connected. Your recovery code is ${code}.`, 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) return setError('Please enter your name');
        if (!isEmail(email)) return setError('Please enter a valid email address');
        if (password.length < 6) return setError('Password must be at least 6 characters');
        if (password !== confirmPassword) return setError('Passwords do not match');
        const res = await signup(name, email, password);
        if (res === 'exists') return setError('An account with this email already exists. Sign in instead.');
        if (res === 'confirm_email') {
          setNotice(`Almost done! We sent a confirmation link to ${email.trim()}. Open it, then sign in here.`);
          return switchModeKeepNotice('login');
        }
        if (res === 'error') return setError(NETWORK_ERROR);
      } else if (mode === 'login') {
        if (!isEmail(email)) return setError('Please enter a valid email address');
        if (!password) return setError('Please enter your password');
        const res = await login(email, { password });
        if (res === 'no_account') return setError('No account found for this email. Create one first.');
        if (res === 'wrong_password')
          return setError(cloudEnabled ? 'Email or password is incorrect.' : 'Incorrect password. Try again or reset it.');
        if (res === 'not_confirmed') return setError('Please confirm your email first. Check your inbox for the link we sent.');
        if (res === 'error') return setError(NETWORK_ERROR);
      } else if (mode === 'forgot' && cloudEnabled) {
        if (!isEmail(email)) return setError('Please enter your registered email');
        if (!(await cloudSendPasswordReset(email))) return setError('Could not send the reset email right now. Please try again later.');
        setNotice(`If an account exists for ${email.trim()}, we sent a link to reset the password.`);
      } else if (mode === 'reset' && cloudEnabled) {
        if (password.length < 6) return setError('Password must be at least 6 characters');
        if (password !== confirmPassword) return setError('Passwords do not match');
        if (!(await cloudUpdatePassword(password))) return setError('Could not update the password. Open the reset link again.');
        showToast('Password updated. You are signed in.', 'success');
        closeAuthModal();
      } else if (mode === 'forgot') {
        if (!isEmail(email)) return setError('Please enter your registered email');
        if (!accountExists(email)) return setError('No account found for this email.');
        issueCode();
        setMode('verify');
      } else if (mode === 'verify') {
        if (otpCode.join('') !== issuedCode) return setError('That code is not correct.');
        setMode('reset');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'reset') {
        if (password.length < 6) return setError('Password must be at least 6 characters');
        if (password !== confirmPassword) return setError('Passwords do not match');
        const ok = await setPasswordForEmail(email, password);
        if (!ok) return setError('Could not update the password for this account.');
        showToast('Password updated. You are signed in.', 'success');
        await login(email, { password });
      }
    } finally {
      setBusy(false);
    }
  };

  const switchModeKeepNotice = (m: Mode) => {
    setMode(m);
    setError('');
  };

  const handleGoogle = async () => {
    if (!cloudEnabled) {
      // Local build without accounts: a stand-in Google account on this device.
      await login('google.demo@example.com', { provider: 'google', name: 'Google Demo' });
      showToast('Signed in with the Google demo account (no real OAuth in this build).', 'info');
      return;
    }
    setError('');
    setBusy(true);
    const res = await cloudSignInWithGoogle();
    if (res === 'redirecting') return; // the browser is leaving for Google
    setBusy(false);
    setError(res === 'not_enabled' ? 'Google sign-in is not switched on yet. Please use email for now.' : NETWORK_ERROR);
  };

  const handleGuest = async () => {
    await login('guest@example.com', { provider: 'otp', name: 'Explorer' });
  };

  const input =
    'w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100';

  const PasswordFields = (
    <>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="auth-password" className="text-xs font-semibold text-zinc-700">
            {mode === 'reset' ? 'New password' : 'Password'}
          </label>
          {mode === 'login' && (
            <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-rose-600 font-medium hover:underline">
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="auth-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'login' ? 'Your password' : 'At least 6 characters'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className={input}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {(mode === 'signup' || mode === 'reset') && (
        <div>
          <label htmlFor="auth-confirm" className="block text-xs font-semibold text-zinc-700 mb-1.5">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="auth-confirm"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className={input}
            />
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200/90 overflow-hidden relative my-4">
          <button
            onClick={closeAuthModal}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 pt-8 pb-4 text-center">
            <div className="flex justify-center mb-3">
              <LoveMateLogo variant="icon" size="lg" />
            </div>
            <h2 id="auth-title" className="text-xl font-bold text-zinc-900 tracking-tight">
              {mode === 'signup' && 'Create your account'}
              {mode === 'login' && 'Welcome back'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'verify' && 'Enter your recovery code'}
              {mode === 'reset' && 'Choose a new password'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              {mode === 'signup' && 'Your private AI wingman for love and relationships'}
              {mode === 'login' && 'Pick up where you left off'}
              {mode === 'forgot' && 'Enter the email you signed up with'}
              {mode === 'verify' && `Use the 4-digit code shown for ${email}`}
              {mode === 'reset' && (email ? `Set a new password for ${email}` : 'Set a new password for your account')}
            </p>

            {(mode === 'login' || mode === 'signup') && (
              <div className="flex bg-zinc-100 p-1 rounded-xl mt-5" role="tablist">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      mode === m ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {notice && (
            <div className="mx-6 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl" role="status">
              {notice}
            </div>
          )}

          {error && (
            <div className="mx-6 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Your name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input id="auth-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" autoComplete="name" className={input} />
                </div>
              </div>
            )}

            {mode !== 'verify' && mode !== 'reset' && (
              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" className={input} />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'reset') && PasswordFields}

            {mode === 'verify' && (
              <div className="py-2">
                <p className="block text-xs font-medium text-center text-zinc-700 mb-3">Enter the 4-digit code</p>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      aria-label={`Digit ${idx + 1}`}
                      value={otpCode[idx]}
                      onChange={(e) => {
                        const next = [...otpCode];
                        next[idx] = e.target.value.replace(/\D/g, '');
                        setOtpCode(next);
                        if (e.target.value && idx < 3) (e.target.nextElementSibling as HTMLInputElement | null)?.focus();
                      }}
                      className="w-12 h-12 text-center text-lg font-bold bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-rose-400 text-zinc-900"
                    />
                  ))}
                </div>
                <p className="text-center text-[11px] text-zinc-500 mt-3">
                  Didn’t get it?{' '}
                  <button type="button" onClick={issueCode} className="text-rose-600 font-semibold hover:underline">
                    Show a new code
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {mode === 'signup' && 'Create account'}
              {mode === 'login' && 'Sign in'}
              {mode === 'forgot' && 'Continue'}
              {mode === 'verify' && 'Verify code'}
              {mode === 'reset' && 'Save password & sign in'}
            </button>

            {(mode === 'login' || mode === 'signup') && (
              <>
                <div className="relative my-3 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <span className="relative px-2 text-[10px] uppercase font-semibold text-zinc-400 bg-white">Or</span>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogle}
                  className="w-full py-2 px-3 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  {cloudEnabled ? 'Continue with Google' : 'Continue with Google (demo)'}
                </button>

                <button type="button" onClick={handleGuest} className="w-full text-center text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors pt-1">
                  Explore as a guest
                </button>
              </>
            )}

            {(mode === 'forgot' || mode === 'verify' || mode === 'reset') && (
              <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-xs text-zinc-600 hover:text-zinc-900 font-medium">
                Back to sign in
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
