import React, { useState } from "react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Save,
  User,
  Bell,
  Shield,
  Cloud,
  Database,
  Smartphone,
  PaintBucket,
  Keyboard,
  Mail,
  Refresh,
  Clock,
  LogOut,
  FileJson,
  Pin,
  Laptop,
  Home,
  FileText,
 } from '@mui/icons-material';
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [profileForm, setProfileForm] = useState({
    name: "John Appraiser",
    email: "john@appraisalexperts.com",
    title: "Senior Real Estate Appraiser",
    phone: "(555) 123-4567",
    company: "Appraisal Experts, LLC",
    licenseNumber: "RA12345678",
    address: "123 Main Street, Suite 200",
    city: "Cityville",
    state: "CA",
    zip: "90210",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    reminderNotifications: true,
    updateNotifications: true,
    inAppNotifications: true,
  });

  const [appSettings, setAppSettings] = useState({
    theme: "system",
    saveDataLocally: true,
    autoSaveInterval: "5",
    autoSyncEnabled: true,
    defaultView: "dashboard",
    dateFormat: "MM/DD/YYYY",
    currencyFormat: "USD",
    showTips: true,
    developerMode: false,
  });

  const [apiSettings, setApiSettings] = useState({
    aiProvider: "auto",
    openAIKey: "",
    anthropicKey: "",
    showAIFeatures: true,
    aiComplianceChecks: true,
    aiValuationAssistance: true,
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings({
      ...notificationSettings,
      [key]: value,
    });
  };

  const handleAppSettingChange = (key: string, value: any) => {
    setAppSettings({
      ...appSettings,
      [key]: value,
    });
  };

  const handleApiSettingChange = (key: string, value: any) => {
    setApiSettings({
      ...apiSettings,
      [key]: value,
    });
  };

  return (
    <PageLayout title="Settings" description="Configure your Terrafusion platform preferences">
      <Tabs defaultValue="profile" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-4"><>

          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger
</> value="notifications">Notifications</TabsTrigger><>

          <TabsTrigger value="app">App Settings</TabsTrigger>
          <TabsTrigger
</> value="integration">Integrations</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader><>

              <CardTitle>Profile Information</CardTitle>
              <CardDescription
</>>Update your personal and professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center"><>

                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <div
</>><>

                  <h3 className="font-medium text-lg mb-1">{profileForm.name}</h3>
                  <p
</> className="text-muted-foreground text-sm mb-2">{profileForm.title}</p>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><>

                  <Label htmlFor="name">Full Name</Label>
                  <Input
</>
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="email">Email Address</Label>
                  <Input
</>
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="title">Job Title</Label>
                  <Input
</>
                    id="title"
                    name="title"
                    value={profileForm.title}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
</>
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="company">Company</Label>
                  <Input
</>
                    id="company"
                    name="company"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
</>
                    id="licenseNumber"
                    name="licenseNumber"
                    value={profileForm.licenseNumber}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="space-y-2"><>

                  <Label htmlFor="address">Address</Label>
                  <Input
</>
                    id="address"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2"><>

                    <Label htmlFor="city">City</Label>
                    <Input
</>
                      id="city"
                      name="city"
                      value={profileForm.city}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="state">State</Label>
                    <Input
</>
                      id="state"
                      name="state"
                      value={profileForm.state}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="space-y-2"><>

                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
</>
                      id="zip"
                      name="zip"
                      value={profileForm.zip}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between"><>

              <Button variant="outline">Cancel</Button>
              <Button
</> onClick={handleSaveProfile}>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader><>

              <CardTitle>Account Security</CardTitle>
              <CardDescription
</>>Update your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><>

                <Label htmlFor="current-password">Current Password</Label>
                <Input
</> id="current-password" type="password" />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="new-password">New Password</Label>
                <Input
</> id="new-password" type="password" />
              </div>
              <div className="space-y-2"><>

                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
</> id="confirm-password" type="password" />
              </div>

              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label htmlFor="two-factor">Two-factor Authentication</Label>
                    <p
</> className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div><>

                  <Switch id="two-factor" />
                </div>

                <div
</> className="flex items-center justify-between">
                  <div className="space-y-0.5"><>

                    <Label htmlFor="session-timeout">Session Timeout</Label>
                    <p
</> className="text-sm text-muted-foreground">
                      Automatically log out after a period of inactivity
                    </p>
                  </div>
                  <Select defaultValue="60">
                    <SelectTrigger className="w-[180px]"><>

                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem
</> value="30">30 minutes</SelectItem><>

                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem
</> value="120">2 hours</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="ml-auto">
                <Shield className="mr-2 h-4 w-4" />
                Update Security Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader><>

              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription
</>>Customize how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <Label htmlFor="emailNotifications" className="flex items-center"><>

                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    Email Notifications
                  </Label>
                  <p
</> className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div><>

                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(value) => handleNotificationChange("emailNotifications", value)}
                />
              </div>

              <div
</> className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <Label htmlFor="pushNotifications" className="flex items-center"><>

                    <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
                    Push Notifications
                  </Label>
                  <p
</> className="text-sm text-muted-foreground">
                    Receive push notifications in your browser and mobile app
                  </p>
                </div><>

                <Switch
                  id="pushNotifications"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={(value) => handleNotificationChange("pushNotifications", value)}
                />
              </div>

              <div
</> className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <Label htmlFor="smsNotifications" className="flex items-center"><>

                    <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
                    SMS Notifications
                  </Label>
                  <p
</> className="text-sm text-muted-foreground">
                    Receive important alerts via text message
                  </p>
                </div><>

                <Switch
                  id="smsNotifications"
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(value) => handleNotificationChange("smsNotifications", value)}
                />
              </div>

              <div
