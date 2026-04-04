import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Subtle gradient accent - minimal design */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0c] to-black pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-10">
          <img 
            src="/logo.svg" 
            alt="AgentForge Logo" 
            className="w-16 h-16 mb-4"
          />
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">
              AgentForge
            </div>
            <div className="text-sm text-gray-400 tracking-widest uppercase">Welcome Back</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gradient-to-br from-[#1c1c21] to-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-200">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-white text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/5 text-gray-500">New to AgentForge?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            to="/signup"
            className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all border border-white/10 text-center"
          >
            Create Account
          </Link>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-400 space-y-2">
          <p>Demo credentials: <span className="text-indigo-300 font-mono">demo@agentforge.ai</span></p>
          <p>Learning more? Check our <Link to="/docs" className="text-indigo-400 hover:text-indigo-300 underline">documentation</Link></p>
        </div>
      </div>
    </div>
  );
}
