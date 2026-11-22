import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import AuthShell, { AuthField, AuthButton, ResetSteps } from '../Components/AuthShell';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch('/forgot-password', { method: 'POST', body: { email: email.trim() } });
      if (!data.success) {
        toast.error(data.message || 'Something went wrong');
      } else {
        toast.success('OTP sent to your email!');
        navigate('/verify-otp', { state: { email: email.trim() } });
      }
    } catch (err) {
      toast.error(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      icon={KeyRound}
      title="Forgot password?"
      subtitle="No worries. Enter your account email and we'll send you a 6-digit code to reset it."
      back={{ to: '/login', label: 'Back to sign in' }}
      footer={<ResetSteps current={1} />}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          id="forgot-email"
          label="Email address"
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@ifrutico.com"
          autoFocus
          autoComplete="email"
          hint="Password reset by email is available for admin accounts. Staff: ask your admin to reset yours."
        />
        <AuthButton type="submit" loading={isLoading} loadingText="Sending code…">Send reset code</AuthButton>
      </form>
    </AuthShell>
  );
}
