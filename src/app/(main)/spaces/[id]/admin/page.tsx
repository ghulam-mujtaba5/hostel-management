'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Home, 
  Settings, 
  ArrowLeft, 
  UserPlus, 
  Shield, 
  ShieldAlert,
  Trash2,
  DoorOpen,
  Bed,
  Save,
  X,
  Share2,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SpaceAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [space, setSpace] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editData, setEditData] = useState({ room: '', bed: '' });

  useEffect(() => {
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch space details
      const { data: spaceData, error: spaceError } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .single();

      if (spaceError) throw spaceError;
      setSpace(spaceData);

      // Fetch members and check if current user is admin
      const { data: membersData, error: membersError } = await supabase
        .from('space_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('space_id', id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      const currentMember = membersData?.find(m => m.user_id === user.id);
      setIsAdmin(currentMember?.role === 'admin');

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load space data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('space_members')
        .update({
          room_number: editData.room,
          bed_number: editData.bed
        })
        .eq('space_id', id)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Member updated successfully');
      setEditingMember(null);
      fetchData();
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('Failed to update member');
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    if (userId === user?.id) {
      toast.error("You cannot change your own role");
      return;
    }

    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      const { error } = await supabase
        .from('space_members')
        .update({ role: newRole })
        .eq('space_id', id)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success(`Role updated to ${newRole}`);
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const removeResident = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot remove yourself");
      return;
    }

    if (!confirm('Are you sure you want to remove this resident from the hostel?')) return;

    try {
      const { error } = await supabase
        .from('space_members')
        .delete()
        .eq('space_id', id)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Resident removed successfully');
      fetchData();
    } catch (error) {
      console.error('Error removing resident:', error);
      toast.error('Failed to remove resident');
    }
  };

  const copyInviteLink = () => {
    if (space) {
      const link = `${window.location.origin}/join/${space.invite_code}`;
      navigator.clipboard.writeText(link);
      toast.success("Invite link copied!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You do not have administrative privileges for this space.</p>
        <Button asChild>
          <Link href={`/spaces/${id}`}>Back to Space</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/spaces/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{space?.name} Admin</h1>
            <p className="text-muted-foreground">Manage your hostel's residents and assignments.</p>
          </div>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-full flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary uppercase">Space Admin</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Residents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {members.filter(m => m.room_number).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Invite Code</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-2xl font-mono font-bold text-primary">{space?.invite_code}</div>
            <Button variant="outline" size="sm" onClick={copyInviteLink} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Link
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resident Management</CardTitle>
          <CardDescription>Assign rooms and manage roles for your hostel members.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Resident</th>
                  <th className="px-6 py-4 font-medium">Room / Bed</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((member) => (
                  <tr key={member.user_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {member.profile?.full_name?.[0] || member.profile?.username?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-medium">{member.profile?.full_name || member.profile?.username}</p>
                          <p className="text-xs text-muted-foreground">Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingMember === member.user_id ? (
                        <div className="flex items-center gap-2">
                          <Input 
                            size={1}
                            className="w-20 h-8 text-xs"
                            placeholder="Room"
                            value={editData.room}
                            onChange={(e) => setEditData({...editData, room: e.target.value})}
                          />
                          <Input 
                            size={1}
                            className="w-20 h-8 text-xs"
                            placeholder="Bed"
                            value={editData.bed}
                            onChange={(e) => setEditData({...editData, bed: e.target.value})}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <DoorOpen className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{member.room_number || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Bed className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{member.bed_number || '-'}</span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        member.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingMember === member.user_id ? (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-green-600"
                              onClick={() => handleUpdateMember(member.user_id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600"
                              onClick={() => setEditingMember(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingMember(member.user_id);
                                setEditData({
                                  room: member.room_number || '',
                                  bed: member.bed_number || ''
                                });
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-amber-600"
                              onClick={() => toggleRole(member.user_id, member.role)}
                              title="Toggle Admin Role"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-600"
                              onClick={() => removeResident(member.user_id)}
                              title="Remove Resident"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
