import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';

import { AdminLayout } from './components/layout/AdminLayout';
import { DealerLayout } from './components/layout/DealerLayout';

// Admin Views
import { DashboardMetrics } from './components/admin/dashboard/DashboardMetrics';
import { DealerList } from './components/admin/dealers/DealerList';
import { Dealer360View } from './components/admin/dealer360/Dealer360View';
import { DigitalKhataView } from './components/admin/ledger/DigitalKhataView';
import { MoneyManagementView } from './components/admin/money/MoneyManagementView';
import { StockManagementView } from './components/admin/stock/StockManagementView';
import { RechargeManagementView } from './components/admin/recharges/RechargeManagementView';
import { ServiceTicketManagementView } from './components/admin/services/ServiceTicketManagementView';
import { ReportsView } from './components/admin/reports/ReportsView';
import { AdminSettingsView } from './components/admin/settings/AdminSettingsView';

// Dealer Views & Modals
import { DealerDashboard } from './components/dealer/dashboard/DealerDashboard';
import { DealerLedgerView } from './components/dealer/ledger/DealerLedgerView';
import { DealerStockView } from './components/dealer/stock/DealerStockView';
import { DealerServicesView } from './components/dealer/services/DealerServicesView';
import { DealerProfileView } from './components/dealer/profile/DealerProfileView';
import { DealerRechargeModal } from './components/dealer/requests/DealerRechargeModal';
import { DealerPaymentModal } from './components/dealer/requests/DealerPaymentModal';
import { DealerStockRequestModal } from './components/dealer/requests/DealerStockRequestModal';
import { DealerTicketModal } from './components/dealer/requests/DealerTicketModal';

const MainApp: React.FC = () => {
  const { role } = useAuth();

  // Navigation & Selection state
  const [adminTab, setAdminTab] = useState('dashboard');
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);

  const [dealerTab, setDealerTab] = useState('dashboard');

  // Dealer Action Modals
  const [isDealerRechargeOpen, setIsDealerRechargeOpen] = useState(false);
  const [isDealerPaymentOpen, setIsDealerPaymentOpen] = useState(false);
  const [isDealerStockOpen, setIsDealerStockOpen] = useState(false);
  const [isDealerTicketOpen, setIsDealerTicketOpen] = useState(false);

  // ADMIN / STAFF PORTAL
  if (role === 'admin' || role === 'staff') {
    return (
      <AdminLayout
        activeTab={adminTab}
        setActiveTab={tab => {
          setAdminTab(tab);
          if (tab !== 'dealers') setSelectedDealerId(null);
        }}
        selectedDealerId={selectedDealerId}
        setSelectedDealerId={setSelectedDealerId}
      >
        {selectedDealerId ? (
          <Dealer360View
            dealerId={selectedDealerId}
            onBack={() => setSelectedDealerId(null)}
          />
        ) : (
          <>
            {adminTab === 'dashboard' && (
              <DashboardMetrics
                onNavigateTab={tab => {
                  setAdminTab(tab);
                  setSelectedDealerId(null);
                }}
                onSelectDealer={dealerId => setSelectedDealerId(dealerId)}
              />
            )}
            {adminTab === 'dealers' && (
              <DealerList onSelectDealer={dealerId => setSelectedDealerId(dealerId)} />
            )}
            {adminTab === 'ledger' && (
              <DigitalKhataView onSelectDealer={dealerId => setSelectedDealerId(dealerId)} />
            )}
            {adminTab === 'money' && (
              <MoneyManagementView onSelectDealer={dealerId => setSelectedDealerId(dealerId)} />
            )}
            {adminTab === 'stock' && (
              <StockManagementView onSelectDealer={dealerId => setSelectedDealerId(dealerId)} />
            )}
            {adminTab === 'recharges' && (
              <RechargeManagementView onSelectDealer={dealerId => setSelectedDealerId(dealerId)} />
            )}
            {adminTab === 'services' && (
              <ServiceTicketManagementView onSelectDealer={dealerId => setSelectedDealerId(dealerId)} />
            )}
            {adminTab === 'reports' && <ReportsView />}
            {adminTab === 'settings' && <AdminSettingsView />}
          </>
        )}
      </AdminLayout>
    );
  }

  // DEALER PORTAL
  return (
    <DealerLayout
      activeTab={dealerTab}
      setActiveTab={setDealerTab}
      onOpenRechargeModal={() => setIsDealerRechargeOpen(true)}
      onOpenPaymentModal={() => setIsDealerPaymentOpen(true)}
    >
      {dealerTab === 'dashboard' && (
        <DealerDashboard
          onOpenRechargeModal={() => setIsDealerRechargeOpen(true)}
          onOpenPaymentModal={() => setIsDealerPaymentOpen(true)}
          onOpenStockModal={() => setIsDealerStockOpen(true)}
          onOpenTicketModal={() => setIsDealerTicketOpen(true)}
          onNavigateTab={setDealerTab}
        />
      )}
      {dealerTab === 'ledger' && <DealerLedgerView />}
      {dealerTab === 'stock' && <DealerStockView onOpenStockModal={() => setIsDealerStockOpen(true)} />}
      {dealerTab === 'recharges' && (
        <div className="space-y-4">
          <DealerDashboard
            onOpenRechargeModal={() => setIsDealerRechargeOpen(true)}
            onOpenPaymentModal={() => setIsDealerPaymentOpen(true)}
            onOpenStockModal={() => setIsDealerStockOpen(true)}
            onOpenTicketModal={() => setIsDealerTicketOpen(true)}
            onNavigateTab={setDealerTab}
          />
        </div>
      )}
      {dealerTab === 'services' && <DealerServicesView onOpenTicketModal={() => setIsDealerTicketOpen(true)} />}
      {dealerTab === 'profile' && <DealerProfileView />}

      {/* Action Modals */}
      <DealerRechargeModal
        isOpen={isDealerRechargeOpen}
        onClose={() => setIsDealerRechargeOpen(false)}
      />
      <DealerPaymentModal
        isOpen={isDealerPaymentOpen}
        onClose={() => setIsDealerPaymentOpen(false)}
      />
      <DealerStockRequestModal
        isOpen={isDealerStockOpen}
        onClose={() => setIsDealerStockOpen(false)}
      />
      <DealerTicketModal
        isOpen={isDealerTicketOpen}
        onClose={() => setIsDealerTicketOpen(false)}
      />
    </DealerLayout>
  );
};

export function App() {
  return (
    <NotificationProvider>
      <DataProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </DataProvider>
    </NotificationProvider>
  );
}

export default App;
