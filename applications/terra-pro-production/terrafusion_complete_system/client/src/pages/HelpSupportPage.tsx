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
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search,
  HelpCircle,
  Book,
  VideoIcon,
  Headphones,
  MessageSquare,
  Mail,
  FileText,
  Phone,
  ArrowUpRight,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  SendIcon,
  CirclePlay,
  BookOpenCheck,
 } from '@mui/icons-material';

// FAQ data
const faqs = [
  {
    question: "How do I create a new property appraisal?",
    answer:
      "You can create a new property appraisal by clicking the 'New Report' button on the dashboard, or by selecting 'New Order' from the sidebar menu. You can also import appraisal orders from email by using the 'Email Order' feature.",
  },
  {
    question: "How do I add comparable properties to my report?",
    answer:
      "Navigate to the 'Comparables' page from the sidebar or through the workflow. Click on 'Add Comparable' and you can either manually enter property details or search for properties from connected MLS databases. You can also import comparables from spreadsheets.",
  },
  {
    question: "Can I use Terrafusion offline?",
    answer:
      "Yes, Terrafusion has offline capabilities. Make sure 'Save Data Locally' is enabled in your Settings. You can work offline, and your changes will automatically sync when you're back online. The TerraField mobile app also has robust offline support for field inspections.",
  },
  {
    question: "How do I sync data with the TerraField mobile app?",
    answer:
      "Make sure both your web platform and mobile app are signed in with the same account. Navigate to 'Field Sync' in the sidebar and click 'Sync Now'. You can also set up automatic syncing in the Settings page. Any photos or measurements taken on the mobile app will automatically appear in your web platform.",
  },
  {
    question: "How do I generate a PDF or XML report?",
    answer:
      "Go to the 'Reports' page, select the appraisal you want to export, and click on 'Generate Report'. You can select between PDF and XML formats. Before generation, you can run a compliance check to ensure all required fields are completed.",
  },
  {
    question: "How does the AI valuation feature work?",
    answer:
      "The AI valuation assistant analyzes your subject property and comparables to suggest adjustments and estimate value. It uses machine learning models trained on historical appraisal data. To use it, go to 'AI Valuation' in the sidebar, enter your property details, and click 'Generate Valuation'.",
  },
  {
    question: "How secure is my data in Terrafusion?",
    answer:
      "Terrafusion uses bank-level encryption (256-bit AES) for all data at rest and in transit. We implement role-based access controls, two-factor authentication, and regular security audits. All personal information is handled in compliance with privacy regulations.",
  },
  {
    question: "Can I share appraisal reports with clients?",
    answer:
      "Yes, you can share reports securely. Navigate to the report, click 'Share', and generate a secure link with an optional expiration date and view limits. You can control exactly what information is visible to the recipient.",
  },
];

// Video tutorials data
const videoTutorials = [
  {
    id: "video1",
    title: "Getting Started with Terrafusion",
    description: "Learn the basics of navigating and using Terrafusion Platform",
    duration: "8:45",
    thumbnail: "https://placehold.co/300x169",
    views: 2548,
  },
  {
    id: "video2",
    title: "Creating Your First Appraisal",
    description: "Step-by-step guide to creating a comprehensive appraisal report",
    duration: "12:30",
    thumbnail: "https://placehold.co/300x169",
    views: 1892,
  },
  {
    id: "video3",
    title: "Advanced Comparable Analysis",
    description: "Learn techniques for selecting and adjusting comparable properties",
    duration: "15:20",
    thumbnail: "https://placehold.co/300x169",
    views: 1345,
  },
  {
    id: "video4",
    title: "Using AI Valuation Assistant",
    description: "Harness the power of AI to improve your valuations",
    duration: "10:15",
    thumbnail: "https://placehold.co/300x169",
    views: 2103,
  },
  {
    id: "video5",
    title: "Mobile Field Inspections",
    description: "Using the TerraField mobile app for property inspections",
    duration: "9:50",
    thumbnail: "https://placehold.co/300x169",
    views: 1678,
  },
  {
    id: "video6",
    title: "Compliance and Quality Control",
    description: "Ensuring your reports meet all regulatory requirements",
    duration: "14:10",
    thumbnail: "https://placehold.co/300x169",
    views: 1254,
  },
];

