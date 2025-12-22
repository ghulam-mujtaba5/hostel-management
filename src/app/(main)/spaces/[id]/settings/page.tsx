"use client";

import { useState, useEffect, use } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Save, 
  Building2, 
  Bell, 
  Shuffle,
  Settings,
  Share2,
  Copy,
  Users,
  Clock,
  RefreshCw,
  Megaphone,
  MapPin,
  FileText,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Space, SpaceProfile, TaskSettings, QueueSettings } from "@/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { SlideInCard } from "@/components/Animations";

export default function SpaceSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, refreshSpaces } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceProfile, setSpaceProfile] = useState<Partial<SpaceProfile>>({});
  const [taskSettings, setTaskSettings] = useState<Partial<TaskSettings>>({
    rotation_enabled: true,
    rotation_type: 'round_robin',
    auto_assign_enabled: false,
    max_requests_per_period: 5,
    request_period: 'weekly',
    notification_before_due: 24,
  });
  const [queueSettings, setQueueSettings] = useState<Partial<QueueSettings>>({
    max_priority_skips_per_member: 5,
    priority_skip_reset_period: 'monthly',
    avg_service_time_minutes: 30,
    max_concurrent_services: 3,
    enable_membership_priority: true,
    enable_urgency_priority: true,
    enable_time_based_priority: false,
    max_wait_before_boost_minutes: 120,
    prevent_skip_abuse: true,
    min_time_between_skips_hours: 24,
  });
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [id, user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch space
      const { data: spaceData, error: spaceError } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .single();

      if (spaceError) throw spaceError;
      setSpace(spaceData);

      // Check if admin
      const { data: memberData } = await supabase
        .from('space_members')
        .select('role')
        .eq('space_id', id)
        .eq('user_id', user.id)
        .single();

      setIsAdmin(memberData?.role === 'admin');

      // Fetch space profile
      const { data: profileData } = await supabase
        .from('space_profiles')
        .select('*')
        .eq('space_id', id)
        .single();

      if (profileData) {
        setSpaceProfile(profileData);

      // Fetch queue settings
      const { data: queueData } = await supabase
        .from('queue_settings')
        .select('*')
        .eq('space_id', id)
        .single();

      if (queueData) {
        setQueueSettings(queueData);
      }
      }

      // Fetch task settings
      const { data: settingsData } = await supabase
        .from('task_settings')
        .select('*')
        .eq('space_id', id)
        .single();

      if (settingsData) {
        setTaskSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!space || !isAdmin) return;
    setSaving(true);

    try {
      // Update space name if changed
      const { error: spaceError } = await supabase
        .from('spaces')
        .update({ name: space.name })
        .eq('id', id);

      if (spaceError) throw spaceError;
// Update queue settings
      const { error: queueError } = await supabase
        .from('queue_settings')
        .upsert({
          space_id: id,
          ...queueSettings,
          updated_at: new Date().toISOString(),
        });

      if (queueError) throw queueError;

      
      // Update space profile
      const { error: profileError } = await supabase
        .from('space_profiles')
        .upsert({
          space_id: id,
          ...spaceProfile,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update task settings
      const { error: settingsError } = await supabase
        .from('task_settings')
        .upsert({
          space_id: id,
          ...taskSettings,
          updated_at: new Date().toISOString(),
        });

      if (settingsError) throw settingsError;

      toast.success('Settings saved successfully!');
      refreshSpaces();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
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
        <Settings className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Admin Access Required</h2>
        <p className="text-muted-foreground mb-6">Only admins can access hostel settings.</p>
        <Button asChild>
          <Link href={`/spaces/${id}`}>Back to Hostel</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <SlideInCard direction="down">
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-12 w-12 rounded-2xl bg-muted/50 hover:bg-muted">
              <Link href={`/spaces/${id}`}>
                <ArrowLeft className="h-6 w-6" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Hostel Settings</h1>
              <p className="text-muted-foreground font-bold">Configure your hostel</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="rounded-xl gap-2 px-6 h-12 font-bold"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            Save Changes
          </Button>
        </div>
      </SlideInCard>

      <div className="grid gap-8">
        {/* Basic Info */}
        <SlideInCard direction="up" delay={0.1}>
          <Card className="border-0 shadow-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>General settings for your hostel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-bold">Hostel Name</Label>
                  <Input
                    id="name"
                    value={space?.name || ''}
                    onChange={(e) => setSpace({ ...space!, name: e.target.value })}
                    className="h-12 rounded-xl"
                    placeholder="My Hostel"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Invite Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={space?.invite_code || ''}
                      readOnly
                      className="h-12 rounded-xl font-mono bg-muted/50"
                    />
                    <Button variant="outline" size="icon" onClick={copyInviteLink} className="h-12 w-12 rounded-xl">
                      <Copy className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-bold">Description</Label>
                <Textarea
                  id="description"
                  value={spaceProfile.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSpaceProfile({ ...spaceProfile, description: e.target.value })}
                  className="rounded-xl min-h-[100px]"
                  placeholder="Tell members about your hostel..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={spaceProfile.address || ''}
                  onChange={(e) => setSpaceProfile({ ...spaceProfile, address: e.target.value })}
                  className="h-12 rounded-xl"
                  placeholder="123 Hostel Street..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules" className="font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  House Rules
                </Label>
                <Textarea
                  id="rules"
                  value={spaceProfile.rules || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSpaceProfile({ ...spaceProfile, rules: e.target.value })}
                  className="rounded-xl min-h-[120px]"
                  placeholder="1. Keep common areas clean&#10;2. Quiet hours after 10 PM&#10;..."
                />
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Announcement */}
        <SlideInCard direction="up" delay={0.15}>
          <Card className="border-0 shadow-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Megaphone className="h-5 w-5 text-yellow-500" />
                Announcement
              </CardTitle>
              <CardDescription>Display a message to all members</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={spaceProfile.announcement || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSpaceProfile({ ...spaceProfile, announcement: e.target.value })}
                className="rounded-xl min-h-[100px]"
                placeholder="Important: Maintenance scheduled for Saturday..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                Leave empty to hide the announcement banner
              </p>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Task Settings */}
        <SlideInCard direction="up" delay={0.2}>
          <Card className="border-0 shadow-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shuffle className="h-5 w-5 text-purple-500" />
                Task Distribution
              </CardTitle>
              <CardDescription>Configure how tasks are assigned to members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <p className="font-bold">Enable Task Rotation</p>
                  <p className="text-sm text-muted-foreground">Automatically rotate tasks among members</p>
                </div>
                <Switch
                  checked={taskSettings.rotation_enabled}
                  onCheckedChange={(checked: boolean) => setTaskSettings({ ...taskSettings, rotation_enabled: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Rotation Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'round_robin', label: 'Round Robin', desc: 'Equal turns' },
                    { value: 'random', label: 'Random', desc: 'Random assignment' },
                    { value: 'weighted', label: 'Weighted', desc: 'By availability' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setTaskSettings({ ...taskSettings, rotation_type: type.value as any })}
                      className={`p-4 rounded-xl text-left transition-all ${
                        taskSettings.rotation_type === type.value
                          ? 'bg-primary/10 ring-2 ring-primary'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <p className="font-bold text-sm">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="space-y-1">
                  <p className="font-bold">Auto-assign Tasks</p>
                  <p className="text-sm text-muted-foreground">Automatically assign unassigned tasks</p>
                </div>
                <Switch
                  checked={taskSettings.auto_assign_enabled}
                  onCheckedChange={(checked: boolean) => setTaskSettings({ ...taskSettings, auto_assign_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Request Token Settings */}
        <SlideInCard direction="up" delay={0.25}>
          <Card className="border-0 shadow-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-orange-500" />
                Request Tokens
              </CardTitle>
              <CardDescription>Configure how members can request cleaning help</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">Max Requests Per Period</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={taskSettings.max_requests_per_period}
                    onChange={(e) => setTaskSettings({ ...taskSettings, max_requests_per_period: parseInt(e.target.value) || 5 })}
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">How many cleaning requests each member can make</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Reset Period</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['weekly', 'monthly'].map((period) => (
                      <button
                        key={period}
                        type="button"
                        onClick={() => setTaskSettings({ ...taskSettings, request_period: period as any })}
                        className={`p-4 rounded-xl capitalize transition-all ${
                          taskSettings.request_period === period
                            ? 'bg-primary/10 ring-2 ring-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <p className="font-bold">{period}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Service Queue Settings */}
        <SlideInCard direction="up" delay={0.35}>
          <Card className="border-0 shadow-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-5 w-5 text-green-500" />
                Service Queue System
              </CardTitle>
              <CardDescription>Configure queue and priority skip settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Avg Service Time (minutes)
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={180}
                    value={queueSettings.avg_service_time_minutes}
                    onChange={(e) => setQueueSettings({ ...queueSettings, avg_service_time_minutes: parseInt(e.target.value) || 30 })}
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">Average time for each service task</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Max Concurrent Services</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={queueSettings.max_concurrent_services}
                    onChange={(e) => setQueueSettings({ ...queueSettings, max_concurrent_services: parseInt(e.target.value) || 3 })}
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">How many services can run at once</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  Priority Skip System
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Max Skips Per Member</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={queueSettings.max_priority_skips_per_member}
                      onChange={(e) => setQueueSettings({ ...queueSettings, max_priority_skips_per_member: parseInt(e.target.value) || 5 })}
                      className="h-10 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">Members can skip ahead this many positions</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Reset Period</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {['weekly', 'monthly', 'never'].map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setQueueSettings({ ...queueSettings, priority_skip_reset_period: period as any })}
                          className={`p-2 rounded-xl capitalize text-xs transition-all ${
                            queueSettings.priority_skip_reset_period === period
                              ? 'bg-primary/10 ring-2 ring-primary'
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Enable Membership Priority</p>
                    <p className="text-xs text-muted-foreground">Members get priority over non-members</p>
                  </div>
                  <Switch
                    checked={queueSettings.enable_membership_priority}
                    onCheckedChange={(checked: boolean) => setQueueSettings({ ...queueSettings, enable_membership_priority: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Enable Urgency Priority</p>
                    <p className="text-xs text-muted-foreground">Urgent requests get automatic boost</p>
                  </div>
                  <Switch
                    checked={queueSettings.enable_urgency_priority}
                    onCheckedChange={(checked: boolean) => setQueueSettings({ ...queueSettings, enable_urgency_priority: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Prevent Skip Abuse</p>
                    <p className="text-xs text-muted-foreground">Limit how often members can use skips</p>
                  </div>
                  <Switch
                    checked={queueSettings.prevent_skip_abuse}
                    onCheckedChange={(checked: boolean) => setQueueSettings({ ...queueSettings, prevent_skip_abuse: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Min Hours Between Skips</Label>
                <Input
                  type="number"
                  min={1}
                  max={168}
                  value={queueSettings.min_time_between_skips_hours}
                  onChange={(e) => setQueueSettings({ ...queueSettings, min_time_between_skips_hours: parseInt(e.target.value) || 24 })}
                  className="h-10 rounded-xl w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Prevents members from skipping too frequently
                </p>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Notification Settings */}
        <SlideInCard direction="up" delay={0.3}>
          <Card className="border-0 shadow-xl rounded-[2rem]">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-blue-500" />
                Notifications
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold">Remind Before Due (hours)</Label>
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={taskSettings.notification_before_due}
                  onChange={(e) => setTaskSettings({ ...taskSettings, notification_before_due: parseInt(e.target.value) || 24 })}
                  className="h-12 rounded-xl w-32"
                />
                <p className="text-xs text-muted-foreground">
                  Send reminder notifications this many hours before task due date
                </p>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>

        {/* Share Link */}
        <SlideInCard direction="up" delay={0.35}>
          <Card className="border-0 shadow-xl rounded-[2rem] bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-primary" />
                Invite Members
              </CardTitle>
              <CardDescription>Share this link to invite new members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  value={space ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${space.invite_code}` : ''}
                  readOnly
                  className="h-12 rounded-xl font-mono bg-background"
                />
                <Button onClick={copyInviteLink} className="h-12 px-6 rounded-xl gap-2">
                  <Copy className="h-5 w-5" />
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </SlideInCard>
      </div>
    </div>
  );
}
