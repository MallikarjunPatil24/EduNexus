import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import dayjs from 'dayjs';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotificationStore();
  const dropdownRef = useRef(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAllRead();
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'alert': return 'text-red-500 bg-red-100';
      case 'attendance': return 'text-amber-500 bg-amber-100';
      case 'grade': return 'text-emerald-500 bg-emerald-100';
      case 'fee': return 'text-purple-500 bg-purple-100';
      default: return 'text-blue-500 bg-blue-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-full hover:bg-cream-dark/50 text-navy transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gold text-cream text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce shadow">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gold/20 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-4 bg-navy text-cream flex items-center justify-between border-b border-gold/15">
            <h5 className="font-bold font-serif text-sm">Notifications</h5>
            <span className="text-[10px] uppercase font-bold text-gold tracking-wider">
              {notifications.length} total
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gold/5 text-navy">
            {notifications.length > 0 ? (
              notifications.map((notif, idx) => (
                <div key={idx} className="p-4 hover:bg-cream/30 transition-colors flex items-start space-x-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.isRead ? 'bg-navy/10' : 'bg-gold'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{notif.title}</p>
                    <p className="text-xs text-navy/70 mt-0.5 break-words">{notif.content}</p>
                    <span className="text-[9px] text-navy/40 mt-1 block">
                      {dayjs(notif.createdAt).format('hh:mm A, MMM DD')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-navy/40">
                No notifications to display.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