// Help articles data
const helpArticles = [
  {
    id: "article1",
    title: "Complete Guide to UAD Compliance",
    description: "Understand all requirements for Uniform Appraisal Dataset compliance",
    category: "Compliance",
    readTime: "12 min read",
  },
  {
    id: "article2",
    title: "Property Sketching Best Practices",
    description: "Tips and techniques for creating accurate property sketches",
    category: "Sketches",
    readTime: "8 min read",
  },
  {
    id: "article3",
    title: "Comparable Selection Methodology",
    description: "How to select the most appropriate comparable properties",
    category: "Comparables",
    readTime: "15 min read",
  },
  {
    id: "article4",
    title: "Understanding Adjustment Factors",
    description: "Comprehensive guide to property valuation adjustments",
    category: "Adjustments",
    readTime: "18 min read",
  },
  {
    id: "article5",
    title: "Photo Requirements for Appraisals",
    description: "Guidelines for taking and managing property photos",
    category: "Photos",
    readTime: "10 min read",
  },
  {
    id: "article6",
    title: "Market Condition Analysis",
    description: "How to analyze and document current market conditions",
    category: "Market Analysis",
    readTime: "14 min read",
  },
  {
    id: "article7",
    title: "Terrafusion Keyboard Shortcuts",
    description: "Boost your productivity with these keyboard shortcuts",
    category: "Productivity",
    readTime: "5 min read",
  },
  {
    id: "article8",
    title: "Data Synchronization Guide",
    description: "How to ensure your data is properly synced across devices",
    category: "Data Management",
    readTime: "7 min read",
  },
];

export default function HelpSupportPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [showChatSupport, setShowChatSupport] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    {
      id: number;
      sender: "user" | "support";
      message: string;
      timestamp: Date;
    }[]
  >([
    {
      id: 1,
      sender: "support",
      message: "Hello! I'm your Terrafusion support assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Searching for help resources",
      description: `Searching for "${searchQuery}"`,
    });
    // In a real app, this would trigger a search API call
  };

  const handleSendSupportMessage = () => {
    if (supportMessage.trim() === "") return;

    // Add user message
    setChatMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: "user",
        message: supportMessage,
        timestamp: new Date(),
      },
    ]);

    // Clear input
    setSupportMessage("");

    // Simulate response after a delay
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "support",
          message:
            "Thank you for your message. Our support team will review your question and get back to you shortly. In the meantime, you might find helpful information in our documentation or FAQ section.",
          timestamp: new Date(),
        },
      ]);
    }, 1000);
  };

  return (
    <PageLayout
      title="Help & Support"
      description="Get help, access documentation, and contact support"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowChatSupport(true)}><>

            <MessageSquare className="mr-2 h-4 w-4" />
            Live Chat
          </Button>
          <Button
