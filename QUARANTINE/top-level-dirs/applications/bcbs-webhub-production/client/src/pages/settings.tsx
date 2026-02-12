import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Bell, 
  Shield, 
  Palette, 
  Database, 
  Users, 
  FileText, 
  Mail, 
  Globe, 
  Clock,
  Save,
  Refresh,
  Download,
  Upload,
  Trash2,
  Warning
 } from '@mui/icons-material';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // General settings
    theme: "system",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/dd/yyyy",
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: false,
    auditStatusUpdates: true,
    deadlineReminders: true,
    systemAlerts: true,
    
    // Security settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    
    // Audit workflow settings
    defaultPriority: "medium",
    autoAssignment: false,
    approvalWorkflow: true,
    documentRetention: 7,
    
    // System settings
    backupFrequency: "daily",
    logLevel: "info",
    maxFileSize: 50,
    concurrentAudits: 10
  });

  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: `${section} settings have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSettings = () => {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-hub-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings exported",
      description: "Settings have been exported to your downloads folder.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          setSettings({ ...settings, ...importedSettings });
          toast({
            title: "Settings imported",
            description: "Settings have been imported successfully.",
          });
        } catch (error) {
          toast({
            title: "Import failed",
            description: "Invalid settings file format.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  if (!user) {
    return (
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Alert className="mb-6">
          <Warning className="h-4 w-4" />
          <AlertDescription>
            Settings page requires authentication. In development mode, some features may be limited.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div><>

          <h1 className="text-3xl font-bold">Settings</h1>
          <p
</>

className="text-muted-foreground">Manage your County Audit Hub preferences and configuration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportSettings}><>

            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
</>

variant="outline" onClick={() => document.getElementById('import-settings')?.click()}><>

            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
</>

            id="import-settings"
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2"><>

            <Globe className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger
</>

value="notifications" className="flex items-center gap-2"><>

            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
</>

value="security" className="flex items-center gap-2"><>

            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
</>

value="workflow" className="flex items-center gap-2"><>

            <FileText className="h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger
</>

value="system" className="flex items-center gap-2"><>

            <Database className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger
</>

value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader><>

              <CardTitle>General Settings</CardTitle>
              <CardDescription
</>

</>>
                Configure basic application preferences and regional settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><>

                  <Label htmlFor="language">Language</Label>
                  <Select
</>

value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="en">English</SelectItem>
                      <SelectItem
</>

value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
</>

value={settings.timezone} onValueChange={(value) => setSettings({...settings, timezone: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem
</>

value="America/Chicago">Central Time</SelectItem><>

                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem
</>

value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
</>

value={settings.dateFormat} onValueChange={(value) => setSettings({...settings, dateFormat: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem
</>

value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="theme">Theme</Label>
                  <Select
</>

value={settings.theme} onValueChange={(value) => setSettings({...settings /* , theme */: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem
</>

value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <Button onClick={() => handleSave("General")} disabled={loading}>
                {loading ? <Refresh className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader><>

              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription
</>

</>>
                Control how and when you receive notifications about audit activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Email Notifications</Label>
                    <p
</>

className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div><>

                  <Switch 
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>
                
                <div
</>

className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Push Notifications</Label>
                    <p
</>

className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div><>

                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                  />
                </div>
                
                <div
</>

className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Audit Status Updates</Label>
                    <p
</>

className="text-sm text-muted-foreground">Get notified when audit status changes</p>
                  </div><>

                  <Switch 
                    checked={settings.auditStatusUpdates}
                    onCheckedChange={(checked) => setSettings({...settings, auditStatusUpdates: checked})}
                  />
                </div>
                
                <div
</>

className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Deadline Reminders</Label>
                    <p
</>

className="text-sm text-muted-foreground">Receive reminders for upcoming deadlines</p>
                  </div><>

                  <Switch 
                    checked={settings.deadlineReminders}
                    onCheckedChange={(checked) => setSettings({...settings, deadlineReminders: checked})}
                  />
                </div>
                
                <div
</>

className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>System Alerts</Label>
                    <p
</>

className="text-sm text-muted-foreground">Important system notifications and alerts</p>
                  </div>
                  <Switch 
                    checked={settings.systemAlerts}
                    onCheckedChange={(checked) => setSettings({...settings, systemAlerts: checked})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <Button onClick={() => handleSave("Notifications")} disabled={loading}>
                {loading ? <Refresh className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader><>

              <CardTitle>Security Settings</CardTitle>
              <CardDescription
</>

</>>
                Manage security features and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Two-Factor Authentication</Label>
                    <p
</>

className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                  </div><>

                  <Switch 
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                  />
                </div>
                
                <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><>

                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
</>

                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value) || 30})}
                    />
                  </div>
                  
                  <div className="space-y-2"><>

                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input
</>

                      id="passwordExpiry"
                      type="number"
                      value={settings.passwordExpiry}
                      onChange={(e) => setSettings({...settings, passwordExpiry: parseInt(e.target.value) || 90})}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4"><>

                <h4 className="font-medium">Security Status</h4>
                <div
</>

className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2"><>

                    <Badge variant={settings.twoFactorAuth ? "default" : "secondary"}>
                      {settings.twoFactorAuth ? "Enabled" : "Disabled"}
                    </Badge>
                    <span
</>

className="text-sm">2FA</span>
                  </div>
                  <div className="flex items-center gap-2"><>

                    <Badge variant="default">Active</Badge>
                    <span
</>

className="text-sm">SSL Certificate</span>
                  </div>
                  <div className="flex items-center gap-2"><>

                    <Badge variant="default">Up to date</Badge>
                    <span
</>

className="text-sm">Security Patches</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <Button onClick={() => handleSave("Security")} disabled={loading}>
                {loading ? <Refresh className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Settings */}
        <TabsContent value="workflow">
          <Card>
            <CardHeader><>

              <CardTitle>Audit Workflow Settings</CardTitle>
              <CardDescription
</>

</>>
                Configure default settings for audit processes and workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><>

                  <Label htmlFor="defaultPriority">Default Audit Priority</Label>
                  <Select
</>

value={settings.defaultPriority} onValueChange={(value) => setSettings({...settings, defaultPriority: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem
</>

value="medium">Medium</SelectItem><>

                      <SelectItem value="high">High</SelectItem>
                      <SelectItem
</>

value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="documentRetention">Document Retention (years)</Label>
                  <Input
</>

                    id="documentRetention"
                    type="number"
                    value={settings.documentRetention}
                    onChange={(e) => setSettings({...settings, documentRetention: parseInt(e.target.value) || 7})}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Auto-Assignment</Label>
                    <p
</>

className="text-sm text-muted-foreground">Automatically assign audits to available auditors</p>
                  </div><>

                  <Switch 
                    checked={settings.autoAssignment}
                    onCheckedChange={(checked) => setSettings({...settings, autoAssignment: checked})}
                  />
                </div>
                
                <div
</>

className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label>Approval Workflow</Label>
                    <p
</>

className="text-sm text-muted-foreground">Require supervisor approval for audit completion</p>
                  </div>
                  <Switch 
                    checked={settings.approvalWorkflow}
                    onCheckedChange={(checked) => setSettings({...settings, approvalWorkflow: checked})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <Button onClick={() => handleSave("Workflow")} disabled={loading}>
                {loading ? <Refresh className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Workflow Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader><>

              <CardTitle>System Configuration</CardTitle>
              <CardDescription
</>

</>>
                Advanced system settings and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><>

                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
</>

value={settings.backupFrequency} onValueChange={(value) => setSettings({...settings, backupFrequency: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem
</>

value="daily">Daily</SelectItem><>

                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem
</>

value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="logLevel">System Log Level</Label>
                  <Select
</>

value={settings.logLevel} onValueChange={(value) => setSettings({...settings, logLevel: value})}>
                    <SelectTrigger><>

                      <SelectValue placeholder="Select log level" />
                    </SelectTrigger>
                    <SelectContent
</>

</>><>

                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem
</>

value="warn">Warning</SelectItem><>

                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem
</>

value="debug">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
</>

                    id="maxFileSize"
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value) || 50})}
                  />
                </div>
                
                <div className="space-y-2"><>

                  <Label htmlFor="concurrentAudits">Max Concurrent Audits</Label>
                  <Input
</>

                    id="concurrentAudits"
                    type="number"
                    value={settings.concurrentAudits}
                    onChange={(e) => setSettings({...settings, concurrentAudits: parseInt(e.target.value) || 10})}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4"><>

                <h4 className="font-medium">System Status</h4>
                <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2"><>

                      <span className="text-sm font-medium">Database</span>
                      <Badge
</>

variant="default">Online</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Last backup: 2 hours ago</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2"><>

                      <span className="text-sm font-medium">File Storage</span>
                      <Badge
</>

variant="default">Healthy</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Usage: 45% of 1TB</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex gap-2">
                <Button onClick={() => handleSave("System")} disabled={loading}>
                  {loading ? <Refresh className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save System Settings
                </Button>
                <Button variant="outline" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader><>

              <CardTitle>Appearance & UI</CardTitle>
              <CardDescription
</>

</>>
                Customize the look and feel of your audit hub interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4"><>

                  <h4 className="font-medium">Theme Selection</h4>
                  <div
</>

className="grid grid-cols-3 gap-2">
                    {["light", "dark", "system"].map((theme) => (
                      <button
                        key={theme}
                        onClick={() => setSettings({...settings, theme})}
                        className={`p-3 border rounded-lg text-sm capitalize ${
                          settings.theme === theme ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4"><>

                  <h4 className="font-medium">Color Scheme</h4>
                  <div
</>

className="grid grid-cols-4 gap-2">
                    {["blue", "green", "purple", "orange"].map((color) => (
                      <button
                        key={color}
                        className={`h-10 rounded-lg bg-${color}-500 hover:bg-${color}-600`}
                        title={`${color} theme`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4"><>

                <h4 className="font-medium">Dashboard Layout</h4>
                <div
</>

className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg"><>

                    <h5 className="font-medium mb-2">Compact View</h5>
                    <p
</>

className="text-sm text-muted-foreground mb-3">Dense layout with more information per screen</p>
                    <div className="h-20 bg-muted rounded border-2 border-dashed border-muted-foreground/20"></div>
                  </div>
                  
                  <div className="p-4 border rounded-lg"><>

                    <h5 className="font-medium mb-2">Comfortable View</h5>
                    <p
</>

className="text-sm text-muted-foreground mb-3">Spacious layout with better readability</p>
                    <div className="h-20 bg-muted rounded border-2 border-dashed border-muted-foreground/20"></div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <Button onClick={() => handleSave("Appearance")} disabled={loading}>
                {loading ? <Refresh className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Appearance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}