import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import DevelopmentWorkspaceLayout from '@/layout/development-workspace-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder, 
  Plus, 
  Code, 
  FileCode, 
  ClipboardList,
  Calendar,
  SearchCheck,
  Settings,
  Globe,
  Database
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Project type from schema
interface Project {
  projectId: string;
  name: string;
  description: string;
  type: string;
  language: string;
  framework: string | null;
  status: string;
  createdBy: number;
  lastUpdated: Date;
  createdAt: Date;
}

// Template type
interface Template {
  id: string;
  name: string;
  description: string;
  language: string;
  framework: string;
  category: string;
  files: {
    path: string;
    type: string;
  }[];
}

// Project card component
const ProjectCard = ({ project }: { project: Project }) => {
  const getIcon = () => {
    if (project.type === 'FLASK') return <Globe className="h-10 w-10 text-blue-500" />;
    if (project.type === 'STREAMLIT') return <SearchCheck className="h-10 w-10 text-red-500" />;
    if (project.type === 'STATIC') return <Code className="h-10 w-10 text-green-500" />;
    return <FileCode className="h-10 w-10 text-gray-500" />;
  };

  const getLanguageBadgeColor = () => {
    if (project.language === 'PYTHON') return 'bg-blue-100 text-blue-800';
    if (project.language === 'JAVASCRIPT') return 'bg-yellow-100 text-yellow-800';
    if (project.language === 'TYPESCRIPT') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
          {getIcon()}
        </div>
        <CardDescription className="text-sm line-clamp-2">{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={getLanguageBadgeColor()}>
            {project.language}
          </Badge>
          {project.framework && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800">
              {project.framework}
            </Badge>
          )}
          <Badge variant="outline" className="bg-green-100 text-green-800">
            {project.type}
          </Badge>
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {project.status}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <div className="text-sm text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(project.lastUpdated).toLocaleDateString()}
        </div>
        <Button size="sm" asChild>
          <Link href={`/development/projects/${project.projectId}`}>Open</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Template card component
const TemplateCard = ({ template }: { template: Template }) => {
  const getIcon = () => {
    if (template.framework === 'flask') return <Globe className="h-10 w-10 text-blue-500" />;
    if (template.framework === 'react') return <Code className="h-10 w-10 text-blue-500" />;
    if (template.framework === 'express') return <Database className="h-10 w-10 text-green-500" />;
    if (template.framework === 'nodejs') return <FileCode className="h-10 w-10 text-green-500" />;
    return <FileCode className="h-10 w-10 text-gray-500" />;
  };

  const getLanguageBadgeColor = () => {
    if (template.language === 'python') return 'bg-blue-100 text-blue-800';
    if (template.language === 'javascript') return 'bg-yellow-100 text-yellow-800';
    if (template.language === 'typescript') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getFileCount = () => {
    const directoryCount = template.files.filter(file => file.type === 'DIRECTORY').length;
    const fileCount = template.files.filter(file => file.type === 'FILE').length;
    return { directoryCount, fileCount };
  };

  const { directoryCount, fileCount } = getFileCount();

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
          {getIcon()}
        </div>
        <CardDescription className="text-sm line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className={getLanguageBadgeColor()}>
            {template.language}
          </Badge>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {template.framework}
          </Badge>
          {template.category === 'assessment' && (
            <Badge variant="outline" className="bg-green-100 text-green-800">
              Assessment
            </Badge>
          )}
          {template.category === 'demo' && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Demo
            </Badge>
          )}
          {template.category === 'framework' && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              Framework
            </Badge>
          )}
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            {fileCount} files
          </Badge>
          {directoryCount > 0 && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              {directoryCount} folders
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button size="sm">Use Template</Button>
      </CardFooter>
    </Card>
  );
};

// Main Development Platform page
const DevelopmentPlatformPage = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<string | null>(null);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    type: 'FLASK',
    language: 'PYTHON',
    framework: '',
  });

  // Fetch projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ['/api/development/projects'],
  });

  // Fetch templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['/api/development/templates'],
  });

  // Create new project
  const handleCreateProject = async () => {
    try {
      await apiRequest('/api/development/projects', {
        method: 'POST',
        data: newProject,
      });
      
      // Close dialog and refresh projects
      setShowNewProjectDialog(false);
      setNewProject({
        name: '',
        description: '',
        type: 'FLASK',
        language: 'PYTHON',
        framework: '',
      });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <DevelopmentWorkspaceLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">TaxI_AI Development Platform</h1>
          <p className="text-gray-500">Build and deploy assessment applications with ease</p>
        </div>
        <Button 
          onClick={() => setShowNewProjectDialog(true)}
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      <Tabs 
        defaultValue="projects" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b mb-6">
          <TabsList className="bg-transparent p-0">
            <TabsTrigger 
              value="projects" 
              className="py-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              My Projects
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="py-2 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="projects" className="m-0">
          {isLoadingProjects ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Folder className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Create your first project to get started with the TaxI_AI Development Platform.
              </p>
              <Button onClick={() => setShowNewProjectDialog(true)}>Create Project</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: Project) => (
                <ProjectCard key={project.projectId} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="m-0">
          {isLoadingTemplates ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <ClipboardList className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Templates will be added soon to help you get started quickly.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
                <Button 
                  variant={activeTemplateCategory === null ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTemplateCategory(null)}
                  className="whitespace-nowrap"
                >
                  All Templates
                </Button>
                <Button 
                  variant={activeTemplateCategory === 'assessment' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTemplateCategory('assessment')}
                  className="whitespace-nowrap"
                >
                  Assessment Apps
                </Button>
                <Button 
                  variant={activeTemplateCategory === 'demo' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTemplateCategory('demo')}
                  className="whitespace-nowrap"
                >
                  Demo Apps
                </Button>
                <Button 
                  variant={activeTemplateCategory === 'framework' ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setActiveTemplateCategory('framework')}
                  className="whitespace-nowrap"
                >
                  Basic Frameworks
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates
                  .filter(template => activeTemplateCategory === null || template.category === activeTemplateCategory)
                  .map((template: Template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))
                }
              </div>
              
              {activeTemplateCategory !== null && 
                templates.filter(template => template.category === activeTemplateCategory).length === 0 && (
                <div className="text-center py-8 mt-4">
                  <p className="text-gray-500">No templates found in this category.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTemplateCategory(null)}
                    className="mt-2"
                  >
                    Show all templates
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Provide details for your new assessment application project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="My Assessment App" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="A description of your project" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Project Type</Label>
              <select 
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newProject.type}
                onChange={(e) => setNewProject({...newProject, type: e.target.value})}
              >
                <option value="FLASK">Flask App</option>
                <option value="STREAMLIT">Streamlit App</option>
                <option value="STATIC">Static Web App</option>
                <option value="API">API Server</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language">Programming Language</Label>
              <select 
                id="language"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newProject.language}
                onChange={(e) => setNewProject({...newProject, language: e.target.value})}
              >
                <option value="PYTHON">Python</option>
                <option value="JAVASCRIPT">JavaScript</option>
                <option value="TYPESCRIPT">TypeScript</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="framework">Framework (Optional)</Label>
              <Input 
                id="framework" 
                value={newProject.framework}
                onChange={(e) => setNewProject({...newProject, framework: e.target.value})}
                placeholder="e.g., React, Vue, etc." 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DevelopmentWorkspaceLayout>
  );
};

export default DevelopmentPlatformPage;