</> className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <Label htmlFor="reminderNotifications" className="flex items-center"><>

                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    Reminders
                  </Label>
                  <p
</> className="text-sm text-muted-foreground">
                    Receive reminders for deadlines and tasks
                  </p>
                </div><>

                <Switch
                  id="reminderNotifications"
                  checked={notificationSettings.reminderNotifications}
                  onCheckedChange={(value) =>
                    handleNotificationChange("reminderNotifications", value)
                  }
                />
              </div>

              <div
</> className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <Label htmlFor="updateNotifications" className="flex items-center"><>

                    <Refresh className="h-4 w-4 mr-2 text-muted-foreground" />
                    Updates & News
                  </Label>
                  <p
</> className="text-sm text-muted-foreground">
                    Receive updates about new features and platform news
                  </p>
                </div>
                <Switch
                  id="updateNotifications"
                  checked={notificationSettings.updateNotifications}
                  onCheckedChange={(value) =>
                    handleNotificationChange("updateNotifications", value)
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  toast({
                    title: "Notification settings saved",
                    description: "Your notification preferences have been updated.",
                  });
                }}
                className="ml-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* App Settings Tab */}
        <TabsContent value="app">
          <Card>
            <CardHeader><>

              <CardTitle>App Settings</CardTitle>
              <CardDescription
</>>Customize your Terrafusion experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2"><>

                    <Label htmlFor="theme">Theme</Label>
                    <Select
</>
                      value={appSettings.theme}
                      onValueChange={(value) => handleAppSettingChange("theme", value)}
                    >
                      <SelectTrigger className="w-full"><>

                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem
</> value="dark">Dark</SelectItem>
                        <SelectItem value="system">System Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2"><>

                    <Label htmlFor="default-view">Default View</Label>
                    <Select
</>
                      value={appSettings.defaultView}
                      onValueChange={(value) => handleAppSettingChange("defaultView", value)}
                    >
                      <SelectTrigger className="w-full"><>

                        <SelectValue placeholder="Select default view" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem
</> value="reports">Reports</SelectItem><>

                        <SelectItem value="properties">Properties</SelectItem>
                        <SelectItem
</> value="workflow">Workflow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2"><>

                    <Label htmlFor="date-format">Date Format</Label>
                    <Select
</>
                      value={appSettings.dateFormat}
                      onValueChange={(value) => handleAppSettingChange("dateFormat", value)}
                    >
                      <SelectTrigger className="w-full"><>

                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem
</> value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2"><>

                    <Label htmlFor="currency-format">Currency Format</Label>
                    <Select
</>
                      value={appSettings.currencyFormat}
                      onValueChange={(value) => handleAppSettingChange("currencyFormat", value)}
                    >
                      <SelectTrigger className="w-full"><>

                        <SelectValue placeholder="Select currency format" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem
