import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Calendar, Search, ArrowRight, GraduationCap, Shield } from 'lucide-react';

const Index = () => {
  const features = [
    { icon: Users, title: 'Create & Join Groups', description: 'Form study groups for your courses and invite classmates to collaborate.' },
    { icon: Search, title: 'Discover Groups', description: 'Browse and search study groups by course, faculty, or group name.' },
    { icon: Calendar, title: 'Schedule Sessions', description: 'Organize study meetings with date, time, location, and agenda.' },
    { icon: BookOpen, title: 'Group Communication', description: 'Share announcements, ask questions, and coordinate within your group.' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-primary relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        
        <div className="container relative py-20 md:py-32">
          <nav className="absolute top-0 left-0 right-0 container flex items-center justify-between py-8">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md group-hover:bg-white/20 transition-colors">
                <img 
                  src="/public/favicon.ico" 
                  alt="UCU Logo" 
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">StudyGroup<span className="text-accent">Finder</span></span>
            </div>
            <div className="flex gap-4">
              <Link to="/login"><Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/10 px-6">Sign In</Button></Link>
              <Link to="/register"><Button className="bg-white text-primary hover:bg-white/90 px-8 shadow-xl shadow-black/10">Get Started</Button></Link>
            </div>
          </nav>

          <div className="max-w-3xl pt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-in">
              <GraduationCap className="h-4 w-4 text-accent" />
              <span className="text-white/90 text-xs font-semibold uppercase tracking-widest">Uganda Christian University</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-8">
              Collaborate. <br />
              <span className="text-accent">Innovate.</span> <br />
              Succeed.
            </h1>
            <p className="text-xl text-white/80 max-w-xl leading-relaxed mb-10">
              The premier platform for UCU students to connect, form elite study groups, and master their courses together.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/95 px-8 py-7 text-lg shadow-2xl shadow-black/20">
                  Join a Group <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 px-8 py-7 text-lg backdrop-blur-sm">
                  Explore Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-32">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Built for Modern Learning</h2>
          <p className="text-muted-foreground text-lg">A sophisticated environment designed to streamline academic collaboration across all faculties.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-10 rounded-[2rem] hover-lift group border-none">
              <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                <f.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-32">
        <div className="gradient-primary rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <Shield className="h-16 w-16 mx-auto text-accent mb-8 relative" />
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative">Step Up Your Academic Game</h2>
          <p className="text-white/80 text-lg mb-12 max-w-2xl mx-auto relative">Join the community of Uganda Christian University students who are redefining how we study and succeed.</p>
          <Link to="/register" className="relative">
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90 px-12 py-8 text-xl rounded-2xl shadow-xl shadow-black/20">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/5 rounded-xl">
                <img 
                  src="https://ucu.ac.ug/wp-content/uploads/2020/03/UCU-official-logo-Transparent-1-01.png" 
                  alt="UCU Logo" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">StudyGroup<span className="text-primary">Finder</span></span>
            </div>
            <p className="text-muted-foreground font-medium">© 2026 Uganda Christian University. CSC1202 Project.</p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
      </footer>

    </div>
  );
};

export default Index;
