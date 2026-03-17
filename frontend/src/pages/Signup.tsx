import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

type SignupType = 'personal' | 'join_company' | 'create_company';

export default function Signup() {
  const { signup } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [signupType, setSignupType] = useState<SignupType>('personal');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup({
        email,
        password,
        full_name: fullName,
        signup_type: signupType,
        company_name: signupType === 'create_company' ? companyName : undefined,
        invite_code: signupType === 'join_company' ? inviteCode : undefined,
      });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string; message?: string } } };
      const message = axiosError?.response?.data?.detail || axiosError?.response?.data?.message || 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join Agent Forge</p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            <button
              onClick={() => { setSignupType('personal'); setStep(2); }}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  👤
                </div>
                <div>
                  <h3 className="text-white font-semibold">Personal Use</h3>
                  <p className="text-gray-400 text-sm">Use for personal AI tasks, no company needed</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setSignupType('join_company'); setStep(2); }}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  🏢
                </div>
                <div>
                  <h3 className="text-white font-semibold">Join Company</h3>
                  <p className="text-gray-400 text-sm">Join an existing company with invite code</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setSignupType('create_company'); setStep(2); }}
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:bg-white/10 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <div>
                  <h3 className="text-white font-semibold">Create Company</h3>
                  <p className="text-gray-400 text-sm">Start a new company and invite members</p>
                </div>
              </div>
            </button>

            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-gray-400 hover:text-white text-sm mb-2"
            >
              ← Back to options
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {signupType === 'create_company' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="My Company"
                  required
                />
              </div>
            )}

            {signupType === 'join_company' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Invite Code</label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="ABC12345"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
