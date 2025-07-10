import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebarStore } from '../store/sidebarStore';
import { Home, Folder, Table, CreditCard, User, LogIn, UserPlus, KeyRound, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '../App';

const navItems = [
  { label: 'Dashboard', icon: <Home size={20} />, path: '/' },
  { label: 'Projects', icon: <Folder size={20} />, path: '/projects' },
  { label: 'Generate Keywords', icon: <KeyRound size={20} />, path: '/generate-keywords' },
  { label: 'Competitor Analysis', icon: <BarChart3 size={20} />, path: '/competitor-analysis' },
  { label: 'Billing', icon: <CreditCard size={20} />, path: '/billing' },
  { label: 'Profile', icon: <User size={20} />, path: '/profile' },
  // Log Out will be handled separately
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const closeSidebar = useSidebarStore((state) => state.close);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();

  // Prevent scrolling when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup function to ensure body overflow is restored
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNavigation = (path: string) => {
    navigate(path);
    closeSidebar();
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Overlay background */}
          <div
            ref={overlayRef}
            className="fixed inset-0 bg-black/40 transition-opacity duration-300"
            onClick={closeSidebar}
          />
          {/* Sidebar panel with slide-in/out animation */}
          <aside
            className="fixed left-0 top-0 h-screen z-50 w-[300px] bg-gradient-to-b from-[#0b0741] via-[#006ac6] to-dark-blue p-6 gap-4 flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar"
            style={{ boxShadow: '2px 0 24px 0 rgba(0,0,0,0.2)' }}
          >
            <div className="mb-8 flex items-center gap-2 justify-between">
              <span className="text-2xl font-bold text-white tracking-widest">SEO AGENT</span>
              <button 
                onClick={closeSidebar} 
                className="text-white text-4xl ml-auto leading-none hover:text-white/80 transition-colors"
              >
                ×
              </button>
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-accent-blue/20 hover:text-white transition-all duration-200 font-medium text-lg active:scale-95"
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="text-xl">{item.icon}</span> {item.label}
                </button>
              ))}
              <button
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200 font-medium text-lg active:scale-95"
                onClick={handleLogout}
              >
                <span className="text-xl"><LogOut size={20} /></span> Log Out
              </button>
            </nav>
            <div className="mt-auto bg-gradient-to-tr from-accent-blue via-light-purple to-accent-blue rounded-2xl p-4 shadow-xl text-white text-center">
              <div className="font-bold mb-2">Need help?</div>
              <div className="text-xs mb-2">Please check our docs</div>
              <button className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition">DOCUMENTATION</button>
            </div>
          </aside>
        </div>
      )}
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[300px] h-screen bg-gradient-to-b from-[#0b0741] via-[#006ac6] to-dark-blue p-6 gap-4 overflow-y-auto custom-scrollbar">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-2xl font-bold text-white tracking-widest">SEO AGENT</span>
        </div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-accent-blue/20 hover:text-white transition font-medium text-lg"
              onClick={() => navigate(item.path)}
            >
              <span className="text-xl">{item.icon}</span> {item.label}
            </button>
          ))}
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-red-500/20 hover:text-red-400 transition font-medium text-lg"
            onClick={handleLogout}
          >
            <span className="text-xl"><LogOut size={20} /></span> Log Out
          </button>
        </nav>
        <div className="mt-auto bg-gradient-to-tr from-accent-blue via-light-purple to-accent-blue rounded-2xl p-4 shadow-xl text-white text-center">
          <div className="font-bold mb-2">Need help?</div>
          <div className="text-xs mb-2">Please check our docs</div>
          <button className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg text-white hover:bg-white/20 transition">DOCUMENTATION</button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 