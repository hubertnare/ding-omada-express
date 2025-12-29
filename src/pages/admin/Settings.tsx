import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { UserPlus, Trash2, Shield } from 'lucide-react';

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  profiles: {
    email: string | null;
  } | null;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Default settings
  const [settings, setSettings] = useState({
    defaultStatusMapping: {
      Expired: 'active',
      Active: 'active',
      Used: 'sold',
    },
    duplicateHandling: 'skip',
    autoActivate: true,
  });

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin')
        .order('role');

      if (error) throw error;

      // Fetch profiles for each role
      const rolesWithProfiles = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('user_id', role.user_id)
            .maybeSingle();
          return { ...role, profiles: profile };
        })
      );

      setUserRoles(rolesWithProfiles as UserRole[]);
    } catch (err: any) {
      console.error('Error fetching user roles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsAddingAdmin(true);
    try {
      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', newAdminEmail.trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast.error('No user found with that email. They must sign up first.');
        return;
      }

      // Check if already admin
      const existing = userRoles.find((r) => r.user_id === profile.user_id && r.role === 'admin');
      if (existing) {
        toast.error('This user is already an admin');
        return;
      }

      // Add admin role
      const { error } = await supabase.from('user_roles').insert({
        user_id: profile.user_id,
        role: 'admin',
      });

      if (error) throw error;

      toast.success('Admin added successfully');
      setNewAdminEmail('');
      fetchUserRoles();
    } catch (err: any) {
      console.error('Error adding admin:', err);
      toast.error(err.message || 'Failed to add admin');
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const removeRole = async (roleId: string, userId: string) => {
    if (userId === user?.id) {
      toast.error("You can't remove your own admin role");
      return;
    }

    if (!confirm('Remove this admin?')) return;

    try {
      const { error } = await supabase.from('user_roles').delete().eq('id', roleId);

      if (error) throw error;

      toast.success('Admin removed');
      fetchUserRoles();
    } catch (err: any) {
      toast.error('Failed to remove admin');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure admin portal settings</p>
        </div>

        {/* Admin Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-admin-blue" />
              Admin Users
            </CardTitle>
            <CardDescription>
              Manage who has access to the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Admin */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter user email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={addAdmin}
                disabled={isAddingAdmin}
                className="bg-admin-blue hover:bg-admin-blue/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            </div>

            {/* Admin List */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : userRoles.filter((r) => r.role === 'admin').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                        No admins found
                      </TableCell>
                    </TableRow>
                  ) : (
                    userRoles
                      .filter((r) => r.role === 'admin')
                      .map((role) => (
                        <TableRow key={role.id}>
                          <TableCell>
                            {role.profiles?.email || 'Unknown'}
                            {role.user_id === user?.id && (
                              <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-admin-blue/10 text-admin-blue">
                              Admin
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeRole(role.id, role.user_id)}
                              disabled={role.user_id === user?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Default Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Default Upload Settings</CardTitle>
            <CardDescription>
              Configure default settings for CSV uploads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duplicate Handling */}
            <div className="space-y-2">
              <Label>Duplicate Handling</Label>
              <Select
                value={settings.duplicateHandling}
                onValueChange={(v) => setSettings({ ...settings, duplicateHandling: v })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="skip">Skip duplicates (keep existing)</SelectItem>
                  <SelectItem value="overwrite">Overwrite duplicates</SelectItem>
                  <SelectItem value="stop">Stop processing on duplicate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto Activate */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-activate vouchers</Label>
                <p className="text-xs text-muted-foreground">
                  Activate all uploaded vouchers by default
                </p>
              </div>
              <Switch
                checked={settings.autoActivate}
                onCheckedChange={(v) => setSettings({ ...settings, autoActivate: v })}
              />
            </div>

            <Button variant="outline" className="w-full" onClick={() => toast.success('Settings saved')}>
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
