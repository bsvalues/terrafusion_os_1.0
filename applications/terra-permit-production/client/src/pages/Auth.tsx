import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Activity, 
  ArrowRight, 
  BarChart3, 
  CheckCircle2, 
  Cpu, 
  FileText, 
  Shield, 
  BrainCircuit,
  Zap,
  Clock,
  Settings
 } from '@mui/icons-material';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

// Auth component with Supabase integration
const Auth: React.FC = () => {
  const { login } = useAuth(); // Keep original auth for backward compatibility
  const { signIn } = useSupabaseAuth(); // Supabase auth
  const [, setLocation] = useLocation();
  const [isLoginFailed, setIsLoginFailed] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Automatically log in
  useEffect(() => {
    const autoLogin = async () => {
      try {
        setIsLoggingIn(true);
        
        // First try Supabase auth
        const supabaseResult = await signIn('dev@example.com', 'password');
        
        if (supabaseResult.error) {
          console.log('Falling back to original auth method');
          // Fall back to original auth
          await login('testuser', 'password');
        }
        
        // Redirect to home after a slight delay
        setTimeout(() => {
          setLocation('/');
        }, 500);
      } catch (error) {
        console.error('Auto-login error:', error);
        setIsLoginFailed(true);
      } finally {
        setIsLoggingIn(false);
      }
    };
    
    // Wait a bit before auto-login to allow animation to play
    setTimeout(() => {
      autoLogin();
    }, 200);
  }, [login, signIn, setLocation]);

  // Staggered animation for features
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  // Hero section animation
  const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  // Features data
  const features = [
    {
      title: 'AI-Powered Analysis',
      description: 'Advanced algorithms process permits with exceptional accuracy',
      icon: <BrainCircuit className="h-10 w-10 p-2 text-purple-600 bg-purple-100 rounded-full" />
    },
    {
      title: 'Real-Time Collaboration',
      description: 'Work together with your team in synchronized environments',
      icon: <Activity className="h-10 w-10 p-2 text-blue-600 bg-blue-100 rounded-full" />
    },
    {
      title: 'Enhanced Security',
      description: 'Enterprise-grade security with circuit breaker protection',
      icon: <Shield className="h-10 w-10 p-2 text-emerald-600 bg-emerald-100 rounded-full" />
    },
    {
      title: 'Insightful Analytics',
      description: 'Gain valuable insights with comprehensive data visualizations',
      icon: <BarChart3 className="h-10 w-10 p-2 text-amber-600 bg-amber-100 rounded-full" />
    },
    {
      title: 'Intelligent Processing',
      description: 'Smart workflows optimize your permit processing experience',
      icon: <Cpu className="h-10 w-10 p-2 text-indigo-600 bg-indigo-100 rounded-full" />
    },
    {
      title: 'Comprehensive Documentation',
      description: 'Access detailed records with powerful search capabilities',
      icon: <FileText className="h-10 w-10 p-2 text-rose-600 bg-rose-100 rounded-full" />
    }
  ];

  // Stats for the metrics section
  const stats = [
    { value: '99.9%', label: 'Uptime', icon: <Clock className="h-4 w-4 text-green-600" /> },
    { value: '45%', label: 'Faster Processing', icon: <Zap className="h-4 w-4 text-amber-600" /> },
    { value: '30k+', label: 'Permits Processed', icon: <FileText className="h-4 w-4 text-blue-600" /> },
    { value: '24/7', label: 'System Monitoring', icon: <Settings className="h-4 w-4 text-purple-600" /> }
  ];

  return (
    <div className="w-full overflow-hidden bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={heroVariants}
      >
        <div className="absolute inset-0 z-0 opacity-10"><>

          <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary/30 rounded-full filter blur-3xl"></div>
          <div
</> className="absolute bottom-20 left-1/4 w-80 h-80 bg-blue-400/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              Next-Generation Permit Processing
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            PermitPro AI
          </motion.h1>
          
          <motion.p 
            className="mt-6 max-w-2xl mx-auto text-xl text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Revolutionizing permit management with AI-powered processing, real-time collaboration, and circuit-breaker technology for unmatched reliability.
          </motion.p>
          
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <a href="#" className="inline-flex items-center justify-center rounded-md text-base px-8 py-3 bg-primary text-white font-medium shadow hover:bg-primary/90 transition-colors">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a href="#" className="inline-flex items-center justify-center rounded-md text-base px-8 py-3 bg-transparent border border-gray-300 text-gray-900 font-medium shadow-sm hover:bg-gray-50 transition-colors">
              Watch Demo
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="py-12 bg-white/50 backdrop-blur-sm border-y border-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat /* , index */) => (
              <motion.div 
                key={index}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (index * 0.1), duration: 0.6 }}
              ><>

                <div className="flex justify-center items-center mb-2">
                  {stat.icon}
                </div>
                <div
</> className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section 
        className="py-16 px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16"><>

            <h2 className="text-3xl font-bold text-gray-900">Powerful Features</h2>
            <p
</> className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with intuitive design
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature /* , index */) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full transition-shadow duration-300 hover:shadow-lg border-transparent hover:border-primary/20">
                  <CardHeader className="pb-2 flex space-x-4"><>

                    <div className="shrink-0">{feature.icon}</div>
                    <CardTitle
</> className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                  <CardFooter>
                    <div className="mt-2 text-primary flex items-center cursor-pointer hover:underline text-sm">
                      Learn more <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-blue-600/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          ><>

            <h2 className="text-3xl font-bold text-gray-900">Ready to transform your permit processing?</h2>
            <p
</> className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of professionals who have already streamlined their operations
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4"><>

              <a href="#" className="inline-flex items-center justify-center rounded-md text-base px-8 py-3 bg-primary text-white font-medium shadow hover:bg-primary/90 transition-colors">
                Start Free Trial
              </a>
              <a
</> href="#" className="inline-flex items-center justify-center rounded-md text-base px-8 py-3 bg-transparent border border-gray-300 text-gray-900 font-medium shadow-sm hover:bg-gray-50 transition-colors">
                Schedule Demo
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            className="mt-10 flex items-center justify-center text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /><>

            <span>No credit card required</span>
            <div
</> className="mx-3 h-1 w-1 rounded-full bg-gray-400"></div>
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /><>

            <span>Cancel anytime</span>
            <div
</> className="mx-3 h-1 w-1 rounded-full bg-gray-400"></div>
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <span>24/7 support</span>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
};

export default Auth;