import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebarStore } from '../store/sidebarStore';
import { Home, Folder, Table, CreditCard, User, LogIn, UserPlus, KeyRound } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: <Home size={20} />, path: '/' },
  { label: 'Projects', icon: <Folder size={20} />, path: '/projects' },
  { label: 'Generate Keywords', icon: <KeyRound size={20} />, path: '/generate-keywords' },
  { label: 'Long Tail Keywords', icon: <KeyRound size={20} />, path: '/long-tail-keywords' },
  { label: 'Tables', icon: <Table size={20} />, path: '/' },
  { label: 'Billing', icon: <CreditCard size={20} />, path: '/' },
  { label: 'Profile', icon: <User size={20} />, path: '/' },
  { label: 'Sign In', icon: <LogIn size={20} />, path: '/login' },
  { label: 'Sign Up', icon: <UserPlus size={20} />, path: '/signup' },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const closeSidebar = useSidebarStore((state) => state.close);
  const overlayRef = useRef<HTMLDivElement>(null);

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
            className="fixed left-0 top-0 h-screen z-50 w-[300px] bg-dark-blue/95 border-r border-white/10 p-6 gap-4 flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar"
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
      <aside className="hidden md:flex flex-col w-[300px] h-screen bg-dark-blue/80 border-r border-white/10 p-6 gap-4 overflow-y-auto custom-scrollbar">
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