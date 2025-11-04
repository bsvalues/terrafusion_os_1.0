import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mascot } from './Mascot';
import { OnboardingStep, useOnboarding } from '@/contexts/OnboardingContext';
import { X  } from '@mui/icons-material';

interface OnboardingWizardProps {
  className?: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ className = '' }) => {
  const { 
    isOnboardingActive, 
    currentStep, 
    completeCurrentStep, 
    skipOnboarding 
  } = useOnboarding();

  if (!isOnboardingActive || !currentStep) {
    return null;
  }

  // Define content for each step
  const getStepContent = (step: OnboardingStep) => {
    switch (step) {
      case 'welcome':
        return {
          title: 'Welcome to Income Valuation Tracker',
          content: (
            <div className="space-y-4"><>

              <p>
                I'm Vinny, your friendly valuation assistant! I'll guide you through this
                powerful tool designed to help you track and value your income streams.
              </p>
              <p
</>

</>>
                Let me show you around so you can get the most out of the platform.
              </p>
            </div>
          ),
          mascotEmotion: 'happy',
          buttonText: 'Get Started'
        };
      
      case 'dashboard-intro':
        return {
          title: 'Your Dashboard',
          content: (
            <div className="space-y-4"><>

              <p>
                This is your dashboard - your command center for tracking all your income sources and valuations.
              </p>
              <p
</>

</>>
                Here you'll see an overview of your:
              </p>
              <ul className="list-disc pl-5 space-y-1"><>

                <li>Total monthly and annual income</li>
                            <li
</>

</>>Recent valuations</li><>

                <li>Income breakdown by source</li>
                            <li
</>

</>>Latest valuation amount</li>
              </ul>
            </div>
          ),
          mascotEmotion: 'explaining',
          buttonText: 'Next'
        };
      
      case 'income-entry':
        return {
          title: 'Adding Income Sources',
          content: (
            <div className="space-y-4"><>

              <p>
                To get started, you'll need to add your income sources.
              </p>
              <p
</>

</>>
                Click on "Add Income" to record:
              </p>
              <ul className="list-disc pl-5 space-y-1"><>

                <li>Income amount</li>
                            <li
</>

</>>Source type (salary, business, freelance, etc.)</li><>

                <li>Frequency (monthly, annual, etc.)</li>
                            <li
</>

</>>Description for your reference</li>
              </ul>
              <p>
                Each source has a specific multiplier that affects your total valuation!
              </p>
            </div>
          ),
          mascotEmotion: 'thinking',
          buttonText: 'Next'
        };
      
      case 'valuation-intro':
        return {
          title: 'Understanding Valuations',
          content: (
            <div className="space-y-4"><>

              <p>
                Valuations are calculations based on your income sources.
              </p>
              <p
</>

</>>
                Each income type is multiplied by a specific factor:
              </p>
              <ul className="list-disc pl-5 space-y-1"><>

                <li>Salary: 1-3x annual amount</li>
                            <li
</>

</>>Business: 3-5x annual profit</li><>

                <li>Investments: 20-25x annual returns</li>
                            <li
</>

</>>And more...</li>
              </ul>
              <p>
                The system automatically calculates a weighted valuation based on all your income sources.
              </p>
            </div>
          ),
          mascotEmotion: 'explaining',
          buttonText: 'Continue'
        };
      
      case 'report-intro':
        return {
          title: 'Valuation Reports',
          content: (
            <div className="space-y-4"><>

              <p>
                Once you have income sources and valuations, you can generate detailed reports.
              </p>
              <p
</>

</>>
                Reports include:
              </p>
              <ul className="list-disc pl-5 space-y-1"><>

                <li>Historical valuation trends</li>
                            <li
</>

</>>Income breakdown analysis</li><>

                <li>Personalized recommendations</li>
                            <li
</>

</>>Visual charts and insights</li>
              </ul>
              <p>
                I'll help analyze your data to provide meaningful insights!
              </p>
            </div>
          ),
          mascotEmotion: 'happy',
          buttonText: 'Sounds Great'
        };
      
      case 'calculator-intro':
        return {
          title: 'Interactive Calculator',
          content: (
            <div className="space-y-4"><>

              <p>
                Try our interactive calculator to experiment with different income scenarios.
              </p>
              <p
</>

</>>
                The calculator allows you to:
              </p>
              <ul className="list-disc pl-5 space-y-1"><>

                <li>Add hypothetical income sources</li>
                            <li
</>

</>>Adjust amounts and frequencies</li><>

                <li>See real-time valuation changes</li>
                            <li
</>

</>>Compare different scenarios</li>
              </ul>
              <p>
                It's perfect for planning your financial future!
              </p>
            </div>
          ),
          mascotEmotion: 'explaining',
          buttonText: 'Next'
        };
      
      case 'agent-intro':
        return {
          title: 'AI Assistant Features',
          content: (
            <div className="space-y-4"><>

              <p>
                I'm powered by advanced AI to help you with:
              </p>
              <ul
</>

className="list-disc pl-5 space-y-1"><>

                <li>Anomaly detection in your income patterns</li>
                            <li
</>

</>>Data quality checks and suggestions</li><>

                <li>Personalized valuation insights</li>
                            <li
</>

</>>Custom reports tailored to your needs</li>
              </ul><>

              <p>
                You can access these features in the Agent Dashboard section.
              </p>
              <p
</>

className="font-medium">
                You're all set! Feel free to explore the platform now.
              </p>
            </div>
          ),
          mascotEmotion: 'celebrating',
          buttonText: 'Finish Tour'
        };
      
      default:
        return {
          title: 'Explore the Platform',
          content: (
            <p>
              Take some time to explore the platform and discover all its features.
            </p>
          ),
          mascotEmotion: 'happy',
          buttonText: 'Got It'
        };
    }
  };

  const currentContent = getStepContent(currentStep);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-6 right-6 z-50 max-w-md ${className}`}
      >
        <Card className="border-primary shadow-lg">
          <CardHeader className="pb-2 relative">
            <div className="absolute top-2 right-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={skipOnboarding}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <CardTitle className="text-xl flex items-center">
              {currentContent.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 pt-1"><>

                <Mascot 
                  emotion={currentContent.mascotEmotion as any} 
                  size="md" 
                />
              </div>
              <div
</>

className="flex-grow text-sm">
                {currentContent.content}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 flex justify-between"><>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={skipOnboarding}
            >
              Skip Tour
            </Button>
            <Button
</>

              onClick={completeCurrentStep}
              size="sm"
            >
              {currentContent.buttonText}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};