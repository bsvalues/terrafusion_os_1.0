import {useState, useEffect} from "react";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Users, 
  Building, 
  Target, 
  Zap,
  MapPin,
  BarChart3,
  Brain,
  Crown,
  Sparkles,
  Clock,
  Shield} from '@mui/icons-material';

interface OnboardingStep {id: string;
  title: string;
  description: string;
  icon: any;
  content: React.ReactNode;
  tooltip?: string;}

interface UserProfile {name: string;
  role: 'auditor' | 'supervisor' | 'admin' | 'analyst';
  department: string;
  experience: 'beginner' | 'intermediate' | 'expert';
  interests: string[];
  county: string;}

interface OnboardingWizardProps {isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserProfile) => void;}

const ROLE_OPTIONS = [
  {value: 'auditor', label: 'Property Auditor', description: 'Conduct property assessments and reviews'},
  {value: 'supervisor', label: 'Audit Supervisor', description: 'Manage audit teams and workflows'},
  {value: 'admin', label: 'System Administrator', description: 'Configure systems and manage users'},
  {value: 'analyst', label: 'Data Analyst', description: 'Analyze trends and generate insights'}
];

const INTEREST_OPTIONS = [
  {id: 'quantum', label: 'Quantum Processing', icon: Zap},
  {id: 'ai', label: 'AI Recommendations', icon: Brain},
  {id: 'gis', label: 'GIS Mapping', icon: MapPin},
  {id: 'analytics', label: 'Advanced Analytics', icon: BarChart3},
  {id: 'enterprise', label: 'Enterprise Features', icon: Crown},
  {id: 'automation', label: 'Workflow Automation', icon: Clock}
];