</>
            variant="default"
            onClick={() => {
              toast({
                title: "Support ticket created",
                description: "We'll get back to you within 24 hours.",
              });
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex w-full max-w-4xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><>

                <Input
                  type="search"
                  placeholder="Search help articles, tutorials, or ask a question..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
</> type="submit" className="ml-2">
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Tabs */}
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="faq"><>

              <HelpCircle className="h-4 w-4 mr-2" />
              FAQ
            </TabsTrigger>
            <TabsTrigger
</> value="articles"><>

              <Book className="h-4 w-4 mr-2" />
              Help Articles
            </TabsTrigger>
            <TabsTrigger
</> value="videos"><>

              <VideoIcon className="h-4 w-4 mr-2" />
              Video Tutorials
            </TabsTrigger>
            <TabsTrigger
</> value="contact">
              <Headphones className="h-4 w-4 mr-2" />
              Contact Us
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription
</>>
                  Quick answers to common questions about Terrafusion Platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq /* , index */) => (
                    <AccordionItem key={index} value={`item-${index}`}><>

                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent
</>>
                        <div className="pt-2 pb-4"><>

                          <p className="text-muted-foreground">{faq.answer}</p>
                          <div
</> className="flex items-center mt-4 space-x-4 text-sm"><>

                            <div className="text-muted-foreground">Was this helpful?</div>
                            <Button
</> variant="outline" size="sm" className="h-8"><>

                              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                              Yes
                            </Button>
                            <Button
</> variant="outline" size="sm" className="h-8">
                              <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                              No
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
              <CardFooter className="border-t pt-6 flex flex-col items-start"><>

                <h4 className="font-medium mb-2">Don't see what you're looking for?</h4>
                <div
</> className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm"><>

                    <Book className="mr-2 h-4 w-4" />
                    Browse All FAQs
                  </Button>
                  <Button
</> variant="outline" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Ask a Question
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Help Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Help Articles & Documentation</CardTitle>
                <CardDescription
</>>
                  Comprehensive guides and documentation for Terrafusion Platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {helpArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                    >
                      <CardHeader className="p-4">
                        <div className="flex justify-between items-start mb-1"><>

                          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded">
                            {article.category}
                          </span>
                          <span
</> className="text-xs text-muted-foreground">{article.readTime}</span>
                        </div><>

                        <CardTitle className="text-base">{article.title}</CardTitle>
                        <CardDescription
</> className="line-clamp-2">
                          {article.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          Read Article
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button variant="outline" className="mr-auto"><>

                  <BookOpenCheck className="mr-2 h-4 w-4" />
                  Browse Documentation
                </Button>
                <Button
</>>
                  <FileText className="mr-2 h-4 w-4" />
                  Download User Manual
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Video Tutorials Tab */}
          <TabsContent value="videos" className="space-y-4">
            <Card>
              <CardHeader><>

                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription
</>>
                  Watch step-by-step tutorials for using Terrafusion Platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoTutorials.map((video) => (
                    <div
                      key={video.id}
                      className="group overflow-hidden rounded-lg border bg-card text-card-foreground"
                    >
                      <div className="relative aspect-video">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="object-cover w-full h-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full bg-background/80 text-primary"
                          >
                            <CirclePlay className="h-6 w-6" />
                          </Button>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                          {video.duration}
                        </div>
                      </div>
                      <div className="p-4"><>

                        <h3 className="font-medium">{video.title}</h3>
                        <p
</> className="text-sm text-muted-foreground mt-1 mb-2">
                          {video.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground"><>

                          <span>{video.views.toLocaleString()} views</span>
                          <Button
</> variant="ghost" size="sm" className="h-7 px-2">
                            Watch Now
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View All Tutorials
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5 text-primary" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent><>

                  <p className="text-sm text-muted-foreground mb-4">
                    Submit a support ticket and receive a response within 24 hours.
                  </p>
                  <Button
</>
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Support ticket page",
                        description: "Redirecting to email support form.",
                      });
                    }}
                  >
                    Contact via Email
                  </Button>
                </CardContent>
                <CardFooter className="border-t text-sm text-muted-foreground">
                  support@terrafusion.com
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5 text-primary" />
                    Live Chat
                  </CardTitle>
                </CardHeader>
                <CardContent><>

                  <p className="text-sm text-muted-foreground mb-4">
                    Chat with our support team in real-time during business hours.
                  </p>
                  <Button
</> className="w-full" onClick={() => setShowChatSupport(true)}>
                    Start Live Chat
                  </Button>
                </CardContent>
                <CardFooter className="border-t text-sm text-muted-foreground">
                  Available Monday-Friday: 9am-6pm EST
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="mr-2 h-5 w-5 text-primary" />
                    Phone Support
                  </CardTitle>
                </CardHeader>
                <CardContent><>

                  <p className="text-sm text-muted-foreground mb-4">
                    Call us directly for urgent assistance or complex issues.
                  </p>
                  <Button
</>
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Phone Support",
                        description: "Calling support line...",
                      });
                    }}
                  >
                    Call Support
                  </Button>
                </CardContent>
                <CardFooter className="border-t text-sm text-muted-foreground">
                  +1 (800) 555-0123
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader><>

                <CardTitle>Submit a Support Request</CardTitle>
                <CardDescription
