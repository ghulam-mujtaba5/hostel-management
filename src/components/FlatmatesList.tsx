'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, MessageCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpaceMember, Profile } from '@/types';

interface FlatmatesListProps {
  spaceId: string;
}

export function FlatmatesList({ spaceId }: FlatmatesListProps) {
  const [members, setMembers] = useState<(SpaceMember & { profile: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [spaceId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('space_members')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('space_id', spaceId)
        .order('points', { ascending: false });

      if (error) throw error;
      setMembers(data as (SpaceMember & { profile: Profile })[]);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Flatmates</h2>
        <span className="text-xs text-muted-foreground">{members.length} members</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {members.map((member, index) => (
          <motion.div
            key={member.user_id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground overflow-hidden">
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt={member.profile.username || ''} className="h-full w-full object-cover" />
                      ) : (
                        member.profile?.username?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    {member.role === 'admin' && (
                      <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full">
                        <Shield className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {member.profile?.full_name || member.profile?.username || 'User'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Star className="h-2 w-2 text-amber-500 fill-amber-500" />
                      <span>{member.points} pts</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex gap-1">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(100, (member.points / 1000) * 100)}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
