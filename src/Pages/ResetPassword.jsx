import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, Circle, ShieldCheck } from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import AuthShell, { AuthField, AuthButton, ResetSteps } from '../Components/AuthShell';

// Same rules the server enforces (BE/controller/Auth.controller.js passwordPattern)
const RULES = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'A lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'A symbol (@ $ ! % * ? &)', test: (p) => /[@$!%*?&]/.test(p) },
];
const ALLOWED = /^[A-Za-z\d@$!%*?&]*$/;

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const otp = location.state?.otp;

  useEffect(() => {
    if (!email || !otp) navigate('/forgot-password');
  }, [email, otp, navigate]);

  const passed = RULES.filter((r) => r.test(password)).length;
  const badChar = !ALLOWED.test(password);
  const strong = passed === RULES.length && !badChar;
  const mismatch = confirmPassword !== '' && confirmPassword !== password;
  const meter = ['bg-gray-200', 'bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-amber-500', 'bg-emerald-600'][passed];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strong) {
      toast.error(badChar ? 'Use only letters, numbers and @ $ ! % * ? &' : 'Password does not meet all the requirements.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch('/reset-password', { method: 'POST', body: { email, otp, newPassword: password } });
      if (!data.success) {
        toast.error(data.message || 'Failed to reset password');
      } else {
        setDone(true);
        toast.success('Password reset. Redirecting to sign in…');
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    } catch (err) {
      toast.error(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell icon={CheckCircle2} title="Password updated" subtitle="You can now sign in with your new password." footer={<ResetSteps current={4} />}>
        <AuthButton type="button" onClick={() => navigate('/login', { replace: true })}>Go to sign in</AuthButton>
      </AuthShell>
    );
  }

  const eye = (shown, toggle) => (
    <button type="button" onClick={toggle} aria-label={shown ? 'Hide password' : 'Show password'}
      className="p-2 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50">
      {shown ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <AuthShell
      icon={ShieldCheck}
      title="Create a new password"
      subtitle="Choose a strong password you haven't used before."
      back={{ to: '/login', label: 'Back to sign in' }}
      footer={<ResetSteps current={3} />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <AuthField
            id="reset-password"
            label="New password"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            autoFocus
            error={badChar ? 'Use only letters, numbers and @ $ ! % * ? &' : null}
            trailing={eye(showPassword, () => setShowPassword(!showPassword))}
          />
          <div className="mt-3 flex gap-1.5" aria-hidden="true">
            {RULES.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < passed ? meter : 'bg-gray-200'}`} />)}
          </div>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5" aria-label="Password requirements">
            {RULES.map((r) => {
              const ok = r.test(password);
              return (
                <li key={r.label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <AuthField
          id="reset-confirm"
          label="Confirm password"
          icon={Lock}
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={mismatch ? 'Passwords do not match.' : null}
          trailing={eye(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
        />
        <AuthButton type="submit" loading={isLoading} loadingText="Saving…" disabled={!strong || !confirmPassword || mismatch}>
          Reset password
        </AuthButton>
      </form>
    </AuthShell>
  );
}
