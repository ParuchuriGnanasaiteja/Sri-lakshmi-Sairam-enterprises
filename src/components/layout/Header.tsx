import React, { useState } from 'react';
import { Search, Bell, ShieldCheck, UserCheck, Store, LogOut, ChevronDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenNotifications }) => {
  const { user, role, currentDealer, login, logout, switchDealer } = useAuth();
  const { settings, dealers, notifications, resetToSeedData } = useData();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-blue-900/30 shrink-0">
              SLS
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight">
                {settings.business_name}
              </h1>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {settings.location}, {settings.state}
              </p>
            </div>
          </div>

          {/* Right Action Icons & Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200/60 transition-colors"
              title="Search (Press Ctrl+K)"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="hidden md:inline">Search everything...</span>
              <kbd className="hidden md:inline text-[10px] bg-white text-slate-400 px-1.5 py-0.5 rounded shadow-2xs font-mono">⌘K</kbd>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Role / User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                    : role === 'staff'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                }`}
              >
                {role === 'admin' && <ShieldCheck className="w-4 h-4 text-blue-700" />}
                {role === 'staff' && <UserCheck className="w-4 h-4 text-indigo-700" />}
                {role === 'dealer' && <Store className="w-4 h-4 text-emerald-700" />}
                
                <span className="hidden sm:inline max-w-[130px] truncate">
                  {role === 'dealer' ? currentDealer?.shop_name : role.toUpperCase()}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Role Switcher Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Role</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.mobile}</p>
                  </div>

                  {/* Switch Role Options */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        login('admin', '9848012345');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                        role === 'admin' ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        Admin / Distributor
                      </span>
                      {role === 'admin' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>

                    <button
                      onClick={() => {
                        login('staff', '9848012346');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-colors ${
                        role === 'staff' ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-600" />
                        Billing Staff
                      </span>
                      {role === 'staff' && <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded">Active</span>}
                    </button>
                  </div>

                  {/* Switch Dealer Quick List */}
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <p className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Switch Dealer Portal</p>
                    <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
                      {dealers.slice(0, 10).map(d => (
                        <button
                          key={d.id}
                          onClick={() => {
                            login('dealer', d.mobile, d.id);
                            switchDealer(d.id);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${
                            role === 'dealer' && currentDealer?.id === d.id
                              ? 'bg-emerald-50 text-emerald-900 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="truncate">{d.shop_name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">{d.area}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Seed Data */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between px-2">
                    <button
                      onClick={() => {
                        if (window.confirm('Reset all demo data back to initial state?')) {
                          resetToSeedData();
                          setShowRoleMenu(false);
                        }
                      }}
                      className="text-[11px] text-slate-500 hover:text-blue-700 flex items-center gap-1 py-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reset Demo Data
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 py-1 font-medium"
                    >
                      <LogOut className="w-3 h-3" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
