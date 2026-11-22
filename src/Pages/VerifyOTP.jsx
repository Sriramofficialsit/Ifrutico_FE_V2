import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { apiFetch } from '../utils/api';
import toast from 'react-hot-toast';
import AuthShell, { AuthButton, OtpBoxes, ResetSteps } from '../Components/AuthShell';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  const verify = async (code) => {
    if (isLoading) return;
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    try {
      const data = await apiFetch('/verify-forgot-otp', { method: 'POST', body: { email, otp: code } });
      if (!data.success) {
        toast.error(data.message || 'Invalid OTP');
        setOtp('');
      } else {
        toast.success('OTP verified successfully!');
        navigate('/reset-password', { state: { email, otp: code } });
      }
    } catch (err) {
      toast.error(err.message || 'Network error');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
    if (digits.length === 6) verify(digits); // auto-submit when complete (also on paste)
  };

  return (
    <AuthShell
      icon={MailCheck}
      title="Check your email"
      subtitle={<>Enter the 6-digit code we sent to <b className="text-gray-900 break-all">{email}</b>.</>}
      back={{ to: '/forgot-password', label: 'Use a different email' }}
      footer={<ResetSteps current={2} />}
    >
      <form onSubmit={(e) => { e.preventDefault(); verify(otp); }} noValidate>
        <label htmlFor="reset-otp" className="block text-sm font-semibold text-gray-700 mb-1.5">Verification code</label>
        <OtpBoxes id="reset-otp" value={otp} onChange={handleChange} />
        <p className="mt-2 text-xs text-gray-500">Didn't get it? Check spam, or go back and request a new code.</p>
        <AuthButton type="submit" className="mt-6" loading={isLoading} loadingText="Verifying…" disabled={otp.length !== 6}>
          Verify code
        </AuthButton>
      </form>
    </AuthShell>
  );
}
