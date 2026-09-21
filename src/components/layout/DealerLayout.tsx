import React, { useState } from 'react';
import { 
  Home, 
  BookOpen, 
  Boxes, 
  RefreshCw, 
  Wrench, 
  User, 
  Plus, 
  CreditCard 
} from 'lucide-react';
import { Header } from './Header';
import { GlobalSearchModal } from '../navigation/GlobalSearchModal';
import { NotificationCenter } from '../navigation/NotificationCenter';

interface DealerLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRechargeModal: () => void;
  onOpenPaymentModal: () => void;
  children: React.ReactNode;
}

export const DealerLayout: React.FC<DealerLayoutProps> = ({
  activeTab,
  setActiveTab,
  onOpenRechargeModal,
  onOpenPaymentModal,
  children
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const dealerNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'ledger', label: 'My Khata', icon: BookOpen },
    { id: 'stock', label: 'My Stock', icon: Boxes },
    { id: 'recharges', label: 'Recharges', icon: RefreshCw },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-1 sticky top-20">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Dealer Portal
            </div>
            {dealerNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}

            {/* Quick Actions in Sidebar */}
            <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={onOpenRechargeModal}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <Plus className="w-4 h-4" /> New Recharge
              </button>
              <button
                onClick={onOpenPaymentModal}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                <CreditCard className="w-4 h-4" /> Add Payment
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {dealerNavItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Search & Notifications */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
      />
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={setActiveTab}
      />
    </div>
  );
};
