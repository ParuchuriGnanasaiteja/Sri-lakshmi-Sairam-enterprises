import React from 'react';
import { X, Check, Bell, AlertCircle, CreditCard, RefreshCw, Box, Wrench } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDateTime } from '../../utils/formatters';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (link: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData();

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'recharge':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'stock':
        return <Box className="w-4 h-4 text-indigo-600" />;
      case 'ticket':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-700" />
            <h3 className="font-bold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications right now.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.link && onNavigate) {
                    onNavigate(n.link);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  n.is_read
                    ? 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                    : 'bg-blue-50/50 border-blue-100 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5 border border-slate-100">
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold truncate ${!n.is_read ? 'text-blue-950' : 'text-slate-800'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 ml-2" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{formatDateTime(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
