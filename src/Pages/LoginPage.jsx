import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IceCream, Lock, Mail, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Keyframe animations injected once ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  * { font-family: 'Inter', sans-serif; }

  @keyframes panelSlideLeft {
    from { opacity: 0; transform: translateX(-60px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes panelSlideRight {
    from { opacity: 0; transform: translateX(60px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes blobFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-18px) scale(1.04); }
  }

  @keyframes blobFloat2 {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(14px) scale(0.97); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    15%       { transform: translateX(-6px); }
    30%       { transform: translateX(6px); }
    45%       { transform: translateX(-5px); }
    60%       { transform: translateX(5px); }
    75%       { transform: translateX(-3px); }
    90%       { transform: translateX(3px); }
  }

  @keyframes spinnerRotate {
    to { transform: rotate(360deg); }
  }

  @keyframes dotGrid {
    0%, 100% { opacity: 0.08; }
    50%       { opacity: 0.14; }
  }

  .anim-panel-left  { animation: panelSlideLeft  0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .anim-panel-right { animation: panelSlideRight 0.7s cubic-bezier(0.22,1,0.36,1) both; }

  .anim-fade-up-1 { animation: fadeUp 0.55s ease both; animation-delay: 0.15s; }
  .anim-fade-up-2 { animation: fadeUp 0.55s ease both; animation-delay: 0.25s; }
  .anim-fade-up-3 { animation: fadeUp 0.55s ease both; animation-delay: 0.35s; }
  .anim-fade-up-4 { animation: fadeUp 0.55s ease both; animation-delay: 0.45s; }
  .anim-fade-up-5 { animation: fadeUp 0.55s ease both; animation-delay: 0.52s; }
  .anim-fade-up-6 { animation: fadeUp 0.55s ease both; animation-delay: 0.58s; }

  .blob-1 { animation: blobFloat  5s ease-in-out infinite; }
  .blob-2 { animation: blobFloat2 6.5s ease-in-out infinite; }
  .blob-3 { animation: blobFloat  8s ease-in-out infinite; animation-delay: -2s; }

  .dot-grid { animation: dotGrid 4s ease-in-out infinite; }

  .shake { animation: shake 0.45s ease; }

  .spinner {
    width: 20px; height: 20px;
    border: 2.5px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spinnerRotate 0.7s linear infinite;
    display: inline-block;
  }

  /* Input focus glow */
  .input-green:focus {
    outline: none;
    border-color: #22c55e !important;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.18);
  }

  /* CTA button */
  .btn-green {
    background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  .btn-green:hover:not(:disabled) {
    background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(34,197,94,0.38);
  }
  .btn-green:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 6px 14px rgba(34,197,94,0.28);
  }
  .btn-green:disabled {
    opacity: 0.72;
    cursor: not-allowed;
  }

  /* Eye toggle */
  .eye-btn { transition: color 0.2s ease; }
  .eye-btn:hover { color: #16a34a; }
`;

export function LoginPage() {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [shakeKey, setShakeKey]       = useState(0);

  // Two-step sign-in: password first, then the 6-digit code emailed to the account
  const [step, setStep]               = useState('credentials'); // 'credentials' | 'otp'
  const [challenge, setChallenge]     = useState('');
  const [emailHint, setEmailHint]     = useState('');
  const [otp, setOtp]                 = useState('');
  const [cooldown, setCooldown]       = useState(0);

  const { login, verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate   = useNavigate();

  /* Inject styles once */
  useEffect(() => {
    const id = 'login-page-styles';
    if (!document.getElementById(id)) {
      const tag = document.createElement('style');
      tag.id = id;
      tag.textContent = STYLES;
      document.head.appendChild(tag);
    }
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const backToPassword = () => {
    setStep('credentials');
    setChallenge('');
    setOtp('');
    setPassword('');
  };

  const submitOtp = async (code) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await verifyLoginOtp(challenge, code);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Verification failed.');
      setShakeKey(k => k + 1);
      setOtp('');
      if (err.restart) backToPassword();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6) submitOtp(digits); // auto-submit once complete (also handles paste)
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const res = await resendLoginOtp(challenge);
      if (res.emailHint) setEmailHint(res.emailHint);
      setOtp('');
      setCooldown(30);
      toast.success('A new code has been sent');
    } catch (err) {
      toast.error(err.message || 'Could not resend the code.');
      if (err.restart) backToPassword();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required.');
      setShakeKey(k => k + 1);
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result?.otpRequired) {
        setChallenge(result.challenge);
        setEmailHint(result.emailHint || '');
        setOtp('');
        setCooldown(30);
        setStep('otp');
        return;
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid credentials. Please try again.');
      setShakeKey(k => k + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* ═══════════════════════════════════
          LEFT PANEL — Green Brand Panel
      ═══════════════════════════════════ */}
      <div
        className="anim-panel-left"
        style={{
          display: 'none',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #15803d 0%, #166534 30%, #14532d 65%, #052e16 100%)',
          flexShrink: 0,
        }}
        id="login-left-panel"
      >
        {/* ── Responsive hide/show via style tag in head ── */}
        <style>{`
          @media (min-width: 768px) {
            #login-left-panel { display: flex !important; flex-direction: column; justify-content: center; align-items: center; width: 42%; }
          }
          @media (min-width: 1024px) {
            #login-left-panel { width: 45%; }
          }
        `}</style>

        {/* Blob 1 — top-left bright */}
        <div
          className="blob-1"
          style={{
            position: 'absolute', top: '-80px', left: '-80px',
            width: '340px', height: '340px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(134,239,172,0.35) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Blob 2 — bottom-right */}
        <div
          className="blob-2"
          style={{
            position: 'absolute', bottom: '-60px', right: '-60px',
            width: '300px', height: '300px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Blob 3 — centre glow */}
        <div
          className="blob-3"
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '260px', height: '260px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(187,247,208,0.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* Dot grid overlay */}
        <div
          className="dot-grid"
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            pointerEvents: 'none',
          }}
        />

        {/* Brand content */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '48px 40px' }}>
          {/* Logo icon */}
          <div
            style={{
              width: '90px', height: '90px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <IceCream style={{ width: '48px', height: '48px', color: '#bbf7d0' }} />
          </div>

          {/* Wordmark */}
          <h1 style={{ color: '#ffffff', fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            FRUTICO
          </h1>
          <p style={{ color: '#86efac', fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
            Billing Software
          </p>

          {/* Divider */}
          <div style={{ width: '48px', height: '3px', background: 'rgba(134,239,172,0.45)', borderRadius: '2px', margin: '28px auto' }} />

          {/* Tagline */}
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '260px', margin: '0 auto' }}>
            Manage sales, stock, and billing — all in one place.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════
          RIGHT PANEL — Login Form
      ═══════════════════════════════════ */}
      <div
        className="anim-panel-right"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#ffffff',
          padding: '40px 24px',
          minHeight: '100vh',
        }}
      >
        {/* Card wrapper */}
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* Mobile-only brand header */}
          <div
            style={{ textAlign: 'center', marginBottom: '36px' }}
            id="login-mobile-brand"
          >
            <style>{`
              @media (min-width: 768px) { #login-mobile-brand { display: none !important; } }
            `}</style>
            <div
              style={{
                width: '68px', height: '68px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #22c55e, #15803d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
              }}
            >
              <IceCream style={{ width: '36px', height: '36px', color: '#fff' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>FRUTICO</h2>
            <p style={{ color: '#22c55e', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Billing Software</p>
          </div>

          {step === 'otp' ? (
            <div key={shakeKey}>
              <div className="anim-fade-up-1" style={{ marginBottom: '28px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ShieldCheck style={{ width: '28px', height: '28px', color: '#15803d' }} />
                </div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Verify it's you</h2>
                <p style={{ color: '#6b7280', fontSize: '0.92rem', margin: 0 }}>
                  We emailed a 6-digit code to <b style={{ color: '#111827' }}>{emailHint}</b>. It expires in 5 minutes.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) submitOtp(otp); }} noValidate>
                <label htmlFor="login-otp" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '7px' }}>Verification code</label>
                <input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="••••••"
                  className="input-green"
                  aria-label="6-digit verification code"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '14px', textAlign: 'center',
                    fontSize: '1.75rem', fontWeight: 700, letterSpacing: '0.5em', paddingLeft: '0.5em',
                    border: '1.5px solid #d1fae5', borderRadius: '10px', background: '#f9fafb', color: '#111827',
                  }}
                />

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="btn-green"
                  style={{ width: '100%', marginTop: '20px', padding: '14px 24px', borderRadius: '10px', border: 'none', color: '#ffffff', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: isLoading || otp.length !== 6 ? 'not-allowed' : 'pointer' }}
                >
                  {isLoading ? (<><span className="spinner" />Verifying…</>) : 'Verify & Sign In'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button type="button" onClick={backToPassword} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button type="button" onClick={handleResend} disabled={cooldown > 0}
                  style={{ background: 'none', border: 'none', cursor: cooldown > 0 ? 'default' : 'pointer', color: cooldown > 0 ? '#9ca3af' : '#16a34a', fontSize: '0.85rem', fontWeight: 600, padding: 0 }}>
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* Heading */}
          <div className="anim-fade-up-1" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.92rem', margin: 0 }}>
              Sign in to your FRUTICO account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>

            {/* Email Field */}
            <div className="anim-fade-up-2" style={{ marginBottom: '18px' }}>
              <label
                htmlFor="login-email"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '7px' }}
              >
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    width: '18px', height: '18px', color: '#9ca3af', pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@frutico.com"
                  autoFocus
                  autoComplete="email"
                  className="input-green"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: '42px',
                    paddingRight: '14px',
                    paddingTop: '13px',
                    paddingBottom: '13px',
                    border: '1.5px solid #d1fae5',
                    borderRadius: '10px',
                    background: '#f9fafb',
                    color: '#111827',
                    fontSize: '0.92rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="anim-fade-up-3" style={{ marginBottom: '8px' }}>
              <label
                htmlFor="login-password"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '7px' }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    width: '18px', height: '18px', color: '#9ca3af', pointerEvents: 'none',
                  }}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="input-green"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    paddingLeft: '42px',
                    paddingRight: '46px',
                    paddingTop: '13px',
                    paddingBottom: '13px',
                    border: '1.5px solid #d1fae5',
                    borderRadius: '10px',
                    background: '#f9fafb',
                    color: '#111827',
                    fontSize: '0.92rem',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="eye-btn"
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9ca3af', padding: '2px', display: 'flex', alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="anim-fade-up-4" style={{ textAlign: 'right', marginBottom: '26px' }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#16a34a', fontSize: '0.85rem', fontWeight: 500,
                  padding: '2px 0',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#15803d'}
                onMouseLeave={e => e.currentTarget.style.color = '#16a34a'}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="anim-fade-up-5">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="btn-green"
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.01em',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

            </>
          )}

          {/* Footer */}
          <div
            className="anim-fade-up-6"
            style={{ textAlign: 'center', marginTop: '40px' }}
          >
            <p style={{ color: '#d1d5db', fontSize: '0.78rem', margin: 0 }}>
              © {new Date().getFullYear()} FRUTICO · All rights reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;