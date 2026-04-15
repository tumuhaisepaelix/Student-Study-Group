import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, BookOpen, Plus, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, profile } = useAuth();

  const { data: myGroups = [] } = useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);
      if (!memberships?.length) return [];
      const groupIds = memberships.map((m) => m.group_id);
      const { data } = await supabase
        .from('study_groups')
        .select('*')
        .in('id', groupIds);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ['upcoming-sessions', user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user!.id);
      if (!memberships?.length) return [];
      const groupIds = memberships.map((m) => m.group_id);
      const { data } = await supabase
        .from('study_sessions')
        .select('*, study_groups(name)')
        .in('group_id', groupIds)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: recentGroups = [] } = useQuery({
    queryKey: ['recent-groups'],
    queryFn: async () => {
      const { data } = await supabase
        .from('study_groups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: totalGroups = 0 } = useQuery({
    queryKey: ['total-groups-count'],
    queryFn: async () => {
      const { count } = await supabase.from('study_groups').select('*', { count: 'exact', head: true });
      return count || 0;
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!</h1>
            <p className="text-muted-foreground mt-1">{profile?.program || 'Student'} · Year {profile?.year_of_study || 1}</p>
          </div>
          <Link to="/create-group"><Button><Plus className="h-4 w-4 mr-2" />Create Study Group</Button></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-primary/5 hover-lift">
            <CardContent className="flex items-center gap-5 p-8">
              <div className="rounded-2xl bg-primary/10 p-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{myGroups.length}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">My Groups</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-xl shadow-accent/5 hover-lift">
            <CardContent className="flex items-center gap-5 p-8">
              <div className="rounded-2xl bg-accent/10 p-4">
                <Calendar className="h-8 w-8 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{upcomingSessions.length}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-none shadow-xl shadow-primary/5 hover-lift">
            <CardContent className="flex items-center gap-5 p-8">
              <div className="rounded-2xl bg-primary/10 p-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-extrabold">{totalGroups}</p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Hub</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 pb-6">
              <div>
                <CardTitle className="text-xl font-bold">My Study Groups</CardTitle>
                <CardDescription>Active collaborations</CardDescription>
              </div>
              <Link to="/groups"><Button variant="ghost" size="sm" className="hover:bg-primary/5">View All <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {myGroups.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">You haven't joined any groups yet.</p>}
              {myGroups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} className="block group">
                  <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/10">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-base group-hover:text-primary transition-colors">{group.name}</p>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{group.course_code}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/20 pb-6">
              <div>
                <CardTitle className="text-xl font-bold">Upcoming Sessions</CardTitle>
                <CardDescription>Academic schedule</CardDescription>
              </div>
              <Link to="/sessions"><Button variant="ghost" size="sm" className="hover:bg-accent/5">View All <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {upcomingSessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No upcoming sessions.</p>}
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-5 rounded-2xl border border-border/50 hover:border-accent/30 transition-colors space-y-3 bg-white hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-base">{session.description}</p>
                    <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold uppercase text-[10px] tracking-widest px-3">
                      {(session.study_groups as { name: string })?.name}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full"><Clock className="h-3 w-3 text-primary" />{session.session_date} · {session.session_time}</span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full"><MapPin className="h-3 w-3 text-accent" />{session.location}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[2rem] border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
            <CardTitle className="text-xl font-bold">Recommended for You</CardTitle>
            <CardDescription>New groups you might want to join</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {recentGroups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} className="group">
                  <div className="p-6 rounded-2xl border border-border/50 hover:border-primary/20 hover:shadow-xl transition-all duration-300 space-y-4 bg-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                    <div className="relative">
                      <p className="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">{group.name}</p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-1">{group.course_name}</p>
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold text-[10px] tracking-widest">{group.faculty}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
              {recentGroups.length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No groups created yet. Be the first!</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
