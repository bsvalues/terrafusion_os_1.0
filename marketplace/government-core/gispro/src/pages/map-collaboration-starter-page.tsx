import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  Users, 
  MessageSquare, 
  Play,
  ArrowRight,
  Zap,
  Eye,
  Settings,
  Clock,
  Share2
} from 'lucide-react';
import { CollaborationMapStarter } from '@/components/maps/collaborative/collaboration-map-starter';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95
  }
};

export default function MapCollaborationStarterPage() {
  return (
    <motion.div 
      className="container mx-auto py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div 
        className="text-center space-y-4"
        variants={cardVariants}
      >
        <h1 className="text-4xl font-bold text-foreground">
          Map Collaboration Starter
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Quick-start collaborative mapping with real-time features, shared cursors, 
          and integrated team communication tools.
        </p>
        
        <div className="flex items-center justify-center gap-4 mt-6">
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Real-time Ready
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            Multi-user Support
          </Badge>
          <Badge variant="outline" className="flex items-center gap-2">
            <Zap className="h-3 w-3" />
            Instant Setup
          </Badge>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        variants={cardVariants}
      >
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Play className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Start New Session</CardTitle>
            <CardDescription>
              Create a new collaborative mapping session and invite team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Share2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Join Session</CardTitle>
            <CardDescription>
              Enter a session ID to join an existing collaborative mapping session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Join Session
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>View Demo</CardTitle>
            <CardDescription>
              Explore collaboration features with a pre-configured demonstration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button variant="secondary" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Live Demo
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Overview */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        variants={cardVariants}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Collaboration Features
            </CardTitle>
            <CardDescription>
              Real-time features available in every session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Real-time Cursors</h4>
                  <p className="text-sm text-muted-foreground">See other users' cursor positions live</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Team Chat</h4>
                  <p className="text-sm text-muted-foreground">Integrated communication while mapping</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Synchronized Tools</h4>
                  <p className="text-sm text-muted-foreground">Drawing and annotation tools for everyone</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Session History</h4>
                  <p className="text-sm text-muted-foreground">Track changes and collaboration timeline</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                View All Features
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
            <CardDescription>
              Get started with collaborative mapping in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Create or Join Session</h4>
                  <p className="text-sm text-muted-foreground">
                    Start a new collaborative session or join an existing one with a session ID
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Invite Team Members</h4>
                  <p className="text-sm text-muted-foreground">
                    Share the session link or ID with colleagues to collaborate in real-time
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Start Collaborating</h4>
                  <p className="text-sm text-muted-foreground">
                    Use drawing tools, chat, and shared map views to work together effectively
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Average setup time: <strong>2 minutes</strong>
                </p>
                <Button className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Get Started Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Interactive Map Component */}
      <motion.div 
        className="space-y-4"
        variants={cardVariants}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Interactive Collaboration Preview
          </h2>
          <p className="text-muted-foreground">
            Experience the collaborative mapping interface with live features
          </p>
        </div>

        <div className="h-[calc(100vh-12rem)]">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                  Live Preview
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Real-time collaboration features enabled
                </span>
              </div>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </div>

          <CollaborationMapStarter />
        </div>
      </motion.div>
    </motion.div>
  );
}
