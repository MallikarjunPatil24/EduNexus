import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import NotificationBell from './ui/NotificationBell';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, Calendar, DollarSign,
  ClipboardCheck, Award, FileSpreadsheet, FileText, FolderClosed,
  MessageSquare, Brain, CreditCard, LogOut, Menu, X, BookMarked
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { initSocket, disconnect } = useNotificationStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      initSocket(user);
    }
    return () => disconnect();
  }, [user, initSocket, disconnect]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define sidebar links per role
  const menuConfig = {
    admin: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Manage Users', path: '/admin/users', icon: Users },
      { label: 'Classes & Subjects', path: '/admin/classes', icon: BookOpen },
      { label: 'Timetable Setup', path: '/admin/timetable', icon: Calendar },
      { label: 'Financial Structures', path: '/admin/fees', icon: DollarSign },
    ],
    teacher: [
      { label: 'Dashboard', path: '/teacher', icon: LayoutDashboard },
      { label: 'Mark Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
      { label: 'Grading & Results', path: '/teacher/grading', icon: FileSpreadsheet },
      { label: 'Upload Assignments', path: '/teacher/assignments', icon: FileText },
      { label: 'Digital Library', path: '/teacher/library', icon: BookMarked },
      { label: 'In-app Chat', path: '/teacher/chat', icon: MessageSquare },
    ],
    student: [
      { label: 'Dashboard', path: '/student', icon: LayoutDashboard },
      { label: 'My Timetable', path: '/student/timetable', icon: Calendar },
      { label: 'Assignments', path: '/student/assignments', icon: FileText },
      { label: 'E-Library', path: '/student/library', icon: BookMarked },
      { label: 'AI Doubt Solver', path: '/student/ai', icon: Brain },
    ],
    parent: [
      { label: 'Dashboard', path: '/parent', icon: LayoutDashboard },
      { label: 'Child Attendance', path: '/parent/attendance', icon: ClipboardCheck },
      { label: 'Academic Progress', path: '/parent/progress', icon: Award },
      { label: 'Billing & Fees', path: '/parent/billing', icon: CreditCard },
      { label: 'Teacher Chat', path: '/parent/chat', icon: MessageSquare },
    ]
  };

  const menuItems = menuConfig[user?.role] || [];

  return (
    <div className="min-h-screen bg-cream flex text-navy font-sans">
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-navy text-cream flex flex-col justify-between border-r border-gold/15 transition-all duration-300 relative z-30`}
      >
        <div>
          {/* Logo Section */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-gold/10">
            {sidebarOpen ? (
              <span className="text-xl font-bold font-serif tracking-wide text-gold">EduNexus</span>
            ) : (
              <span className="text-lg font-bold font-serif text-gold mx-auto">EN</span>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded hover:bg-navy-light/40 text-cream"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-gold text-navy font-semibold shadow shadow-gold/10'
                      : 'hover:bg-navy-light/35 hover:text-cream/90 text-cream/70'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile details & Logout */}
        <div className="p-4 border-t border-gold/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gold/25 flex items-center justify-center font-bold text-gold flex-shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-cream">{user?.name}</p>
                <p className="text-[10px] uppercase font-semibold text-gold tracking-wider truncate">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-2.5 rounded-lg text-sm font-medium hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gold/10 flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center">
            <h2 className="text-base font-bold uppercase tracking-wider text-navy/70 hidden sm:block">
              {user?.role} portal
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="w-px h-6 bg-gold/20" />
            <span className="text-sm font-semibold text-navy/70">{user?.name}</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-cream/10 relative">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
