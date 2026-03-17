import { useState, useRef, useEffect } from 'react';
import { requestOTP, verifyOTP } from '../../api/client';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  companyId: string;
  agentId: string;
  agentName: string;
  onSuccess: () => void;
}

export default function OTPCredentialModal({
  isOpen,
  onClose,
  email,
  companyId,
  agentId,
  agentName,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<'sending' | 'verifying' | 'success' | 'error'>('sending');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && step === 'sending') {
      handleRequestOTP();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'verifying' && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleRequestOTP = async () => {
    try {
      const res = await requestOTP(email, companyId, agentId);
      if (res.success) {
        setStep('verifying');
        setResendCooldown(60);
        toast.success('OTP sent to your email');
      } else {
        setStep('error');
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setStep('error');
      setError(error?.response?.data?.detail || 'Failed to send OTP');
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    await handleRequestOTP();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    try {
      const res = await verifyOTP(email, otpCode, companyId, agentId);
      if (res.success) {
        setStep('success');
        toast.success('Credentials sent to your email!');
        onSuccess();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(res.message || 'Invalid OTP');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const detail = error?.response?.data?.detail || 'Invalid or expired OTP';
      setError(detail);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== '')) {
      handleVerify();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;

    const newOtp = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    setError('');

    if (pasted.length === 6) {
      handleVerify();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[99999]">
      <div className="bg-[#1a1a2e] border-2 border-blue-500 rounded-xl p-6 w-full max-w-md">
        {step === 'sending' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-3xl">📧</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sending OTP</h3>
            <p className="text-gray-400 text-sm">
              Sending verification code to<br />
              <span className="text-blue-400">{email}</span>
            </p>
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        )}

        {step === 'verifying' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Enter OTP</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Sent to <span className="text-blue-400">{email}</span>
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-mono font-bold bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                ))}
              </div>

              {error && (
                <p className="text-center text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg py-2">
                  {error}
                </p>
              )}

              <button
                onClick={handleVerify}
                disabled={otp.join('').length !== 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Verify & Generate Credentials
              </button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-gray-500 text-sm">
                    Resend OTP in <span className="text-amber-400">{resendCooldown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
            <p className="text-gray-400 text-sm">
              Credentials sent to<br />
              <span className="text-green-400">{email}</span>
            </p>
            <p className="text-gray-500 text-xs mt-4">
              Check your inbox for API keys
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Error</h3>
            <p className="text-gray-400 text-sm mb-6">{error}</p>
            <button onClick={onClose} className="px-6 py-2 bg-white/10 text-white rounded-lg">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
