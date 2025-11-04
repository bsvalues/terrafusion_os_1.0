/**
 * TerraFusion Login Component
 * Government-grade authentication interface with MFA support
 */

'use client';

import React, { useState } from 'react';
import { useAuth, type LoginCredentials } from '@/lib/auth/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface LoginFormState {
  email: string;
  password: string;
  mfa_code: string;
  showPassword: boolean;
  showMfa: boolean;
}

export function LoginForm() {
  const { state, login, clearError } = useAuth();
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    mfa_code: '',
    showPassword: false,
    showMfa: false,
  });

  const updateFormState = (field: keyof LoginFormState, value: string | boolean) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const credentials: LoginCredentials = {
      email: formState.email,
      password: formState.password,
    };

    if (formState.mfa_code) {
      credentials.mfa_code = formState.mfa_code;
    }

    // Generate device fingerprint (simplified)
    credentials.device_fingerprint = generateDeviceFingerprint();

    await login(credentials);
  };

  const generateDeviceFingerprint = (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('TerraFusion fingerprint', 2, 2);
    }
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL(),
    ].join('|');

    return btoa(fingerprint).substring(0, 32);
  };

  const isFormValid = formState.email && formState.password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md space-y-6 p-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">TerraFusion</h1>
          </div>
          <p className="text-slate-400">Government Command Portal</p>
          <div className="flex items-center justify-center space-x-2 text-xs text-green-400">
            <CheckCircle className="h-3 w-3" />
            <span>Secure Federal Authentication</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to access the command portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {state.error && (
              <Alert variant="destructive" className="border-red-800 bg-red-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@agency.gov"
                  value={formState.email}
                  onChange={(e) => updateFormState('email', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={formState.showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formState.password}
                    onChange={(e) => updateFormState('password', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => updateFormState('showPassword', !formState.showPassword)}
                  >
                    {formState.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* MFA Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enable-mfa"
                  checked={formState.showMfa}
                  onChange={(e) => updateFormState('showMfa', e.target.checked)}
                  className="rounded border-slate-600 bg-slate-700"
                />
                <Label htmlFor="enable-mfa" className="text-sm text-slate-300">
                  Use Multi-Factor Authentication
                </Label>
              </div>

              {/* MFA Code Field */}
              {formState.showMfa && (
                <div className="space-y-2">
                  <Label htmlFor="mfa_code" className="text-white">MFA Code</Label>
                  <Input
                    id="mfa_code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formState.mfa_code}
                    onChange={(e) => updateFormState('mfa_code', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    maxLength={6}
                  />
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!isFormValid || state.loading}
              >
                {state.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Demo Credentials:</p>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Email: admin@terrafusion.gov</div>
                <div>Password: admin123</div>
                <div className="text-green-400">MFA Code: 123456 (optional)</div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="text-xs text-slate-500 text-center space-y-1">
              <p>⚡ End-to-end encrypted communication</p>
              <p>🔐 Government-grade security standards</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2025 TerraFusion Command Portal</p>
          <p>Authorized Government Personnel Only</p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;