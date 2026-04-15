import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Home, Search, Plus, Calendar, Shield, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: Home },
    { to: '/groups', label: 'Browse Groups', icon: Search },
    { to: '/create-group', label: 'Create Group', icon: Plus },
    { to: '/sessions', label: 'Sessions', icon: Calendar },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 gradient-primary border-b border-white/10 shadow-lg backdrop-blur-md">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-4 group transition-transform hover:scale-[1.02]">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <img 
                src="https://ucu.ac.ug/wp-content/uploads/2020/03/UCU-official-logo-Transparent-1-01.png" 
                alt="UCU Logo" 
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </div>
            <span className="text-2xl font-extrabold text-white hidden sm:inline tracking-tight">StudyGroup<span className="text-accent">Hub</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button variant="ghost" size="sm" className={`text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 h-10 font-semibold transition-all ${isActive(item.to) ? 'bg-white/15 text-white ring-1 ring-white/20' : ''}`}>
                  <item.icon className="h-4 w-4 mr-2" />{item.label}
                </Button>
              </Link>
            ))}
            <div className="w-px h-6 bg-white/20 mx-2" />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 h-10 font-semibold transition-all">
              <LogOut className="h-4 w-4 mr-2" />Logout
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 py-6 animate-in slide-in-from-top duration-300">
            <nav className="container flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start text-white/80 hover:text-white hover:bg-white/10 rounded-xl py-6 font-bold ${isActive(item.to) ? 'bg-white/15 text-white ring-1 ring-white/20' : ''}`}>
                    <item.icon className="h-5 w-5 mr-3" />{item.label}
                  </Button>
                </Link>
              ))}
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 rounded-xl py-6 font-bold">
                <LogOut className="h-5 w-5 mr-3" />Logout
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="container py-6 md:py-8">{children}</main>
    </div>
  );
};

export default AppLayout;
