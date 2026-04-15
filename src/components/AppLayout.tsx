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
      <header className="sticky top-0 z-50 gradient-primary border-b border-primary/20">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <img 
              src="https://ucu.ac.ug/wp-content/uploads/2020/03/UCU-official-logo-Transparent-1-01.png" 
              alt="UCU Logo" 
              className="h-10 w-auto object-contain"
            />
            <span className="text-xl font-bold text-primary-foreground hidden sm:inline tracking-tight">StudyGroup Finder</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button variant="ghost" size="sm" className={`text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ${isActive(item.to) ? 'bg-primary-foreground/15 text-primary-foreground' : ''}`}>
                  <item.icon className="h-4 w-4 mr-1.5" />{item.label}
                </Button>
              </Link>
            ))}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ml-2">
              <LogOut className="h-4 w-4 mr-1.5" />Logout
            </Button>
          </nav>
          <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-primary-foreground/10 pb-4">
            <nav className="container flex flex-col gap-1 pt-2">
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ${isActive(item.to) ? 'bg-primary-foreground/15 text-primary-foreground' : ''}`}>
                    <item.icon className="h-4 w-4 mr-2" />{item.label}
                  </Button>
                </Link>
              ))}
              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="h-4 w-4 mr-2" />Logout
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
