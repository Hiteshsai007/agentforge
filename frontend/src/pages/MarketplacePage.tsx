import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import PremiumLayout from '../components/PremiumLayout';
import EnhancedMarketplace from '../components/admin/EnhancedMarketplace';
import { useState } from 'react';

export default function MarketplacePage() {
  const { user, company, isAuthenticated } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!company) {
    return (
      <PremiumLayout navProps={{ onLogout: () => {}}}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-400">No company found</p>
          </div>
        </div>
      </PremiumLayout>
    );
  }

  return (
    <PremiumLayout navProps={{ onLogout: () => {}}}>
      <div className="p-8">
        <EnhancedMarketplace
          key={refreshKey}
          companyId={company.company_id}
          onAgentAdded={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    </PremiumLayout>
  );
}
