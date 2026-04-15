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
      <section className="gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(244_80%_25%/0.3),transparent_50%)]" />
        <div className="container relative py-20 md:py-32">
          <nav className="absolute top-0 left-0 right-0 container flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <img 
                src="https://ucu.ac.ug/wp-content/uploads/2020/03/UCU-official-logo-Transparent-1-01.png" 
                alt="UCU Logo" 
                className="h-10 w-auto object-contain"
              />
              <span className="text-xl font-bold text-primary-foreground tracking-tight">StudyGroup Finder</span>
            </div>
            <div className="flex gap-2">
              <Link to="/login"><Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">Sign In</Button></Link>
              <Link to="/register"><Button className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 border border-primary-foreground/20">Get Started</Button></Link>
            </div>
          </nav>

          <div className="max-w-2xl pt-12">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="https://ucu.ac.ug/wp-content/uploads/2020/03/UCU-official-logo-Transparent-1-01.png" 
                alt="UCU Crest" 
                className="h-12 w-auto object-contain brightness-0 invert opacity-80"
              />
              <span className="text-primary-foreground/70 text-sm font-medium">Uganda Christian University</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight">
              Find Your Perfect Study Group
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 max-w-lg">
              Connect with fellow students, form study groups for your courses, schedule sessions, and excel together academically.
            </p>
            <div className="mt-8 flex gap-3">
              <Link to="/register">
                <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  Get Started <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/10">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Everything You Need to Study Together</h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">A simple platform to discover, organize, and manage study groups across campus.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-border/50 hover:shadow-lg transition-shadow text-center">
              <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 py-16">
        <div className="container text-center">
          <Shield className="h-10 w-10 mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-bold mb-3">Ready to boost your academic performance?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Join hundreds of UCU students already using Study Group Finder to collaborate and succeed.</p>
          <Link to="/register">
            <Button size="lg"><GraduationCap className="h-4 w-4 mr-2" />Create Free Account</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <img 
              src="https://ucu.ac.ug/wp-content/uploads/2020/03/UCU-official-logo-Transparent-1-01.png" 
              alt="UCU Logo" 
              className="h-8 w-auto object-contain"
            />
            <span className="font-bold text-foreground tracking-tight">Student Study Group Finder</span>
          </div>
          <p>© 2026 Uganda Christian University. CSC1202 Project.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
