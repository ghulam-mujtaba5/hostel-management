'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyInspiration } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

export default function WellnessWidget() {
  const [inspiration, setInspiration] = useState<DailyInspiration | null>(null);

  useEffect(() => {
    fetchInspiration();
  }, []);

  const fetchInspiration = async () => {
    const { data } = await supabase
      .from('daily_inspirations')
      .select('*');
    
    if (data && data.length > 0) {
      // Pick random
      const random = data[Math.floor(Math.random() * data.length)];
      setInspiration(random);
    }
  };

  if (!inspiration) return null;

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-none">
      <CardContent className="p-6 flex gap-4 items-start">
        <Quote className="h-8 w-8 text-indigo-400 flex-shrink-0" />
        <div>
          <p className="text-lg font-medium text-indigo-900 italic">"{inspiration.content}"</p>
          <p className="text-sm text-indigo-600 mt-2 font-semibold">— {inspiration.source}</p>
          <span className="text-xs text-indigo-400 mt-1 block capitalize">{inspiration.category}</span>
        </div>
      </CardContent>
    </Card>
  );
}
