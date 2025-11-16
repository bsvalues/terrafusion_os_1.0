import React, { useState, useEffect } from 'react';
import { HelpCircle, BookOpen, Lightbulb, LifeBuoy, FileText, Video, MessageCircle, Upload, Download, BarChart2, FileCheck  } from '@mui/icons-material';
import { useHelp } from '@/contexts/HelpContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PlayTourButton } from '@/components/tour/TourButton';
import { TourType } from '@/types/tour';

interface HelpCenterProps {
  className?: string;
}

// Define specific help topic content
interface HelpItem {
  title: string;
  description: string;
  icon: React.ElementType;
}

interface HelpSection {
  title: string;
  items: HelpItem[];
}

interface HelpTopicContent {
  title: string;
  description: string;
  icon: React.ElementType;
  sections: HelpSection[];
}

interface HelpContentMap {
  [key: string]: HelpTopicContent;
}

// Help content for specific topics
const helpContent: HelpContentMap = {
  permits: {
    title: 'Permit Processing',
    description: 'Learn how to upload, process, and analyze permits',
    icon: FileCheck,
    sections: [
      {
        title: 'Getting Started with Permits',
        items: [
          {
            title: 'Upload Permit Files',
            description: 'How to import Excel, CSV, or JSON files',
            icon: Upload,
          },
          {
            title: 'Processing Flow',
            description: 'Understanding the 4-step processing workflow',
            icon: FileCheck,
          },
          {
            title: 'Using AI Processing',
            description: 'Leveraging AI for permit analysis and validation',
            icon: Lightbulb,
          },
        ],
      },
      {
        title: 'Working with Processed Data',
        items: [
          {
            title: 'Export Formats',
            description: 'Different export options and their use cases',
            icon: Download,
          },
          {
            title: 'Data Visualization',
            description: 'Creating reports and charts from permit data',
            icon: BarChart2,
          },
          {
            title: 'Optimization Techniques',
            description: 'How to streamline your permit workflow',
            icon: Lightbulb,
          },
        ],
      },
    ],
  },
  // Add more topics as needed
};

const HelpCenter: React.FC<HelpCenterProps> = ({ className = '' }) => {
  const { isHelpCenterOpen, closeHelpCenter, activeHelpTopic } = useHelp();
  const [activeTab, setActiveTab] = useState('guides');
  
  // Set the appropriate tab when a specific help topic is requested
  useEffect(() => {
    if (activeHelpTopic) {
      setActiveTab('guides');
    }
  }, [activeHelpTopic]);
  
  return (
    <Popover open={isHelpCenterOpen} onOpenChange={closeHelpCenter}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`rounded-full ${className}`}
          aria-label="Open Help Center"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-[400px]">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4"><>

            <h2 className="text-lg font-semibold">Help Center</h2>
            <TabsList
</>><>

              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger
</> value="tours">Tours</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="guides" className="space-y-4">
            {activeHelpTopic && helpContent[activeHelpTopic] ? (
              // Display topic-specific help content
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      {(() => {
                        const TopicIcon = helpContent[activeHelpTopic].icon;
                        return <TopicIcon className="h-5 w-5 mr-2 text-primary" />;
                      })()}
                      <div><>

                        <CardTitle className="text-base">{helpContent[activeHelpTopic].title}</CardTitle>
                        <CardDescription
</>>{helpContent[activeHelpTopic].description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                
                {helpContent[activeHelpTopic].sections.map((section /* , index */) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {section.items.map((item, itemIndex) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={itemIndex} className="flex items-start">
                            <ItemIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                            <span className="flex-1"><>

                              <a href="#" className="text-blue-600 hover:underline">{item.title}</a>
                              <div
</> className="text-gray-500 text-xs mt-0.5">{item.description}</div>
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              // Default help content
              <>
                <Card>
                  <CardHeader className="pb-2"><>

                    <CardTitle className="text-base">Quick Start</CardTitle>
                    <CardDescription
</>>Get up and running quickly</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="flex-1"><>

                        <a href="#" className="text-blue-600 hover:underline">Complete Onboarding</a>
                        <div
</> className="text-gray-500 text-xs mt-0.5">Set up your organization and preferences</div>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="flex-1"><>

                        <a href="#" className="text-blue-600 hover:underline">Upload Your First Permits</a>
                        <div
</> className="text-gray-500 text-xs mt-0.5">Learn how to import and process permit data</div>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="flex-1"><>

                        <a href="#" className="text-blue-600 hover:underline">Using AI Features</a>
                        <div
</> className="text-gray-500 text-xs mt-0.5">Leverage AI to analyze and process permits</div>
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2"><>

                    <CardTitle className="text-base">Key Features</CardTitle>
                    <CardDescription
</>>Explore what you can do</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="flex-1"><>

                        <a href="#" className="text-blue-600 hover:underline">Batch Permit Processing</a>
                        <div
</> className="text-gray-500 text-xs mt-0.5">How to efficiently handle multiple permits</div>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="flex-1"><>

                        <a href="#" className="text-blue-600 hover:underline">Collaboration Tools</a>
                        <div
</> className="text-gray-500 text-xs mt-0.5">Work together with your team in real-time</div>
                      </span>
                    </div>
                    <div className="flex items-start">
                      <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                      <span className="flex-1"><>

                        <a href="#" className="text-blue-600 hover:underline">Data Exporting</a>
                        <div
</> className="text-gray-500 text-xs mt-0.5">Generate reports and export processed data</div>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tours" className="h-[300px] overflow-auto">
            <div className="grid grid-cols-1 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Get Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Onboarding Tour</span>
                    <PlayTourButton
</> 
                      tourName={TourType.ONBOARDING} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Dashboard Overview</span>
                    <PlayTourButton
</> 
                      tourName={TourType.DASHBOARD} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Permits Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Permit Processing</span>
                    <PlayTourButton
</> 
                      tourName={TourType.PERMIT_PROCESSING} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">AI Analysis</span>
                    <PlayTourButton
</> 
                      tourName={TourType.AI_FEATURES} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Collaboration</span>
                    <PlayTourButton
</> 
                      tourName={TourType.COLLABORATION} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Batch Processing</span>
                    <PlayTourButton
</> 
                      tourName={TourType.BATCH_PROCESSING} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                  <div className="flex justify-between items-center"><>

                    <span className="text-sm">Data Export</span>
                    <PlayTourButton
</> 
                      tourName={TourType.DATA_EXPORT} 
                      size="sm" 
                      onClick={() => closeHelpCenter()} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="contact">
            <Card>
              <CardHeader><>

                <CardTitle className="text-base">Contact Support</CardTitle>
                <CardDescription
</>>Get help from our team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-gray-500" />
                  <div><>

                    <div className="font-medium text-sm">Live Chat</div>
                    <div
</> className="text-xs text-gray-500">Available 9am - 5pm PT</div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto">
                    Start Chat
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center">
                  <LifeBuoy className="h-5 w-5 mr-2 text-gray-500" />
                  <div><>

                    <div className="font-medium text-sm">Email Support</div>
                    <div
</> className="text-xs text-gray-500">24/7 response within 24 hours</div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto">
                    Email Us
                  </Button>
                </div>
                
                <Separator />
                
                <div className="flex items-center">
                  <Video className="h-5 w-5 mr-2 text-gray-500" />
                  <div><>

                    <div className="font-medium text-sm">Schedule a Demo</div>
                    <div
</> className="text-xs text-gray-500">Personal walkthrough with an expert</div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto">
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default HelpCenter;