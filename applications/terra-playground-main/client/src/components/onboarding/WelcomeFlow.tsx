import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin,
  Building,
  BarChart3,
  Users,
  Zap,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  BookOpen,
  Sparkles,
  Star,
  ArrowRight,
  Brain,
  Globe,
  Shield,
  Clock,
 } from '@mui/icons-material';

interface UserRole {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  estimatedTime: string;
}

interface WelcomeFlowProps {
  onComplete: (selectedRole: string, preferences: any) => void;
  onSkip: () => void;
}

const WelcomeFlow: React.FC<WelcomeFlowProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [preferences, setPreferences] = useState({
    showTutorials: true,
    enableTips: true,
    complexityLevel: 'beginner',
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [, setLocation] = useLocation();

  const userRoles: UserRole[] = [
    {
      id: 'assessor',
      title: 'Property Assessor',
      description: 'Evaluate and assess property values for taxation and regulatory purposes',
      icon: <Building className="h-8 w-8" />,
      color: 'bg-blue-500',
      features: [
        'Property Search',
        'Valuation Tools',
        'Assessment Reports',
        'Comparables Analysis',
      ],
      estimatedTime: '5 min setup',
    },
    {
      id: 'administrator',
      title: 'County Administrator',
      description: 'Manage operations, oversee staff, and make strategic decisions',
      icon: <Users className="h-8 w-8" />,
      color: 'bg-purple-500',
      features: [
        'Dashboard Overview',
        'Team Management',
        'Performance Analytics',
        'System Settings',
      ],
      estimatedTime: '3 min setup',
    },
    {
      id: 'analyst',
      title: 'Data Analyst',
      description: 'Analyze trends, generate insights, and create comprehensive reports',
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'bg-emerald-500',
      features: ['Advanced Analytics', 'Data Visualization', 'Trend Analysis', 'Custom Reports'],
      estimatedTime: '7 min setup',
    },
    {
      id: 'appraiser',
      title: 'Property Appraiser',
      description: 'Conduct detailed property evaluations and market analysis',
      icon: <MapPin className="h-8 w-8" />,
      color: 'bg-orange-500',
      features: ['GIS Mapping', 'Market Analysis', 'Field Tools', 'Appraisal Reports'],
      estimatedTime: '6 min setup',
    },
    {
      id: 'explorer',
      title: 'New User / Explorer',
      description: 'Just getting started and want to explore all features gradually',
      icon: <Sparkles className="h-8 w-8" />,
      color: 'bg-pink-500',
      features: ['Guided Tours', 'Sample Data', 'Interactive Tutorials', 'Help Center'],
      estimatedTime: '2 min setup',
    },
  ];

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Terrafusion',
      description: 'The next-generation platform for property intelligence',
    },
    {
      id: 'role',
      title: 'Tell us about yourself',
      description: 'Choose your role to personalize your experience',
    },
    {
      id: 'preferences',
      title: 'Customize your experience',
      description: 'Set your preferences for the best experience',
    },
    {
      id: 'ready',
      title: "You're all set!",
      description: 'Ready to explore Terrafusion',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleComplete = () => {
    onComplete(selectedRole, preferences);
  };

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    handleNext();
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
<>
          <Globe className="h-10 w-10 text-white" />
        </div>
        <div
</> className="space-y-2">
<>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Terrafusion
          </h1>
          <p
</> className="text-xl text-muted-foreground">
            The most advanced platform for property intelligence and assessment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
<>
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3
</> className="font-semibold">AI-Powered Intelligence</h3>
          <p className="text-sm text-muted-foreground">
            Advanced AI agents help automate workflows and provide intelligent insights
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
<>
            <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3
</> className="font-semibold">Enterprise Security</h3>
          <p className="text-sm text-muted-foreground">
            Bank-grade security with role-based access and audit trails
          </p>
        </div>

        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
<>
            <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3
</> className="font-semibold">Lightning Fast</h3>
          <p className="text-sm text-muted-foreground">
            Optimized performance handles millions of properties seamlessly
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleNext}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Let's Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderRoleStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
<>
        <h2 className="text-3xl font-bold">What's your role?</h2>
        <p
</> className="text-lg text-muted-foreground">
          We'll customize Terrafusion to match your workflow and responsibilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {userRoles.map(role => (
          <Card
            key={role.id}
            className={cn(
              'cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
              'border-2 hover:border-primary'
            )}
            onClick={() => handleRoleSelect(role.id)}
          >
            <CardHeader className="text-center space-y-4">
<>
              <div
                className={cn(
                  'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-white',
                  role.color
                )}
              >
                {role.icon}
              </div>
              <div
</> className="space-y-2">
<>
                <CardTitle className="text-lg">{role.title}</CardTitle>
                <CardDescription
</> className="text-sm">{role.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {role.estimatedTime}
                </Badge>
              </div>
              <div className="space-y-2">
<>
                <p className="text-sm font-medium">Key Features:</p>
                <ul
</> className="text-xs text-muted-foreground space-y-1">
                  {role.features.map((feature /* , index */) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPreferencesStep = () => {
    const selectedRoleData = userRoles.find(r => r.id === selectedRole);

    return (
      <div className="space-y-8 max-w-2xl mx-auto">
        <div className="text-center space-y-4">
<>
          <div
            className={cn(
              'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center text-white',
              selectedRoleData?.color
            )}
          >
            {selectedRoleData?.icon}
          </div>
          <h2
</> className="text-3xl font-bold">Perfect! Let's customize your experience</h2>
          <p className="text-lg text-muted-foreground">
            We'll set up Terrafusion specifically for {selectedRoleData?.title.toLowerCase()}s
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
<>
              <CardTitle className="text-lg">Learning Preferences</CardTitle>
              <CardDescription
</>>How would you like to learn Terrafusion?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
<>
                  <p className="font-medium">Show interactive tutorials</p>
                  <p
</> className="text-sm text-muted-foreground">
                    Guide you through features step-by-step
                  </p>
                </div>
<>
                <input
                  type="checkbox"
                  checked={preferences.showTutorials}
                  onChange={e =>
                    setPreferences(prev => ({ ...prev, showTutorials: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
              </div>

              <div
</> className="flex items-center justify-between">
                <div className="space-y-1">
<>
                  <p className="font-medium">Enable helpful tips</p>
                  <p
</> className="text-sm text-muted-foreground">
                    Show contextual hints and suggestions
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.enableTips}
                  onChange={e =>
                    setPreferences(prev => ({ ...prev, enableTips: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
<>
              <CardTitle className="text-lg">Interface Complexity</CardTitle>
              <CardDescription
</>>Choose the right level of detail for your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    id: 'beginner',
                    label: 'Beginner',
                    desc: 'Simple interface with essential features only',
                  },
                  {
                    id: 'intermediate',
                    label: 'Intermediate',
                    desc: 'Balanced view with commonly used features',
                  },
                  {
                    id: 'advanced',
                    label: 'Advanced',
                    desc: 'Full interface with all features visible',
                  },
                ].map(level => (
                  <div
                    key={level.id}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      preferences.complexityLevel === level.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    onClick={() => setPreferences(prev => ({ ...prev, complexityLevel: level.id }))}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={preferences.complexityLevel === level.id}
                        onChange={() => {}}
                        className="h-4 w-4"
                      />
                      <div>
<>
                        <p className="font-medium">{level.label}</p>
                        <p
</> className="text-sm text-muted-foreground">{level.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleNext} size="lg">
            Continue Setup
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderReadyStep = () => {
    const selectedRoleData = userRoles.find(r => r.id === selectedRole);

    return (
      <div className="text-center space-y-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
<>
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2
</> className="text-3xl font-bold">You're all set!</h2>
          <p className="text-lg text-muted-foreground">
            Terrafusion has been customized for your role as a{' '}
            {selectedRoleData?.title.toLowerCase()}
          </p>
        </div>

        <Card className="text-left">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <PlayCircle className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">Take the Quick Tour</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  5-minute guided walkthrough of key features
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2 text-emerald-500" />
                  <span className="font-medium">Explore Sample Data</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Practice with realistic property data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleComplete}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-blue-600"
          >
            Start Using Terrafusion
<>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
</> variant="outline" size="lg" onClick={() => setLocation('/help/quick-start')}>
            <BookOpen className="mr-2 h-4 w-4" />
            View Quick Start Guide
          </Button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep();
      case 1:
        return renderRoleStep();
      case 2:
        return renderPreferencesStep();
      case 3:
        return renderReadyStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
<>
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button
</> variant="ghost" size="sm" onClick={onSkip}>
              Skip Setup
            </Button>
          </div>
          <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {steps.map((step /* , index */) => (
              <span
                key={step.id}
                className={cn(index <= currentStep ? 'text-primary font-medium' : '')}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'transition-all duration-300',
            isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          )}
        >
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default WelcomeFlow;
