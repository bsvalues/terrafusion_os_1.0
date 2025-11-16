import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Key,
  Palette,
  Globe,
  Save,
  Refresh,
  Download,
 } from '@mui/icons-material';

export default function Settings() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div><>

          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p
</> className="text-slate-600">
            Manage your account, preferences, and system configuration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><>

            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button
</>>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><>

                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <Input
</> defaultValue="John" />
                </div>
                <div><>

                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <Input
</> defaultValue="Doe" />
                </div>
              </div>
              <div><>

                <label className="block text-sm font-medium mb-2">Email Address</label>
                <Input
</> defaultValue="john.doe@terrafusion.com" />
              </div>
              <div><>

                <label className="block text-sm font-medium mb-2">License Number</label>
                <Input
</> defaultValue="CA-12345678" />
              </div>
              <div><>

                <label className="block text-sm font-medium mb-2">Organization</label>
                <Input
</> defaultValue="Terrafusion Appraisals" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-purple-600" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Email Notifications</div>
                  <div
</> className="text-sm text-slate-500">Receive updates via email</div>
                </div><>

                <Switch defaultChecked />
              </div>
              <div
</> className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Order Alerts</div>
                  <div
</> className="text-sm text-slate-500">New order notifications</div>
                </div><>

                <Switch defaultChecked />
              </div>
              <div
</> className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Compliance Warnings</div>
                  <div
</> className="text-sm text-slate-500">Compliance issue alerts</div>
                </div><>

                <Switch defaultChecked />
              </div>
              <div
</> className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">AI Insights</div>
                  <div
</> className="text-sm text-slate-500">
                    AI-generated insights and suggestions
                  </div>
                </div><>

                <Switch defaultChecked />
              </div>
              <div
</> className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Market Updates</div>
                  <div
</> className="text-sm text-slate-500">Weekly market trend reports</div>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-green-600" />
                System Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div><>

                <label className="block text-sm font-medium mb-2">Default Report Template</label>
                <select
</> className="w-full p-2 border border-slate-300 rounded-md"><>

                  <option>FNMA 1004 Standard</option>
                  <option
</>>FHA Report Format</option><>

                  <option>VA Appraisal Form</option>
                  <option
</>>Commercial Template</option>
                </select>
              </div>
              <div><>

                <label className="block text-sm font-medium mb-2">Auto-save Interval</label>
                <select
</> className="w-full p-2 border border-slate-300 rounded-md"><>

                  <option>Every 30 seconds</option>
                  <option
</>>Every 1 minute</option><>

                  <option>Every 5 minutes</option>
                  <option
</>>Manual save only</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Auto AI Analysis</div>
                  <div
</> className="text-sm text-slate-500">Run AI analysis on new properties</div>
                </div><>

                <Switch defaultChecked />
              </div>
              <div
</> className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Smart Comp Selection</div>
                  <div
</> className="text-sm text-slate-500">AI-powered comparable selection</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-600" />
                Data & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Data Encryption</div>
                  <div
</> className="text-sm text-slate-500">Encrypt all stored data</div>
                </div>
                <Badge className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Backup Frequency</div>
                  <div
</> className="text-sm text-slate-500">Automatic data backups</div>
                </div>
                <select className="p-1 border border-slate-300 rounded text-sm"><>

                  <option>Daily</option>
                  <option
</>>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div><>

                  <div className="font-medium">Data Retention</div>
                  <div
</> className="text-sm text-slate-500">Keep completed reports for</div>
                </div>
                <select className="p-1 border border-slate-300 rounded text-sm"><>

                  <option>7 years</option>
                  <option
</>>5 years</option>
                  <option>3 years</option>
                </select>
              </div>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start"><>

                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
</> variant="outline" className="w-full justify-start"><>

                <Refresh className="h-4 w-4 mr-2" />
                Reset Preferences
              </Button>
              <Button
</> variant="outline" className="w-full justify-start"><>

                <Globe className="h-4 w-4 mr-2" />
                Language Settings
              </Button>
              <Button
</> variant="outline" className="w-full justify-start">
                <Palette className="h-4 w-4 mr-2" />
                Theme Options
              </Button>
            </CardContent>
          </Card>

          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Security Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Two-Factor Auth</span>
                <Badge
</> className="bg-green-100 text-green-800">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Password Strength</span>
                <Badge
</> className="bg-green-100 text-green-800">Strong</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Last Password Change</span>
                <span
</> className="text-xs text-slate-500">30 days ago</span>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Session Timeout</span>
                <span
</> className="text-xs text-slate-500">8 hours</span>
              </div>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between"><>

                <span className="text-sm">MLS Connection</span>
                <Badge
</> className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">AI Engine</span>
                <Badge
</> className="bg-green-100 text-green-800">Active</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Cloud Storage</span>
                <Badge
</> className="bg-green-100 text-green-800">Synced</Badge>
              </div>
              <div className="flex items-center justify-between"><>

                <span className="text-sm">Email Service</span>
                <Badge
</> className="bg-yellow-100 text-yellow-800">Limited</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between"><>

                <span className="text-sm">Reports Created</span>
                <span
</> className="font-semibold">47</span>
              </div>
              <div className="flex justify-between"><>

                <span className="text-sm">AI Analyses</span>
                <span
</> className="font-semibold">134</span>
              </div>
              <div className="flex justify-between"><>

                <span className="text-sm">Photos Uploaded</span>
                <span
</> className="font-semibold">892</span>
              </div>
              <div className="flex justify-between"><>

                <span className="text-sm">Storage Used</span>
                <span
</> className="font-semibold">2.4 GB</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