export default function OnboardingWizard({isOpen, onClose, onComplete}: OnboardingWizardProps) {const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    role: 'auditor',
    department: '',
    experience: 'beginner',
    interests: [],
    county: ''});

  const updateProfile = (updates: Partial<UserProfile>) =>{setProfile(prev => ({ ...prev, ...updates}));
  };

  const toggleInterest = (interestId: string) => {setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]}));
  };

  const steps: OnboardingStep[] = [
    {id: 'welcome',
      title: 'Welcome to Terrafusion',
      description: 'Intelligence That Counties Envy',
      icon: Sparkles,
      content: (<div className="text-center space-y-6 py-8"><div className="h-24 w-24 intelligence-mark mx-auto flex items-center justify-center"><div className="text-white font-bold text-3xl tracking-wider font-orbitron">TF</div></div><div className="space-y-3"><><h2 className="text-2xl font-bold font-orbitron text-white">Welcome to Terrafusion Enterprise</h2><p
</>className="text-terrafusion-cyan font-orbitron text-lg">
              Intelligence That Counties Envy</p><p className="text-gray-300 max-w-lg mx-auto leading-relaxed">You're about to experience the most advanced civil infrastructure intelligence platform. 
              Let's personalize your journey to maximize productivity and insights.</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"><div className="p-4 bg-terrafusion-cyan/10 border border-terrafusion-cyan/20 rounded-lg"><Target className="h-6 w-6 text-terrafusion-cyan mx-auto mb-2" /><div className="text-sm font-semibold text-white">99.7% Accuracy</div></div><div className="p-4 bg-terrafusion-cyan/10 border border-terrafusion-cyan/20 rounded-lg"><Clock className="h-6 w-6 text-terrafusion-cyan mx-auto mb-2" /><div className="text-sm font-semibold text-white">&lt;2s Processing</div></div><div className="p-4 bg-terrafusion-cyan/10 border border-terrafusion-cyan/20 rounded-lg"><Shield className="h-6 w-6 text-terrafusion-cyan mx-auto mb-2" /><div className="text-sm font-semibold text-white">Enterprise Security</div></div></div></div>),
      tooltip: 'Terrafusion combines Tesla engineering precision with Jobs UX elegance'},
    {
      id: 'profile',
      title: 'Tell Us About Yourself',
      description: 'Help us personalize your Terrafusion experience',
      icon: Users,
      content: (<div className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><><Label htmlFor="name" className="text-white">Full Name *</Label><Input
</>

                id="name"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value})}
                placeholder="Enter your full name"
                className="bg-slate-800 border-slate-600 text-white"
              /></div><div className="space-y-2"><><Label htmlFor="county" className="text-white">County/Organization *</Label><Input
</>

                id="county"
                value={profile.county}
                onChange={(e) => updateProfile({ county: e.target.value})}
                placeholder="e.g., San Francisco County"
                className="bg-slate-800 border-slate-600 text-white"
              /></div><div className="space-y-2"><><Label htmlFor="department" className="text-white">Department</Label><Input
</>

                id="department"
                value={profile.department}
                onChange={(e) => updateProfile({ department: e.target.value})}
                placeholder="e.g., Property Assessment"
                className="bg-slate-800 border-slate-600 text-white"
              /></div><div className="space-y-2"><><Label htmlFor="experience" className="text-white">Experience Level</Label><Select
</>
value={profile.experience} onValueChange={(value: any) => updateProfile({ experience: value})}><SelectTrigger className="bg-slate-800 border-slate-600 text-white"><><SelectValue placeholder="Select experience level" /></SelectTrigger><SelectContent
</></>><><SelectItem value="beginner">Beginner (0-2 years)</SelectItem><SelectItem
</>
value="intermediate">Intermediate (2-5 years)</SelectItem><SelectItem value="expert">Expert (5+ years)</SelectItem></SelectContent></Select></div></div></div>),
      tooltip: 'Your profile helps us customize recommendations and interface complexity'
    },
    {
      id: 'role',
      title: 'Choose Your Role',
      description: 'Select your primary role to customize your dashboard',
      icon: Building,
      content: (<div className="space-y-4">{ROLE_OPTIONS.map((role) => (<Card 
              key={role.value}
              className={`cursor-pointer transition-all duration-200 ${
                profile.role === role.value 
                  ? 'border-terrafusion-cyan bg-terrafusion-cyan/10' 
                  : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}
              onClick={() => updateProfile({ role: role.value as any})}
            ><CardContent className="p-4"><div className="flex items-center justify-between"><div><><h3 className="font-semibold text-white">{role.label}</h3><p
</>
className="text-sm text-gray-400 mt-1">{role.description}</p></div><div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                    profile.role === role.value 
                      ? 'border-terrafusion-cyan bg-terrafusion-cyan' 
                      : 'border-gray-500'}`}>{profile.role === role.value && (<CheckCircle className="h-4 w-4 text-white" />)}</div></div></CardContent></Card>))}</div>),
      tooltip: 'Your role determines which features and dashboards are prioritized in your interface'
    },
    {
      id: 'interests',
      title: 'Select Your Interests',
      description: 'Choose features you want to focus on',
      icon: Target,
      content: (<div className="space-y-4"><><p className="text-gray-300 text-sm">Select the Terrafusion features that interest you most. We'll prioritize these in your dashboard:</p><div
</>className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {INTEREST_OPTIONS.map((interest) => (<div
                key={interest.id}
                className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  profile.interests.includes(interest.id)
                    ? 'border-terrafusion-cyan bg-terrafusion-cyan/10'
                    : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}
                onClick={() => toggleInterest(interest.id)}
              ><Checkbox 
                  checked={profile.interests.includes(interest.id)}
                  className="border-slate-500" /><interest.icon className={`h-5 w-5 ${
                  profile.interests.includes(interest.id) ? 'text-terrafusion-cyan' : 'text-gray-400'}`} /><span className={`font-medium ${
                  profile.interests.includes(interest.id) ? 'text-terrafusion-cyan' : 'text-white'}`}>{interest.label}</span></div>))}</div></div>),
      tooltip: 'Selected interests will appear prominently in your personalized dashboard'
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Welcome to your personalized Terrafusion experience',
      icon: CheckCircle,
      content: (<div className="text-center space-y-6 py-8"><div className="h-16 w-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto"><><CheckCircle className="h-8 w-8 text-green-400" /></div><div
</>
className="space-y-3"><><h2 className="text-2xl font-bold text-white">Welcome aboard, {profile.name}!</h2><p
</>className="text-gray-300 max-w-lg mx-auto">
              Your personalized Terrafusion workspace is ready. Based on your profile, we've customized 
              your dashboard to focus on the features that matter most to you.</p></div><div className="bg-slate-800 border border-slate-600 rounded-lg p-4 max-w-md mx-auto"><><h3 className="font-semibold text-white mb-3">Your Profile Summary:</h3><div
</>
className="space-y-2 text-sm"><div className="flex justify-between"><><span className="text-gray-400">Role:</span><span
</>
className="text-white capitalize">{profile.role}</span></div><div className="flex justify-between"><><span className="text-gray-400">Experience:</span><span
</>
className="text-white capitalize">{profile.experience}</span></div><div className="flex justify-between"><><span className="text-gray-400">Interests:</span><span
</>
className="text-white">{profile.interests.length} selected</span></div></div></div><div className="flex flex-wrap gap-2 justify-center">{profile.interests.map(interestId => {
              const interest = INTEREST_OPTIONS.find(opt => opt.id === interestId);
              return interest ? (<Badge key={interestId} className="bg-terrafusion-cyan/20 text-terrafusion-cyan">{interest.label}</Badge>) : null;
            })}</div></div>),
      tooltip: 'Your preferences are saved and will persist across sessions'
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {if (isLastStep) {
      onComplete(profile);
      onClose();} else {setCurrentStep(prev => prev + 1);}
  };

  const handlePrevious = () => {if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);}
  };

  const canProceed = () => {switch (currentStepData.id) {
      case 'profile':
        return profile.name.trim() !== '' && profile.county.trim() !== '';
      case 'role':
        return profile.role && profile.role.length > 0;
      default:
        return true;}
  };

  return (<Dialog open={isOpen} onOpenChange={onClose}><DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700"><DialogHeader className="border-b border-slate-700 pb-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 intelligence-mark flex items-center justify-center"><><currentStepData.icon className="h-5 w-5 text-white" /></div><div
</></>><><DialogTitle className="text-xl font-bold text-white font-orbitron">{currentStepData.title}</DialogTitle><DialogDescription
</>className="text-gray-400">
                  {currentStepData.description}</DialogDescription></div></div><Badge className="bg-terrafusion-cyan/20 text-terrafusion-cyan">Step {currentStep + 1} of {steps.length}</Badge></div><div className="mt-4"><div className="flex justify-between text-sm text-gray-400 mb-2"><><span>Progress</span><span
</></>>{Math.round(progress)}%</span></div><Progress value={progress} className="h-2" /></div></DialogHeader><><div className="py-6">{currentStepData.content}</div><div
</>
className="flex justify-between items-center border-t border-slate-700 pt-4"><Button
            variant="outline"
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="border-slate-600 text-white hover:bg-slate-800"
          ><><ArrowLeft className="h-4 w-4 mr-2" />Previous</Button><div
</>className="flex gap-2">
            {steps.map((_ /* , index */) => (<><div
                key={index}
                className={`h-2 w-8 rounded-full transition-all duration-200 ${
                  index <= currentStep ? 'bg-terrafusion-cyan' : 'bg-slate-600'}`} />))}</div><Button
</>onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-to-r from-terrafusion-cyan to-blue-500 hover:from-terrafusion-cyan/80 hover:to-blue-500/80 text-white"
          >
            {isLastStep ? 'Complete Setup' : 'Next'}
            {!isLastStep &&<ArrowRight className="h-4 w-4 ml-2" />}
          </Button></div></DialogContent></Dialog>
  );
}