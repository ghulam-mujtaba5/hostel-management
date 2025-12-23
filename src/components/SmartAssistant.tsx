'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getSpaceInsights, IntelligenceInsight } from '@/lib/intelligence';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function SmartAssistant() {
  const { currentSpace, user } = useAuth();
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (currentSpace && user) {
      loadInsights();
    }
  }, [currentSpace, user]);

  async function loadInsights() {
    if (!currentSpace || !user) return;
    try {
      setLoading(true);
      const data = await getSpaceInsights(supabase, currentSpace.id, user.id);
      setInsights(data);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(insight: IntelligenceInsight, action: 'accept' | 'reject' | 'snooze') {
    if (!insight.id) return; // Can't update if not saved yet (should be saved by getSpaceInsights)

    try {
      const status = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'snoozed';
      
      const { error } = await supabase
        .from('task_suggestions')
        .update({ status })
        .eq('id', insight.id);

      if (error) throw error;

      // Remove from UI
      setInsights(prev => prev.filter(i => i.id !== insight.id));

      if (action === 'accept') {
        if (insight.action === 'create_task') {
          // Redirect to create task or open modal (simplified here)
          toast.success('Suggestion accepted! Go to Tasks to create it.');
        } else if (insight.action === 'remind_user') {
          // Send notification (simplified)
          toast.success('Reminder sent to member!');
        }
      } else if (action === 'snooze') {
        toast.info('Snoozed for later.');
      }
    } catch (error) {
      toast.error('Failed to update suggestion');
    }
  }

  if (loading) return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;
  if (insights.length === 0) return null;

  return (
    <Card className="border-indigo-100 bg-indigo-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-900">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Smart Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={insight.id || idx} className="bg-white p-3 rounded-md shadow-sm border border-indigo-100 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              {insight.type === 'prediction' ? (
                <Clock className="w-5 h-5 text-blue-500 mt-1" />
              ) : (
                <Bell className="w-5 h-5 text-orange-500 mt-1" />
              )}
              <div>
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2 justify-end mt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 h-8"
                onClick={() => handleAction(insight, 'reject')}
              >
                No need
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-indigo-600 hover:text-indigo-700 h-8"
                onClick={() => handleAction(insight, 'snooze')}
              >
                Wait more
              </Button>
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 h-8"
                onClick={() => handleAction(insight, 'accept')}
              >
                {insight.action === 'create_task' ? 'Create Task' : 'Send Reminder'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