</> value="EUR">EUR (€)</SelectItem><>

                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem
</> value="CAD">CAD (C$)</SelectItem>
                        <SelectItem value="AUD">AUD (A$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="space-y-0.5"><>

                      <Label htmlFor="save-locally">Save Data Locally</Label>
                      <p
</> className="text-sm text-muted-foreground">
                        Cache data locally for offline access
                      </p>
                    </div><>

                    <Switch
                      id="save-locally"
                      checked={appSettings.saveDataLocally}
                      onCheckedChange={(value) => handleAppSettingChange("saveDataLocally", value)}
                    />
                  </div>

                  <div
</> className="flex items-center justify-between py-2">
                    <div className="space-y-0.5"><>

                      <Label htmlFor="auto-sync">Auto Sync</Label>
                      <p
</> className="text-sm text-muted-foreground">
                        Automatically sync changes when online
                      </p>
                    </div><>

                    <Switch
                      id="auto-sync"
                      checked={appSettings.autoSyncEnabled}
                      onCheckedChange={(value) => handleAppSettingChange("autoSyncEnabled", value)}
                    />
                  </div>

                  <div
</> className="flex items-center justify-between py-2">
                    <div className="space-y-0.5"><>

                      <Label htmlFor="show-tips">Show Tips</Label>
                      <p
</> className="text-sm text-muted-foreground">
                        Display helpful tips and tutorials
                      </p>
                    </div><>

                    <Switch
                      id="show-tips"
                      checked={appSettings.showTips}
                      onCheckedChange={(value) => handleAppSettingChange("showTips", value)}
                    />
                  </div>

                  <div
</> className="flex items-center justify-between py-2">
                    <div className="space-y-0.5"><>

                      <Label htmlFor="dev-mode">Developer Mode</Label>
                      <p
</> className="text-sm text-muted-foreground">
                        Enable advanced developer features
                      </p>
                    </div><>

                    <Switch
                      id="dev-mode"
                      checked={appSettings.developerMode}
                      onCheckedChange={(value) => handleAppSettingChange("developerMode", value)}
                    />
                  </div>

                  <div
</> className="space-y-2 pt-2"><>

                    <Label htmlFor="save-interval">Auto Save Interval (minutes)</Label>
                    <Select
</>
                      value={appSettings.autoSaveInterval}
                      onValueChange={(value) => handleAppSettingChange("autoSaveInterval", value)}
                    >
                      <SelectTrigger className="w-full"><>

                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent
</>><>

                        <SelectItem value="1">1 minute</SelectItem>
                        <SelectItem
</> value="5">5 minutes</SelectItem><>

                        <SelectItem value="10">10 minutes</SelectItem>
                        <SelectItem
</> value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t"><>

                <h3 className="font-medium mb-2">Data Management</h3>
                <div
</> className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm"><>

                    <Database className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                  <Button
</> variant="outline" size="sm"><>

                    <Cloud className="mr-2 h-4 w-4" />
                    Sync Now
                  </Button>
                  <Button
</> variant="outline" size="sm"><>

                    <FileJson className="mr-2 h-4 w-4" />
                    Import Templates
                  </Button>
                  <Button
</> variant="outline" size="sm" className="text-destructive">
                    Clear Local Cache
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  toast({
                    title: "App settings saved",
                    description: "Your application settings have been updated.",
                  });
                }}
                className="ml-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save App Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integration">
          <Card>
            <CardHeader><>

              <CardTitle>AI Integration Settings</CardTitle>
              <CardDescription
</>>Configure AI services and API keys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><>

                <Label htmlFor="ai-provider">Default AI Provider</Label>
                <Select
</>
                  value={apiSettings.aiProvider}
                  onValueChange={(value) => handleApiSettingChange("aiProvider", value)}
                >
                  <SelectTrigger><>

                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent
</>><>

                    <SelectItem value="auto">Auto (Best Available)</SelectItem>
                    <SelectItem
</> value="openai">OpenAI</SelectItem><>

                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem
</> value="hf">Hugging Face</SelectItem>
                    <SelectItem value="local">Local Models</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <Input
