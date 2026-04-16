import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex lg:w-3/5 items-center justify-center p-20 relative overflow-hidden">
        <img
          src="/hero-bg.png"
          alt="Students studying"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#001529]/95 via-[#001529]/60 to-[#001529]/95" />
        <div className="absolute top-20 left-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <img
                src="/favicon.ico"
                alt="UCU Logo"
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">StudentGroup<span className="text-accent">Finder</span></span>
          </div>
        </div>
        <div className="max-w-xl relative">
          <h1 className="text-7xl font-extrabold text-white leading-tight mb-8 tracking-tighter">
            Unlock Your <br />
            <span className="text-accent">Academic</span> <br />
            Potential.
          </h1>
          <p className="text-white/80 text-2xl leading-relaxed font-medium">
            Join the most elite student collaboration platform at Uganda Christian University.
          </p>
          <div className="mt-12 flex gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-white font-bold text-2xl">500+</p>
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Active Groups</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <p className="text-white font-bold text-2xl">2k+</p>
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider">Students</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full lg:w-2/5 items-center justify-center p-8 bg-white md:bg-transparent">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-8">
              <img
                src="/favicon.ico"
                alt="UCU Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight">Welcome Back</h2>
            <p className="text-muted-foreground mt-2 text-lg">Continue your journey to academic excellence.</p>
          </div>

          <Card className="border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] bg-white p-2">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest ml-1 text-muted-foreground">Student Email</Label>
                  <Input id="email" type="email" placeholder="student@ucu.ac.ug" className="rounded-2xl h-14 border-muted bg-muted/30 focus:bg-white transition-all text-lg" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="rounded-2xl h-14 border-muted bg-muted/30 focus:bg-white transition-all text-lg pr-12" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In to Hub'}
                </Button>
              </form>
              <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
                New to the Hub?{' '}
                <Link to="/register" className="text-primary font-bold hover:text-primary/80 transition-colors">Create Free Account</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

  );
};

export default Login;
