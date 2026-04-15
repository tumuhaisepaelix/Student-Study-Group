import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, TrendingUp, Activity, Trash2, Shield, UserCheck, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect non-admins
  if (!loading && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const { data: allGroups = [] } = useQuery({
    queryKey: ['admin-all-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('study_groups').select('*, profiles!study_groups_leader_id_fkey(full_name)');
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['admin-all-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('study_sessions')
        .select('*, study_groups(name)')
        .order('session_date', { ascending: false });
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const { data: memberCounts = {} } = useQuery({
    queryKey: ['admin-member-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('group_members').select('group_id');
      const counts: Record<string, number> = {};
      data?.forEach((m) => { counts[m.group_id] = (counts[m.group_id] || 0) + 1; });
      return counts;
    },
    enabled: !!user && isAdmin,
  });

  const { data: allPosts = [] } = useQuery({
    queryKey: ['admin-all-posts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_posts')
        .select('*, profiles!group_posts_author_id_fkey(full_name), study_groups!group_posts_group_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data } = await supabase.from('user_roles').select('*');
      return data || [];
    },
    enabled: !!user && isAdmin,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // Delete members, sessions, posts first, then group
      await supabase.from('group_members').delete().eq('group_id', groupId);
      await supabase.from('study_sessions').delete().eq('group_id', groupId);
      await supabase.from('group_posts').delete().eq('group_id', groupId);
      const { error } = await supabase.from('study_groups').delete().eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin-member-counts'] });
      toast({ title: 'Group deleted', description: 'The study group has been removed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not delete group. You may need direct admin privileges.', variant: 'destructive' });
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, currentRole }: { userId: string; currentRole: string }) => {
      if (userId === user?.id) throw new Error('You cannot change your own role.');
      
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      
      // Check if role exists
      const { data: existing } = await supabase.from('user_roles').select('*').eq('user_id', userId).maybeSingle();
      
      let error;
      if (existing) {
        ({ error } = await supabase.from('user_roles').update({ role: newRole as any }).eq('user_id', userId));
      } else {
        ({ error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any }));
      }
      
      if (error) throw error;
      return newRole;
    },
    onSuccess: (newRole) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({ title: 'Role Updated', description: `User has been assigned the '${newRole}' role.` });
    },
    onError: (error: Error) => {
      toast({ title: 'Role Update Failed', description: error.message, variant: 'destructive' });
    },
  });

  const totalMembers = Object.values(memberCounts).reduce((a, b) => a + b, 0);
  const totalAdmins = userRoles.filter((r) => r.role === 'admin').length;

  // Most active courses
  const courseCounts: Record<string, number> = {};
  allGroups.forEach((g) => { courseCounts[g.course_name] = (courseCounts[g.course_name] || 0) + (memberCounts[g.id] || 0); });
  const topCourses = Object.entries(courseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // User role lookup
  const roleMap: Record<string, string> = {};
  userRoles.forEach((r) => { roleMap[r.user_id] = r.role; });

  return (
    <AppLayout>
      <div className="space-y-10">
        <div className="flex items-center gap-5">
          <div className="p-4 gradient-primary rounded-2xl shadow-lg shadow-primary/20">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">System Audit Hub</h1>
            <p className="text-muted-foreground mt-1 text-lg font-medium">Real-time platform oversight & faculty performance analytics</p>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Registered Students', value: allUsers.length, icon: Users, color: 'bg-primary/10 text-primary', shadow: 'shadow-primary/5' },
            { label: 'Active Study Groups', value: allGroups.length, icon: BookOpen, color: 'bg-accent/10 text-accent', shadow: 'shadow-accent/5' },
            { label: 'Total Collaborative Memberships', value: totalMembers, icon: Activity, color: 'bg-emerald-50 text-emerald-600', shadow: 'shadow-emerald-500/5' },
            { label: 'System Administrators', value: totalAdmins, icon: Shield, color: 'bg-indigo-50 text-indigo-600', shadow: 'shadow-indigo-500/5' },
          ].map((stat) => (
            <Card key={stat.label} className={`border-none shadow-xl ${stat.shadow} rounded-[2rem] hover-lift overflow-hidden`}>
              <CardContent className="flex items-center gap-5 p-8 relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-muted/20 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-110" />
                <div className={`rounded-2xl p-4 relative ${stat.color}`}><stat.icon className="h-8 w-8" /></div>
                <div className="relative">
                  <p className="text-3xl font-extrabold leading-none mb-1">{stat.value}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabbed admin sections */}
        <Tabs defaultValue="users" className="space-y-8">
          <div className="flex justify-between items-center">
             <TabsList className="bg-muted/50 p-1 rounded-2xl h-14">
              <TabsTrigger value="users" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm">Users</TabsTrigger>
              <TabsTrigger value="groups" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm">Groups</TabsTrigger>
              <TabsTrigger value="sessions" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm">Sessions</TabsTrigger>
              <TabsTrigger value="activity" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-sm">Activity</TabsTrigger>
            </TabsList>
          </div>

          {/* Users Tab */}
          <TabsContent value="users" className="animate-in fade-in-50 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-8 pt-8 px-8">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-2xl font-bold">Registered Users</CardTitle>
                    <CardDescription>Comprehensive list of all {allUsers.length} active students and administrators</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="py-6 px-8 font-bold text-xs uppercase tracking-widest text-muted-foreground">Name</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Program & Faculty</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground text-center">Year</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">System Role</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Joined At</TableHead>
                        <TableHead className="py-6 px-8 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((u) => (
                        <TableRow key={u.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                          <TableCell className="py-5 px-8">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                {u.full_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-bold text-base">{u.full_name || 'Anonymous User'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="space-y-0.5">
                              <p className="font-medium text-sm">{u.program || '—'}</p>
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{u.faculty || 'Unassigned'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center font-extrabold text-sm">{u.year_of_study}</TableCell>
                          <TableCell className="py-5">
                            <Badge variant={roleMap[u.user_id] === 'admin' ? 'default' : 'secondary'} className={`rounded-xl px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${roleMap[u.user_id] === 'admin' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground border-none'}`}>
                              {roleMap[u.user_id] || 'student'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5 text-muted-foreground font-medium text-sm tabular-nums">
                            {new Date(u.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </TableCell>
                          <TableCell className="py-5 px-8 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`rounded-xl h-10 px-4 font-bold border border-transparent transition-all ${roleMap[u.user_id] === 'admin' ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-100' : 'hover:bg-primary/10 hover:text-primary hover:border-primary/20'}`}
                              onClick={() => toggleRoleMutation.mutate({ userId: u.user_id, currentRole: roleMap[u.user_id] || 'user' })}
                              disabled={u.user_id === user?.id || toggleRoleMutation.isPending}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              {roleMap[u.user_id] === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {allUsers.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-20 font-medium">No users found on the platform yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="animate-in fade-in-50 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-8 pt-8 px-8">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-6 w-6 text-accent" />
                  <div>
                    <CardTitle className="text-2xl font-bold">Platform Study Groups</CardTitle>
                    <CardDescription>Administrative control over all collaborative organizations</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="py-6 px-8 font-bold text-xs uppercase tracking-widest text-muted-foreground">Study Group</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Academic Focus</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Leader</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground text-center">Members</TableHead>
                        <TableHead className="py-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">Creation Date</TableHead>
                        <TableHead className="py-6 px-8 text-right font-bold text-xs uppercase tracking-widest text-muted-foreground">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allGroups.map((group) => (
                        <TableRow key={group.id} className="border-border/30 hover:bg-muted/20 transition-colors">
                          <TableCell className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <BookOpen className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-bold text-base">{group.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="space-y-0.5">
                              <p className="font-bold text-sm">{group.course_code}</p>
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold">{group.faculty}</p>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">?</div>
                              <span className="font-medium text-sm">{(group.profiles as any)?.full_name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-center">
                            <Badge variant="secondary" className="rounded-full px-3 py-1 font-extrabold text-sm tabular-nums bg-accent/10 text-accent border-none">{memberCounts[group.id] || 0}</Badge>
                          </TableCell>
                          <TableCell className="py-5 text-muted-foreground font-medium text-sm tabular-nums">
                            {new Date(group.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-5 px-8 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-colors shadow-none"
                              onClick={() => deleteGroupMutation.mutate(group.id)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="animate-in fade-in-50 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-black/5 overflow-hidden">
               <CardHeader className="bg-muted/20 border-b border-border/50 pb-8 pt-8 px-8">
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-indigo-500" />
                  <div>
                    <CardTitle className="text-2xl font-bold">Active Academic Sessions</CardTitle>
                    <CardDescription>Scheduled study timelines across the university</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Session Table content would follow similar modern pattern */}
                <div className="p-12 text-center text-muted-foreground italic">
                  Visual session tracking active. Total scheduling: {allSessions.length} sessions.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/50 p-8">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" /> Most Active Courses
                  </CardTitle>
                  <CardDescription>Based on absolute student participation volume</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {topCourses.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No significant data reported yet.</p>}
                  {topCourses.map(([course, count], i) => (
                    <div key={course} className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 hover:bg-primary/5 transition-all group hover-lift border border-transparent hover:border-primary/10">
                      <div className="flex items-center gap-4">
                        <span className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center text-white ring-4 ring-white shadow-xl shadow-primary/20 text-lg font-black">{i + 1}</span>
                        <div>
                          <p className="font-extrabold text-lg group-hover:text-primary transition-colors">{course}</p>
                          <p className="text-[10px] items-center gap-1 uppercase tracking-widest font-bold text-muted-foreground flex">
                            <Activity className="h-3 w-3" /> High Performance
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary tabular-nums">{count}</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Students Enrolled</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/50 p-8">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <Activity className="h-6 w-6 text-accent" /> Network Pulse
                  </CardTitle>
                  <CardDescription>Live communication stream across the hub</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {allPosts.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">System pulse quiet. No recent activity.</p>}
                  {allPosts.slice(0, 10).map((post) => (
                    <div key={post.id} className="p-5 rounded-2xl border border-border/50 space-y-3 bg-white hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-2 h-full bg-accent/20 group-hover:bg-accent transition-colors" />
                      <div className="flex items-center justify-between relative">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full gradient-primary flex items-center justify-center text-[8px] text-white font-bold">Post</div>
                          <span className="font-bold text-sm text-primary">{(post.profiles as any)?.full_name || 'Anonymous'}</span>
                        </div>
                        <Badge variant="outline" className="rounded-lg text-[9px] font-black uppercase tracking-tight bg-muted/30 border-none shrink-0">
                          {(post.study_groups as any)?.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-2">"{post.content}"</p>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                         <Clock className="h-3 w-3" /> {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </AppLayout>
  );
};

export default AdminDashboard;
