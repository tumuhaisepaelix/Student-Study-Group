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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-[#fdf2f2] p-4">
                <Users className="h-6 w-6 text-[#9b1c1c]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myGroups.length}</p>
                <p className="text-sm text-muted-foreground">My Groups</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-[#fff7ed] p-4">
                <Calendar className="h-6 w-6 text-black" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-[#f0fdf4] p-4">
                <BookOpen className="h-6 w-6 text-[#15803d]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalGroups}</p>
                <p className="text-sm text-muted-foreground">Total Groups</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-lg">My Study Groups</CardTitle><CardDescription>Groups you're a member of</CardDescription></div>
              <Link to="/groups"><Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {myGroups.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">You haven't joined any groups yet.</p>}
              {myGroups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`} className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div><p className="font-medium text-sm">{group.name}</p><p className="text-xs text-muted-foreground">{group.course_code}</p></div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle className="text-lg">Upcoming Sessions</CardTitle><CardDescription>Your next study sessions</CardDescription></div>
              <Link to="/sessions"><Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No upcoming sessions.</p>}
              {upcomingSessions.map((session) => (
                <div key={session.id} className="p-3 rounded-lg border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{session.description}</p>
                    <Badge variant="outline" className="text-xs">{(session.study_groups as any)?.name}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{session.session_date} · {session.session_time}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{session.location}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Recently Created Groups</CardTitle><CardDescription>New groups you might want to join</CardDescription></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recentGroups.map((group) => (
                <Link key={group.id} to={`/groups/${group.id}`}>
                  <div className="p-4 rounded-lg border border-border/50 hover:shadow-md transition-shadow space-y-2">
                    <p className="font-semibold text-sm">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.course_name}</p>
                    <Badge variant="secondary" className="text-xs">{group.faculty}</Badge>
                  </div>
                </Link>
              ))}
              {recentGroups.length === 0 && <p className="text-sm text-muted-foreground col-span-3 text-center py-4">No groups created yet. Be the first!</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
