'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Bell, Shield, Eye, Smartphone } from 'lucide-react';

export default function PreferencesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    publicProfile: true,
    twoFactor: false,
  });

  const handleSave = async () => {
    setLoading(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    toast.success('Preferences saved successfully');
  };

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground">
          Manage your account settings and notification preferences.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Choose how you want to be notified about task updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive updates about your tasks via email.
                </span>
              </Label>
              <Switch
                id="email-notifications"
                checked={prefs.emailNotifications}
                onCheckedChange={(checked) => setPrefs({ ...prefs, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                <span>Push Notifications</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Receive real-time alerts on your device.
                </span>
              </Label>
              <Switch
                id="push-notifications"
                checked={prefs.pushNotifications}
                onCheckedChange={(checked) => setPrefs({ ...prefs, pushNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Privacy & Security</CardTitle>
            </div>
            <CardDescription>
              Control your visibility and account security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="public-profile" className="flex flex-col space-y-1">
                <span>Public Profile</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Allow other members to see your completed tasks.
                </span>
              </Label>
              <Switch
                id="public-profile"
                checked={prefs.publicProfile}
                onCheckedChange={(checked) => setPrefs({ ...prefs, publicProfile: checked })}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="2fa" className="flex flex-col space-y-1">
                <span>Two-Factor Authentication</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Add an extra layer of security to your account.
                </span>
              </Label>
              <Switch
                id="2fa"
                checked={prefs.twoFactor}
                onCheckedChange={(checked) => setPrefs({ ...prefs, twoFactor: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
