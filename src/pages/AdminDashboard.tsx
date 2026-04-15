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

  const totalMembers = Object.values(memberCounts).reduce((a, b) => a + b, 0);

  // Most active courses
  const courseCounts: Record<string, number> = {};
  allGroups.forEach((g) => { courseCounts[g.course_name] = (courseCounts[g.course_name] || 0) + (memberCounts[g.id] || 0); });
  const topCourses = Object.entries(courseCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // User role lookup
  const roleMap: Record<string, string> = {};
  userRoles.forEach((r) => { roleMap[r.user_id] = r.role; });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">System Administrator</h1>
            <p className="text-muted-foreground mt-1">Platform oversight and activity monitoring</p>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: allUsers.length, icon: Users, color: 'bg-primary/10 text-primary' },
            { label: 'Study Groups', value: allGroups.length, icon: BookOpen, color: 'bg-accent/20 text-accent-foreground' },
            { label: 'Total Memberships', value: totalMembers, icon: Activity, color: 'bg-success/10 text-success' },
            { label: 'Study Sessions', value: allSessions.length, icon: Clock, color: 'bg-primary/10 text-primary' },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-xl p-3 ${stat.color}`}><stat.icon className="h-6 w-6" /></div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabbed admin sections */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5" /> All Registered Users</CardTitle>
                <CardDescription>{allUsers.length} users on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || 'Unnamed'}</TableCell>
                          <TableCell>{u.program || '—'}</TableCell>
                          <TableCell>{u.year_of_study}</TableCell>
                          <TableCell>
                            <Badge variant={roleMap[u.user_id] === 'admin' ? 'default' : 'secondary'}>
                              {roleMap[u.user_id] || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {allUsers.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5" /> All Study Groups</CardTitle>
                <CardDescription>Monitor and manage groups across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group Name</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Faculty</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allGroups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.course_code}</TableCell>
                          <TableCell><Badge variant="outline">{group.faculty || '—'}</Badge></TableCell>
                          <TableCell>{(group.profiles as any)?.full_name || 'Unknown'}</TableCell>
                          <TableCell>{memberCounts[group.id] || 0}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{new Date(group.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteGroupMutation.mutate(group.id)}
                              disabled={deleteGroupMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {allGroups.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No groups yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-5 w-5" /> All Study Sessions</CardTitle>
                <CardDescription>Track scheduled sessions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.description || '—'}</TableCell>
                          <TableCell><Badge variant="secondary">{(session.study_groups as any)?.name || '—'}</Badge></TableCell>
                          <TableCell>{session.session_date}</TableCell>
                          <TableCell>{session.session_time}</TableCell>
                          <TableCell className="text-muted-foreground">{session.location || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {allSessions.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No sessions yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Most Active Courses</CardTitle>
                  <CardDescription>Courses with the most study group participation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topCourses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data yet.</p>}
                  {topCourses.map(([course, count], i) => (
                    <div key={course} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">{i + 1}</span>
                        <span className="font-medium text-sm">{course}</span>
                      </div>
                      <Badge variant="secondary">{count} students</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Posts</CardTitle>
                  <CardDescription>Latest group posts across the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allPosts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No posts yet.</p>}
                  {allPosts.slice(0, 10).map((post) => (
                    <div key={post.id} className="p-3 rounded-lg border border-border/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{(post.profiles as any)?.full_name || 'Unknown'}</span>
                        <Badge variant="outline" className="text-xs">{(post.study_groups as any)?.name}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                      <p className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</p>
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
