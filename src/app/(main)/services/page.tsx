'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ServicesPage() {
  const { currentSpace } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newService, setNewService] = useState({ 
    name: '', 
    description: '', 
    default_duration_minutes: 30,
    category: 'other',
    points_reward: 0
  });

  useEffect(() => {
    if (currentSpace) {
      fetchServices();
    }
  }, [currentSpace]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('space_id', currentSpace!.id)
        .order('name');
      
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSpace) return;

    try {
      const { error } = await supabase
        .from('services')
        .insert({
          space_id: currentSpace.id,
          name: newService.name,
          description: newService.description,
          default_duration_minutes: newService.default_duration_minutes,
          category: newService.category,
          points_reward: newService.points_reward
        });

      if (error) throw error;

      toast.success('Service created successfully');
      setIsCreating(false);
      setNewService({ 
        name: '', 
        description: '', 
        default_duration_minutes: 30,
        category: 'other',
        points_reward: 0
      });
      fetchServices();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    }
  };

  if (!currentSpace) return <div className="p-4">Please select a space first.</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Service Management</h1>
        <div className="space-x-2">
          <Link href="/services/insights">
            <Button variant="outline">View Insights</Button>
          </Link>
          <Button onClick={() => setIsCreating(!isCreating)}>
            {isCreating ? 'Cancel' : 'Add New Service'}
          </Button>
        </div>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Service</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                    placeholder="e.g., Laundry, Ironing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select 
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Describe what this service entails..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Default Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newService.default_duration_minutes}
                    onChange={(e) => setNewService({ ...newService, default_duration_minutes: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Points Reward</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newService.points_reward}
                    onChange={(e) => setNewService({ ...newService, points_reward: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              
              <Button type="submit">Create Service</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading services...</p>
        ) : services.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No services defined yet.</p>
        ) : (
          services.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {service.name}
                  <span className="text-xs px-2 py-1 bg-primary/10 rounded-full text-primary capitalize">{service.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{service.description || 'No description'}</p>
                <div className="flex justify-between text-sm font-medium">
                  <span>Duration: {service.default_duration_minutes} mins</span>
                  <span>Points: {service.points_reward}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