</>
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={apiSettings.openAIKey}
                  onChange={(e) => handleApiSettingChange("openAIKey", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for AI valuation, market analysis, and report generation
                </p>
              </div>

              <div className="space-y-2"><>

                <Label htmlFor="anthropic-key">Anthropic API Key (Claude)</Label>
                <Input
</>
                  id="anthropic-key"
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiSettings.anthropicKey}
                  onChange={(e) => handleApiSettingChange("anthropicKey", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for narrative generation and document parsing
                </p>
              </div>

              <div className="flex flex-col space-y-4 mt-4"><>

                <Label>AI Feature Settings</Label>
                <div
</> className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-ai-features"
                      checked={apiSettings.showAIFeatures}
                      onCheckedChange={(value) =>
                        handleApiSettingChange("showAIFeatures", Boolean(value))
                      }
                    />
                    <label
                      htmlFor="show-ai-features"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show AI Features in Interface
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-compliance"
                      checked={apiSettings.aiComplianceChecks}
                      onCheckedChange={(value) =>
                        handleApiSettingChange("aiComplianceChecks", Boolean(value))
                      }
                    />
                    <label
                      htmlFor="ai-compliance"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enable AI Compliance Checks
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ai-valuation"
                      checked={apiSettings.aiValuationAssistance}
                      onCheckedChange={(value) =>
                        handleApiSettingChange("aiValuationAssistance", Boolean(value))
                      }
                    />
                    <label
                      htmlFor="ai-valuation"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enable AI Valuation Assistance
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  toast({
                    title: "API settings saved",
                    description: "Your API settings have been updated.",
                  });
                }}
                className="ml-auto"
              >
                <Save className="mr-2 h-4 w-4" />
                Save API Settings
              </Button>
            </CardFooter>
          </Card>

          <Card className="mt-6">
            <CardHeader><>

              <CardTitle>External Systems Integration</CardTitle>
              <CardDescription
</>>
                Connect to external appraisal systems and data sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center mr-3"><>

                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div
</>><>

                        <h3 className="font-medium">Property Database</h3>
                        <p
</> className="text-sm text-muted-foreground">County records integration</p>
                      </div>
                    </div><>

                    <Switch id="county-records" />
                  </div>
                  <div
</> className="space-y-2"><>

                    <Label htmlFor="mls-api">API Endpoint</Label>
                    <Input
</> id="mls-api" placeholder="https://api.countyrecords.com/v1" />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-green-100 flex items-center justify-center mr-3"><>

                        <Home className="h-5 w-5 text-green-600" />
                      </div>
                      <div
</>><>

                        <h3 className="font-medium">MLS System</h3>
                        <p
</> className="text-sm text-muted-foreground">Real estate listing data</p>
                      </div>
                    </div><>

                    <Switch id="mls-integration" checked />
                  </div>
                  <div
</> className="space-y-2"><>

                    <Label htmlFor="mls-api">API Key</Label>
                    <Input
</> id="mls-api" type="password" placeholder="••••••••••••••••" />
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-purple-100 flex items-center justify-center mr-3"><>

                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div
</>><>

                        <h3 className="font-medium">Document Management</h3>
                        <p
</> className="text-sm text-muted-foreground">Cloud document storage</p>
                      </div>
                    </div><>

                    <Switch id="document-integration" />
                  </div>
                  <div
</> className="space-y-2">
                    <div className="flex gap-2"><>

                      <Button variant="outline" size="sm" className="flex-1">
                        Connect
                      </Button>
                      <Button
</> variant="outline" size="sm" className="flex-1">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded bg-orange-100 flex items-center justify-center mr-3"><>

                        <Smartphone className="h-5 w-5 text-orange-600" />
                      </div>
                      <div
</>><>

                        <h3 className="font-medium">TerraField Mobile</h3>
                        <p
</> className="text-sm text-muted-foreground">Field inspection app</p>
                      </div>
                    </div><>

                    <Switch id="terrafield-integration" checked />
                  </div>
                  <div
</> className="space-y-2"><>

                    <Label>Paired Devices</Label>
                    <div
</> className="text-sm">2 devices connected</div>
                    <Button variant="outline" size="sm">
                      Manage Devices
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="mr-auto"><>

                <Pin className="mr-2 h-4 w-4" />
                Test Connections
              </Button>
              <Button
</>>
                <Save className="mr-2 h-4 w-4" />
                Save Integration Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
