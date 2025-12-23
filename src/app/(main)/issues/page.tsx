'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SpaceIssue } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function IssuesPage() {
  const { user, currentSpace } = useAuth();
  const [issues, setIssues] = useState<SpaceIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: '', description: '', priority: 'normal' });

  useEffect(() => {
    if (currentSpace) {
      fetchIssues();
    }
  }, [currentSpace]);

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('space_issues')
        .select('*, reporter:profiles(username)')
        .eq('space_id', currentSpace!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentSpace) return;

    try {
      const { error } = await supabase
        .from('space_issues')
        .insert({
          space_id: currentSpace.id,
          reporter_id: user.id,
          title: newIssue.title,
          description: newIssue.description,
          priority: newIssue.priority,
        });

      if (error) throw error;

      toast.success('Issue reported');
      setIsCreating(false);
      setNewIssue({ title: '', description: '', priority: 'normal' });
      fetchIssues();
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue');
    }
  };

  if (!currentSpace) return <div className="p-4">Please select a space first.</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Space Issues & Maintenance</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          {isCreating ? 'Cancel' : 'Report Issue'}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Report New Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  required
                  placeholder="e.g., Leaking tap in kitchen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newIssue.description}
                  onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                  placeholder="Details about the issue..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button type="submit">Submit Report</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <p>Loading issues...</p>
        ) : issues.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No issues reported.</p>
        ) : (
          issues.map((issue) => (
            <Card key={issue.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                    <div className="flex gap-2 mt-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        issue.priority === 'critical' ? 'bg-red-100 text-red-800' :
                        issue.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {issue.priority.toUpperCase()}
                      </span>
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {issue.status.toUpperCase()}
                      </span>
                      <span className="text-gray-500 py-1">
                        Reported by {issue.reporter?.username || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
