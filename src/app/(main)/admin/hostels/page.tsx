'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Home, 
  Plus, 
  Search, 
  Users, 
  Settings, 
  Trash2, 
  ExternalLink,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Space {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  member_count?: number;
}

export default function HostelManagement() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newHostelName, setNewHostelName] = useState('');

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      // Fetch spaces and their member counts
      const { data: spacesData, error: spacesError } = await supabase
        .from('spaces')
        .select(`
          *,
          space_members(count)
        `);

      if (spacesError) throw spacesError;

      const formattedSpaces = spacesData.map((s: any) => ({
        ...s,
        member_count: s.space_members?.[0]?.count || 0
      }));

      setSpaces(formattedSpaces);
    } catch (error) {
      console.error('Error fetching spaces:', error);
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHostelName.trim()) return;

    try {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from('spaces')
        .insert([
          { name: newHostelName, invite_code: inviteCode }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Hostel created successfully!');
      setNewHostelName('');
      setIsAdding(false);
      fetchSpaces();
    } catch (error) {
      console.error('Error creating hostel:', error);
      toast.error('Failed to create hostel');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  const handleDeleteHostel = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hostel? This will remove all members and data.')) return;

    try {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Hostel deleted successfully');
      fetchSpaces();
    } catch (error) {
      console.error('Error deleting hostel:', error);
      toast.error('Failed to delete hostel');
    }
  };

  const filteredSpaces = spaces.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.invite_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hostel Management</h1>
          <p className="text-muted-foreground">Manage independent hostels and flat houses.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add New Hostel
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or invite code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Create New Hostel</CardTitle>
                <CardDescription>Enter the name of the new hostel or flat house.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateHostel} className="flex gap-4">
                  <Input
                    placeholder="Hostel Name (e.g. Sunshine Residency)"
                    value={newHostelName}
                    onChange={(e) => setNewHostelName(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit">Create</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))
        ) : filteredSpaces.length > 0 ? (
          filteredSpaces.map((space, index) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-lg transition-all duration-300 border-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Home className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteHostel(space.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl">{space.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {space.member_count} Members
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
                    <div className="text-xs font-mono text-muted-foreground">
                      INVITE CODE: <span className="text-foreground font-bold">{space.invite_code}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyInviteCode(space.invite_code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs" asChild>
                      <a href={`/spaces/${space.id}`} target="_blank" rel="noopener noreferrer">
                        View Public Page
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No hostels found</h3>
            <p className="text-muted-foreground">Try adjusting your search or create a new hostel.</p>
          </div>
        )}
      </div>
    </div>
  );
}
