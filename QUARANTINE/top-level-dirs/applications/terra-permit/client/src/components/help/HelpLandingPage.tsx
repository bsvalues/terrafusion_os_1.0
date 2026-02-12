import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTour, TourType } from '@/contexts/TourContext';
import { BookOpen, 
  Play, 
  VideoIcon, 
  MessageCircle, 
  Upload, 
  PieChart,
  Settings,
  HelpCircle
 } from '@mui/icons-material';
import { motion } from 'framer-motion';

const HelpLandingPage = () => {
  const { startTour } = useTour();

  const tourCards = [
    {
      title: 'Onboarding Tour',
      description: 'Get started with a complete overview of the application',
      icon: <HelpCircle className="h-5 w-5 text-blue-600" />,
      tourType: TourType.ONBOARDING,
    },
    {
      title: 'Dashboard Tour',
      description: 'Learn how to use the dashboard and understand metrics',
      icon: <PieChart className="h-5 w-5 text-purple-600" />,
      tourType: TourType.DASHBOARD,
    },
    {
      title: 'Permit Upload Tour',
      description: 'Master the permit upload and processing workflow',
      icon: <Upload className="h-5 w-5 text-green-600" />,
      tourType: TourType.PERMIT_PROCESSING,
    },
    {
      title: 'AI Analytics Tour',
      description: 'Discover advanced AI-powered analytics features',
      icon: <PieChart className="h-5 w-5 text-amber-600" />,
      tourType: TourType.AI_FEATURES,
    },
    {
      title: 'Batch Processing Tour',
      description: 'Set up your account and system preferences',
      icon: <Settings className="h-5 w-5 text-sky-600" />,
      tourType: TourType.BATCH_PROCESSING,
    },
    {
      title: 'Help Center Tour',
      description: 'Navigate the help resources effectively',
      icon: <HelpCircle className="h-5 w-5 text-rose-600" />,
      tourType: TourType.HELP_CENTER,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Help Center</h2>
        <p className="text-gray-600 mt-1">Select a tour or browse help resources</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tourCards.map((card /* , index */) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="h-full border-left-accent hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                  {card.icon}
                </div>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => startTour(card.tourType)}
                  className="w-full flex items-center justify-center gap-1.5 text-blue-600"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Start Tour</span>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-8">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Help Resources</h3>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="flex items-center gap-2" size="sm">
              <BookOpen className="h-4 w-4 text-blue-600" />
              <span>User Guide</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" size="sm">
              <VideoIcon className="h-4 w-4 text-red-600" />
              <span>Video Tutorials</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" size="sm">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span>FAQ</span>
            </Button>
            <Button variant="outline" className="flex items-center gap-2" size="sm">
              <Settings className="h-4 w-4 text-purple-600" />
              <span>Troubleshooting</span>
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Need more help?</h3>
          <p className="text-gray-600 text-sm">
            If you can't find what you're looking for, our support team is ready to assist.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Contact Support
            </Button>
            <Button variant="outline" size="sm">
              Submit Feedback
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpLandingPage;