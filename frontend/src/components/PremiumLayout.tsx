import React from 'react';
import PremiumNav from './PremiumNav';
import PremiumFooter from './PremiumFooter';

interface PremiumLayoutProps {
  children: React.ReactNode;
  navProps?: {
    companyName?: string;
    userEmail?: string;
    onLogout?: () => void;
  };
  showFooter?: boolean;
  footerProps?: {
    companyName?: string;
  };
}

export default function PremiumLayout({
  children,
  navProps,
  showFooter = true,
  footerProps,
}: PremiumLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Navigation */}
      <PremiumNav
        companyName={navProps?.companyName}
        userEmail={navProps?.userEmail}
        onLogout={navProps?.onLogout}
      />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <PremiumFooter
          companyName={footerProps?.companyName}
        />
      )}
    </div>
  );
}
