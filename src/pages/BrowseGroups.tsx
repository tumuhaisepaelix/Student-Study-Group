import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const BrowseGroups = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('all');

  const { data: groups = [] } = useQuery({
    queryKey: ['all-groups'],
    queryFn: async () => {
      const { data } = await supabase.from('study_groups').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: myMemberships = [] } = useQuery({
    queryKey: ['my-memberships', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('group_members').select('group_id').eq('user_id', user!.id);
      return data?.map((m) => m.group_id) || [];
    },
    enabled: !!user,
  });

  const { data: memberCounts = {} } = useQuery({
    queryKey: ['member-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('group_members').select('group_id');
      const counts: Record<string, number> = {};
      data?.forEach((m) => { counts[m.group_id] = (counts[m.group_id] || 0) + 1; });
      return counts;
    },
    enabled: !!user,
  });

  const faculties = [...new Set(groups.map((g) => g.faculty).filter(Boolean))];

  const filtered = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.course_code.toLowerCase().includes(search.toLowerCase()) ||
      g.course_name.toLowerCase().includes(search.toLowerCase());
    const matchesFaculty = facultyFilter === 'all' || g.faculty === facultyFilter;
    return matchesSearch && matchesFaculty;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Browse Study Groups</h1>
          <p className="text-muted-foreground mt-1">Find and join groups that match your courses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by course, group name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="w-full sm:w-[240px]"><SelectValue placeholder="Filter by faculty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const isMember = myMemberships.includes(group.id);
            const count = memberCounts[group.id] || 0;
            return (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    {isMember && <Badge className="bg-success text-success-foreground">Joined</Badge>}
                  </div>
                  <CardTitle className="text-base mt-3">{group.name}</CardTitle>
                  <CardDescription>{group.course_code} · {group.course_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {group.meeting_location}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" /> {count} members
                    </span>
                    <Link to={`/groups/${group.id}`}>
                      <Button size="sm" variant={isMember ? 'outline' : 'default'}>
                        {isMember ? 'View' : 'Join Group'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No groups found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BrowseGroups;
