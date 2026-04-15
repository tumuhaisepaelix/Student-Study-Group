import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', courseCode: '', courseName: '', description: '', location: '', faculty: '' });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Create group
      const { data: group, error } = await supabase.from('study_groups').insert({
        name: form.name,
        course_code: form.courseCode,
        course_name: form.courseName,
        description: form.description,
        meeting_location: form.location,
        faculty: form.faculty,
        leader_id: user!.id,
      }).select().single();
      if (error) throw error;
      // Auto-join as member
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user!.id });
      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['all-groups'] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      toast.success('Study group created!');
      navigate(`/groups/${group.id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <div><CardTitle>Create Study Group</CardTitle><CardDescription>Start a new study group for your course</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input id="name" placeholder="e.g. Data Structures Masters" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCode">Course Code</Label>
                  <Input id="courseCode" placeholder="e.g. CSC1201" value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input id="courseName" placeholder="e.g. Data Structures" value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Select onValueChange={(v) => setForm({ ...form, faculty: v })}>
                  <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering, Design & Technology">Engineering, Design & Technology</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Business & Administration">Business & Administration</SelectItem>
                    <SelectItem value="Law">Law</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe what the group will focus on..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Meeting Location</Label>
                <Input id="location" placeholder="e.g. Library Room 204 or Online - Google Meet" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default CreateGroup;
