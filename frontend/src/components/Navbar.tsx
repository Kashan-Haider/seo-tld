import React from 'react';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useSidebarStore } from '../store/sidebarStore';
import { useAuth } from '../App';

const Navbar: React.FC = () => {
  const { toggle } = useSidebarStore();
  const { logout, user } = useAuth();

  return (
    <nav className="w-full bg-gradient-to-r from-[#031c5d] via-dark-blue to-[#031c5d] sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Left side - Logo and Menu Toggle */}
        <div className="flex items-center gap-4">
          {/* Menu Toggle for Mobile */}
          <button
            onClick={toggle}
            className="lg:hidden p-2 rounded-lg bg-medium-blue/50 border border-white/10 text-white hover:bg-accent-blue/20 transition-all duration-300"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-light-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wider">SEO Agent</span>
          </div>
        </div>

        {/* Right side - Icons */}
        <div className="flex items-center gap-2">
          {/* Notification Icon */}
          <button className="p-2 rounded-lg bg-medium-blue/50 border border-white/10 text-white hover:bg-accent-blue/20 transition-all duration-300 relative">
            <Bell size={20} />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
              <span className="text-[8px]">3</span>
            </span>
          </button>

          {/* Profile Dropdown */}
          <div className="relative group">
            <button className="p-2 rounded-lg bg-medium-blue/50 border border-white/10 text-white hover:bg-accent-blue/20 transition-all duration-300 flex items-center gap-2">
              <User size={20} />
              <span className="hidden sm:block text-sm font-medium">
                {user?.email ? user.email.split('@')[0] : 'User'}
              </span>
            </button>
            
            {/* Profile Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-dark-blue to-medium-blue border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-4 border-b border-white/10">
                <div className="text-white font-semibold">
                  {user?.email ? user.email.split('@')[0] : 'User'}
                </div>
                <div className="text-white/60 text-sm">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/80 hover:bg-accent-blue/20 hover:text-white transition-all duration-200"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 