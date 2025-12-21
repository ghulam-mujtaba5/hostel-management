'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, MessageCircle, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { SpaceMember, Profile } from '@/types';
import { calculateLevel } from '@/components/Achievements';

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
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xl font-bold tracking-tight">Your Flatmates</h2>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
          {members.length} members
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {members.map((member, index) => (
          <motion.div
            key={member.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center font-bold text-muted-foreground overflow-hidden border border-border/50 group-hover:border-primary/30 transition-colors">
                      {member.profile?.avatar_url ? (
                        <img src={member.profile.avatar_url} alt={member.profile.username || ''} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg">{member.profile?.username?.[0]?.toUpperCase() || '?'}</span>
                      )}
                    </div>
                    {member.role === 'admin' && (
                      <div className="absolute -top-1.5 -right-1.5 bg-primary text-white p-1 rounded-lg shadow-lg ring-2 ring-background">
                        <Shield className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                      {member.profile?.full_name || member.profile?.username || 'User'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span>{member.points} points</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    <span>Progress</span>
                    <span>Level {calculateLevel(member.points).level}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (member.points / 1000) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-primary rounded-full" 
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
