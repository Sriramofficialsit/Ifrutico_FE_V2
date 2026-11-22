import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../Context/AuthContext';
import toast from 'react-hot-toast';
import AuthShell, { AuthField, AuthButton, OtpBoxes } from '../Components/AuthShell';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Two-step sign-in: password first, then the 6-digit code emailed to the account
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [challenge, setChallenge] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { login, verifyLoginOtp, resendLoginOtp } = useAuth();
  const navigate = useNavigate();

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
      setShakeKey((k) => k + 1);
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
      setShakeKey((k) => k + 1);
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
      setShakeKey((k) => k + 1);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <AuthShell
        icon={ShieldCheck}
        title="Verify it's you"
        subtitle={<>We emailed a 6-digit code to <b className="text-gray-900">{emailHint}</b>. It expires in 5 minutes.</>}
      >
        <form key={shakeKey} className={shakeKey ? 'auth-shake' : ''} onSubmit={(e) => { e.preventDefault(); if (otp.length === 6) submitOtp(otp); }} noValidate>
          <label htmlFor="login-otp" className="block text-sm font-semibold text-gray-700 mb-1.5">Verification code</label>
          <OtpBoxes id="login-otp" value={otp} onChange={handleOtpChange} />
          <AuthButton type="submit" className="mt-6" loading={isLoading} loadingText="Verifying…" disabled={otp.length !== 6}>
            Verify & sign in
          </AuthButton>
        </form>
        <div className="flex justify-between items-center mt-5 text-sm">
          <button type="button" onClick={backToPassword} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800">
            <ArrowLeft size={15} /> Use a different account
          </button>
          <button type="button" onClick={handleResend} disabled={cooldown > 0}
            className={`font-semibold ${cooldown > 0 ? 'text-gray-400 cursor-default' : 'text-emerald-700 hover:text-emerald-800'}`}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage billing, stock and branches."
    >
      <form key={shakeKey} onSubmit={handleSubmit} noValidate className={`space-y-5 ${shakeKey ? 'auth-shake' : ''}`}>
        <AuthField
          id="login-email"
          label="Email address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@ifrutico.com"
          autoFocus
          autoComplete="email"
        />
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="text-sm font-semibold text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">Forgot password?</Link>
          </div>
          <AuthField
            id="login-password"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            trailing={
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-2 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>
        <AuthButton id="login-submit-btn" type="submit" loading={isLoading} loadingText="Signing in…">Sign in</AuthButton>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
