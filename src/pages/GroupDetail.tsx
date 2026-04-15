import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, MapPin, Calendar, Clock, MessageSquare, Crown, Send, Megaphone, HelpCircle, UserPlus, UserMinus, Pencil, Trash2, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GroupDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', courseCode: '', courseName: '', description: '', location: '', faculty: '' });
  const [sessionForm, setSessionForm] = useState({ date: '', time: '', location: '', description: '' });

  const { data: group } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data } = await supabase.from('study_groups').select('*').eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_members')
        .select('*, profiles(full_name, program)')
        .eq('group_id', id!);
      return data || [];
    },
    enabled: !!id,
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['group-sessions', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('group_id', id!)
        .order('session_date', { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['group-posts', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('group_posts')
        .select('*, profiles(full_name)')
        .eq('group_id', id!)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: leaderProfile } = useQuery({
    queryKey: ['leader-profile', group?.leader_id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', group!.leader_id).single();
      return data;
    },
    enabled: !!group?.leader_id,
  });

  const isMember = members.some((m) => m.user_id === user?.id);
  const isLeader = group?.leader_id === user?.id;

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('group_members').insert({ group_id: id!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Joined group!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('group_members').delete().eq('group_id', id!).eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Left group');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from('group_posts').insert({
        group_id: id!,
        author_id: user!.id,
        content,
        post_type: 'general',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-posts', id] });
      setNewPost('');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Edit group mutation (leader only)
  const editGroupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('study_groups').update({
        name: editForm.name,
        course_code: editForm.courseCode,
        course_name: editForm.courseName,
        description: editForm.description,
        meeting_location: editForm.location,
        faculty: editForm.faculty,
      }).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      setEditOpen(false);
      toast.success('Group info updated!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Create session mutation (leader only)
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('study_sessions').insert({
        group_id: id!,
        created_by: user!.id,
        session_date: sessionForm.date,
        session_time: sessionForm.time,
        location: sessionForm.location,
        description: sessionForm.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-sessions', id] });
      setSessionOpen(false);
      setSessionForm({ date: '', time: '', location: '', description: '' });
      toast.success('Study session scheduled!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Remove member mutation (leader only)
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from('group_members').delete().eq('group_id', id!).eq('user_id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', id] });
      toast.success('Member removed');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEditDialog = () => {
    if (group) {
      setEditForm({
        name: group.name,
        courseCode: group.course_code,
        courseName: group.course_name,
        description: group.description,
        location: group.meeting_location,
        faculty: group.faculty,
      });
      setEditOpen(true);
    }
  };

  const handlePost = () => {
    if (!newPost.trim()) return;
    postMutation.mutate(newPost);
  };

  const typeIcon = (type: string) => {
    if (type === 'announcement') return <Megaphone className="h-4 w-4 text-accent-foreground" />;
    if (type === 'question') return <HelpCircle className="h-4 w-4 text-primary" />;
    return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  };

  if (!group) {
    return <AppLayout><div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Group header */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                  <Users className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{group.name}</h1>
                  <p className="text-muted-foreground">{group.course_code} · {group.course_name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{group.meeting_location}</span>
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{members.length} members</span>
                    <span className="flex items-center gap-1"><Crown className="h-3.5 w-3.5" />Led by {leaderProfile?.full_name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {isLeader && (
                  <Button variant="outline" onClick={openEditDialog}>
                    <Pencil className="h-4 w-4 mr-2" />Edit Group
                  </Button>
                )}
                {!isMember && !isLeader && (
                  <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                    <UserPlus className="h-4 w-4 mr-2" />{joinMutation.isPending ? 'Joining...' : 'Join Group'}
                  </Button>
                )}
                {isMember && !isLeader && (
                  <Button variant="outline" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending}>
                    <UserMinus className="h-4 w-4 mr-2" />Leave
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{group.description}</p>
          </CardContent>
        </Card>

        {/* Edit Group Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Edit Group Information</DialogTitle>
              <DialogDescription>Update your study group details. Only the group leader can make changes.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); editGroupMutation.mutate(); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Group Name</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">Course Code</Label>
                  <Input id="edit-code" value={editForm.courseCode} onChange={(e) => setEditForm({ ...editForm, courseCode: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-course">Course Name</Label>
                  <Input id="edit-course" value={editForm.courseName} onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-faculty">Faculty</Label>
                <Input id="edit-faculty" value={editForm.faculty} onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea id="edit-desc" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-loc">Meeting Location</Label>
                <Input id="edit-loc" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={editGroupMutation.isPending}>
                  {editGroupMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="discussion" className="space-y-4">
          <TabsList>
            <TabsTrigger value="discussion">Discussion</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
            <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="discussion" className="space-y-4">
            {isMember && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-2">
                    <Input placeholder="Share an update, ask a question..." value={newPost} onChange={(e) => setNewPost(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePost()} />
                    <Button size="icon" onClick={handlePost} disabled={postMutation.isPending}><Send className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No posts yet. {isMember ? 'Start the conversation!' : 'Join to participate.'}</div>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {typeIcon(post.post_type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{(post.profiles as any)?.full_name || 'Unknown'}</span>
                          <Badge variant="outline" className="text-xs capitalize">{post.post_type}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{post.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Study Sessions</h3>
              {isLeader && (
                <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-2" />Schedule Session</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Schedule Study Session</DialogTitle>
                      <DialogDescription>Create a new study session for your group members.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => { e.preventDefault(); createSessionMutation.mutate(); }} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-desc">Description</Label>
                        <Input id="session-desc" placeholder="e.g. Exam Revision Chapter 1" value={sessionForm.description} onChange={(e) => setSessionForm({...sessionForm, description: e.target.value})} required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="session-date">Date</Label>
                          <Input id="session-date" type="date" value={sessionForm.date} onChange={(e) => setSessionForm({...sessionForm, date: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="session-time">Time</Label>
                          <Input id="session-time" type="time" value={sessionForm.time} onChange={(e) => setSessionForm({...sessionForm, time: e.target.value})} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="session-loc">Location / Meeting Link</Label>
                        <Input id="session-loc" placeholder="e.g. Main Library or Zoom Link" value={sessionForm.location} onChange={(e) => setSessionForm({...sessionForm, location: e.target.value})} required />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSessionOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createSessionMutation.isPending}>{createSessionMutation.isPending ? 'Scheduling...' : 'Schedule Session'}</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl border-border/50 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No sessions scheduled yet.</p>
                {isLeader && <p className="text-sm mt-1">Click the button above to schedule your first session!</p>}
              </div>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-16 bg-primary/5 flex flex-col items-center justify-center border-r">
                        <span className="text-xs font-bold text-primary uppercase">{new Date(session.session_date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-bold">{new Date(session.session_date).getDate()}</span>
                      </div>
                      <div className="flex-1 p-4">
                        <p className="font-semibold">{session.description}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{session.session_time}</span>
                          <span className="flex items-center gap-1 font-medium text-foreground/80 truncate max-w-[200px]"><MapPin className="h-3.5 w-3.5" />{session.location}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Members tab with leader management */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Group Members
                  {isLeader && <Badge variant="secondary" className="ml-2"><Settings className="h-3 w-3 mr-1" />Managing</Badge>}
                </CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? 's' : ''}
                  {isLeader && ' · As the group leader, you can remove inactive members'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                        {((member.profiles as any)?.full_name || '?')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{(member.profiles as any)?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{(member.profiles as any)?.program || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.user_id === group.leader_id ? (
                        <Badge><Crown className="h-3 w-3 mr-1" />Leader</Badge>
                      ) : isLeader ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeMemberMutation.mutate(member.user_id)}
                          disabled={removeMemberMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default GroupDetail;
