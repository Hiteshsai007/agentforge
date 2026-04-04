import { useState } from 'react';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface PremiumFooterProps {
  sections?: FooterSection[];
  companyName?: string;
  socialLinks?: { icon: string; href: string; label: string }[];
}

export default function PremiumFooter({
  sections,
  companyName = 'AgentForge',
  socialLinks,
}: PremiumFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  const defaultSections: FooterSection[] = [
    {
      title: 'Product',
      links: [
        { label: 'Marketplace', href: '#' },
        { label: 'Pricing', href: '#' },
        { label: 'Documentation', href: '#' },
        { label: 'API', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy', href: '#' },
        { label: 'Terms', href: '#' },
        { label: 'Security', href: '#' },
        { label: 'Compliance', href: '#' },
      ],
    },
  ];

  const footerSections = sections || defaultSections;

  return (
    <footer className="relative border-t border-white/10 bg-black">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 py-16">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.svg" 
                alt="AgentForge Logo" 
                className="w-10 h-10"
              />
              <h3 className="text-lg font-bold text-white">{companyName}</h3>
            </div>

            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              The intelligent AI agent marketplace. Connect, deploy, and scale autonomous AI workflows.
            </p>

            {/* Newsletter Signup */}
            <form onSubmit={handleSubscribe} className="space-y-3 pt-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Subscribe for updates
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="You@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 rounded text-sm placeholder-gray-500 focus:border-white/30 outline-none transition"
                />
                <button
                  type="submit"
                  className="bg-white text-black px-4 py-2 rounded font-semibold text-sm hover:bg-gray-100 transition"
                >
                  {subscribed ? '✓' : 'Join'}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-widest">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>

          {/* Social Links */}
          {socialLinks && socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  title={social.label}
                  className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-white hover:border-white/50 hover:bg-white/10 transition-colors"
                >
                  <span className="text-xs font-bold">{social.icon}</span>
                </a>
              ))}
            </div>
          )}

          {/* Right Side Text */}
          <p className="text-xs text-gray-500">
            Made with intention
          </p>
        </div>
      </div>
    </footer>
  );
}
