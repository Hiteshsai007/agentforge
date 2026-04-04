import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavProps {
  companyName?: string;
  userEmail?: string;
  onLogout?: () => void;
}

export default function PremiumNav({ userEmail, onLogout }: NavProps) {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Work', href: '/work' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <>
      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Premium Navigation */}
      <nav
        className={`fixed top-0 w-full z-40 transition-all duration-300 ${
          isScrolled ? 'nav-blur' : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group"
          >
            <img 
              src="/logo.svg" 
              alt="AgentForge Logo" 
              className="w-10 h-10 transition-transform group-hover:scale-110"
            />
            <div className="hidden md:block">
              <h1 className="text-sm font-bold tracking-widest text-white uppercase">AgentForge</h1>
              <p className="text-xs text-gray-400 -mt-1">AI Marketplace</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase tracking-wider"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-4">
            {userEmail && (
              <div className="text-right pr-4 border-r border-white/10">
                <p className="text-xs text-gray-400 uppercase tracking-widest">User</p>
                <p className="text-sm text-white font-medium truncate max-w-48">{userEmail}</p>
              </div>
            )}

            <button
              onClick={() => onLogout?.()}
              className="px-4 py-2 rounded-lg font-semibold transition-all bg-white text-black hover:bg-gray-100 cursor-pointer"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-white/5 rounded transition-colors"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`h-0.5 w-full bg-white transition-all ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`h-0.5 w-full bg-white transition-opacity ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-0.5 w-full bg-white transition-all ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-64' : 'max-h-0'
          }`}
        >
          <div className="px-4 py-6 space-y-4 border-t border-white/10 bg-black/50 backdrop-blur">
            {navItems.map((item, idx) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.href);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-sm font-medium text-gray-300 hover:text-white transition-colors uppercase tracking-wider"
                style={{
                  animation: isMobileMenuOpen
                    ? `slideInLeft 0.3s ease-out ${idx * 0.05}s both`
                    : 'none',
                }}
              >
                {item.label}
              </button>
            ))}

            <div className="pt-4 border-t border-white/10">
              {userEmail && (
                <div className="mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">User</p>
                  <p className="text-sm text-white font-medium truncate">{userEmail}</p>
                </div>
              )}
              <button
                onClick={() => {
                  onLogout?.();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold transition-all bg-white text-black hover:bg-gray-100 cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-16" />
    </>
  );
}