</>>
                  Describe your issue in detail and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><>

                      <label htmlFor="name" className="text-sm font-medium">
                        Your Name
                      </label>
                      <Input
</> id="name" placeholder="John Appraiser" />
                    </div>
                    <div className="space-y-2"><>

                      <label htmlFor="email" className="text-sm font-medium">
                        Email Address
                      </label>
                      <Input
</> id="email" type="email" placeholder="john@example.com" />
                    </div>
                    <div className="space-y-2"><>

                      <label htmlFor="subject" className="text-sm font-medium">
                        Subject
                      </label>
                      <Input
</> id="subject" placeholder="Brief description of your issue" />
                    </div>
                    <div className="space-y-2"><>

                      <label htmlFor="priority" className="text-sm font-medium">
                        Priority Level
                      </label>
                      <select
</>
                        id="priority"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      ><>

                        <option value="low">Low - General Question</option>
                        <option
</> value="medium">Medium - Minor Issue</option><>

                        <option value="high">High - Affecting Workflow</option>
                        <option
</> value="urgent">Urgent - System Down</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2"><>

                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
</>
                      id="message"
                      placeholder="Please provide details about your issue or question..."
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2"><>

                    <label htmlFor="attachments" className="text-sm font-medium">
                      Attachments (optional)
                    </label>
                    <Input
</> id="attachments" type="file" className="cursor-pointer" multiple />
                    <p className="text-xs text-muted-foreground">
                      You can attach screenshots or relevant files (max 10MB each)
                    </p>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between"><>

                <Button variant="outline">Cancel</Button>
                <Button
</>
                  onClick={() => {
                    toast({
                      title: "Support request submitted",
                      description: "We'll get back to you within 24 hours.",
                    });
                  }}
                >
                  Submit Support Request
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <VideoIcon className="h-5 w-5 mr-2 text-primary" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                New to Terrafusion? Get up to speed with our quick start guide for appraisers.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-1">
                Watch Tutorial <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-primary" />
                Tips & Tricks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Discover productivity shortcuts and expert techniques to work more efficiently.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-1">
                Learn More <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Book className="h-5 w-5 mr-2 text-primary" />
                Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access the complete documentation for all Terrafusion Platform features.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="gap-1">
                Open Docs <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Live Chat Sheet */}
      <Sheet open={showChatSupport} onOpenChange={setShowChatSupport}>
        <SheetContent className="sm:max-w-md flex flex-col h-full">
          <SheetHeader className="mb-4"><>

            <SheetTitle>Terrafusion Support</SheetTitle>
            <SheetDescription
</>>Chat with our support team in real-time</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto mb-4 pr-2 -mr-2">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-4 flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "support" && (
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src="/support-avatar.png" />
                    <AvatarFallback className="bg-primary/20 text-primary">TF</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`
                  max-w-[80%] rounded-lg px-3 py-2 text-sm
                  ${msg.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}
                `}
                ><>

                  <p>{msg.message}</p>
                  <p
</> className="text-[10px] opacity-70 mt-1 text-right">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.sender === "user" && (
                  <Avatar className="h-8 w-8 ml-2">
                    <AvatarFallback className="bg-muted">JA</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center">
            <Input
              placeholder="Type your message..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendSupportMessage();
                }
              }}
              className="flex-1"
            />
            <Button size="icon" className="ml-2" onClick={handleSendSupportMessage}>
              <SendIcon className="h-4 w-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </PageLayout>
  );
}
