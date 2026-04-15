import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Sessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionForm, setSessionForm] = useState({ date: '', time: '', location: '', description: '', groupId: '' });

  const { data: sessions = [] } = useQuery({
    queryKey: ['all-sessions', user?.id],
    queryFn: async () => {
      const { data: memberships } = await supabase.from('group_members').select('group_id').eq('user_id', user!.id);
      if (!memberships?.length) return [];
      const groupIds = memberships.map((m) => m.group_id);
      const { data } = await supabase
        .from('study_sessions')
        .select('*, study_groups(name)')
        .in('group_id', groupIds)
        .order('session_date', { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myLeadedGroups = [] } = useQuery({
    queryKey: ['leaded-groups', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('study_groups')
        .select('id, name')
        .eq('leader_id', user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionForm.groupId) throw new Error('Please select a group');
      const { error } = await supabase.from('study_sessions').insert({
        group_id: sessionForm.groupId,
        created_by: user!.id,
        session_date: sessionForm.date,
        session_time: sessionForm.time,
        location: sessionForm.location,
        description: sessionForm.description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sessions', user?.id] });
      setSessionOpen(false);
      setSessionForm({ date: '', time: '', location: '', description: '', groupId: '' });
      toast.success('Study session scheduled!');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Study Sessions</h1>
            <p className="text-muted-foreground mt-1">All study sessions across your groups</p>
          </div>
          {myLeadedGroups.length > 0 && (
            <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Schedule Session</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Study Session</DialogTitle>
                  <DialogDescription>Create a new study session for one of your groups.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); createSessionMutation.mutate(); }} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-group">Select Group</Label>
                    <Select value={sessionForm.groupId} onValueChange={(val) => setSessionForm({...sessionForm, groupId: val})}>
                      <SelectTrigger id="session-group">
                        <SelectValue placeholder="Choose a group you lead" />
                      </SelectTrigger>
                      <SelectContent>
                        {myLeadedGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
        <div className="space-y-4">
          {sessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No sessions yet</p>
              <p className="text-sm">Join a group or wait for leaders to schedule sessions</p>
            </div>
          )}
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{session.description}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{session.session_date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{session.session_time}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.location}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="self-start sm:self-center">
                    <Users className="h-3 w-3 mr-1" />
                    {(session.study_groups as any)?.name}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Sessions;
