import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  IndianRupee, 
  Boxes, 
  RefreshCw, 
  Wrench, 
  FileSpreadsheet, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Header } from './Header';
import { GlobalSearchModal } from '../navigation/GlobalSearchModal';
import { NotificationCenter } from '../navigation/NotificationCenter';

interface AdminLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedDealerId?: string | null;
  setSelectedDealerId: (id: string | null) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  selectedDealerId: _selectedDealerId,
  setSelectedDealerId,
  children
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'dealers', label: 'Dealers (40)', icon: Users },
    { id: 'ledger', label: 'Digital Khata', icon: BookOpen },
    { id: 'money', label: 'Money / Payments', icon: IndianRupee },
    { id: 'stock', label: 'Stock & Inventory', icon: Boxes },
    { id: 'recharges', label: 'Recharges', icon: RefreshCw },
    { id: 'services', label: 'Service Tickets', icon: Wrench },
    { id: 'reports', label: 'Reports & EOD', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectDealerFromSearch = (dealerId: string) => {
    setSelectedDealerId(dealerId);
    setActiveTab('dealers');
  };

  const handleNavigateFromSearch = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 gap-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-1 sticky top-20">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Distributor Management
            </div>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'dealers') setSelectedDealerId(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-900 text-white shadow-sm shadow-blue-900/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'dealers') setSelectedDealerId(null);
                }}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
                  isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] leading-tight">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}

          {/* More menu trigger for remaining tabs */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
              ['stock', 'recharges', 'services', 'reports', 'settings'].includes(activeTab)
                ? 'text-blue-700 font-bold'
                : 'text-slate-500'
            }`}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 mb-0.5" /> : <Menu className="w-5 h-5 mb-0.5" />}
            <span className="text-[10px] leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Tabs Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-end">
          <div className="fixed inset-0" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl p-5 shadow-2xl z-10 space-y-2 mb-14">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">More Modules</h4>
            <div className="grid grid-cols-2 gap-2">
              {navItems.slice(4).map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSelectedDealerId(null);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold border ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search & Notification Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectDealer={handleSelectDealerFromSearch}
        onNavigate={handleNavigateFromSearch}
      />
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={handleNavigateFromSearch}
      />
    </div>
  );
};
