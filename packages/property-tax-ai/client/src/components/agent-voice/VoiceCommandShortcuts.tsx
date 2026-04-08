/**
 * Voice Command Shortcuts
 * 
 * This component allows users to create and manage shortcuts for voice commands.
 * It provides a UI for creating, editing, and deleting shortcuts.
 */

import { useState, useEffect } from 'react';
import { 
  getUserShortcuts, 
  createShortcut, 
  updateShortcut, 
  deleteShortcut, 
  createDefaultShortcuts,
  type VoiceCommandShortcut,
  type CreateVoiceCommandShortcut
} from '@/services/enhanced-voice-command-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Command, 
  Check, 
  X, 
  RefreshCw, 
  FileDown, 
  FileText, 
  HelpCircle, 
  Loader2,
  MoveDown
} from 'lucide-react';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define form schema
const formSchema = z.object({
  shortcutPhrase: z.string()
    .min(2, "Shortcut must be at least 2 characters")
    .max(50, "Shortcut cannot exceed 50 characters"),
  expandedCommand: z.string()
    .min(5, "Command must be at least 5 characters")
    .max(500, "Command cannot exceed 500 characters"),
  commandType: z.string()
    .min(2, "Type must be at least 2 characters"),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(100),
  isEnabled: z.boolean(),
  isGlobal: z.boolean()
});

interface VoiceCommandShortcutsProps {
  userId: number;
  className?: string;
}

export function VoiceCommandShortcuts({
  userId,
  className = ''
}: VoiceCommandShortcutsProps) {
  // State
  const [shortcuts, setShortcuts] = useState<VoiceCommandShortcut[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDefaultLoading, setIsDefaultLoading] = useState<boolean>(false);
  const [editingShortcut, setEditingShortcut] = useState<VoiceCommandShortcut | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [commandTypes, setCommandTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const { toast } = useToast();
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shortcutPhrase: '',
      expandedCommand: '',
      commandType: 'general',
      description: '',
      priority: 50,
      isEnabled: true,
      isGlobal: false
    }
  });
  
  // Load shortcuts when component mounts
  useEffect(() => {
    loadShortcuts();
  }, [userId]);
  
  // Update command types when shortcuts change
  useEffect(() => {
    const types = Array.from(new Set(shortcuts.map(s => s.commandType)));
    setCommandTypes(types);
  }, [shortcuts]);
  
  // Load shortcuts
  const loadShortcuts = async () => {
    setIsLoading(true);
    
    try {
      const data = await getUserShortcuts(userId);
      setShortcuts(data);
    } catch (error) {
      console.error('Error loading shortcuts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load shortcuts',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create shortcut
  const handleCreateShortcut = async (values: z.infer<typeof formSchema>) => {
    try {
      const shortcutData: CreateVoiceCommandShortcut = {
        ...values,
        userId
      };
      
      const newShortcut = await createShortcut(shortcutData);
      setShortcuts([...shortcuts, newShortcut]);
      
      toast({
        title: 'Shortcut Created',
        description: `"${values.shortcutPhrase}" shortcut has been created`
      });
      
      form.reset();
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to create shortcut',
        variant: 'destructive'
      });
    }
  };
  
  // Update shortcut
  const handleUpdateShortcut = async (values: z.infer<typeof formSchema>) => {
    if (!editingShortcut) return;
    
    try {
      const updatedShortcut = await updateShortcut(editingShortcut.id, values);
      
      setShortcuts(shortcuts.map(s => 
        s.id === updatedShortcut.id ? updatedShortcut : s
      ));
      
      toast({
        title: 'Shortcut Updated',
        description: `"${values.shortcutPhrase}" shortcut has been updated`
      });
      
      form.reset();
      setEditingShortcut(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to update shortcut',
        variant: 'destructive'
      });
    }
  };
  
  // Delete shortcut
  const handleDeleteShortcut = async (id: number) => {
    try {
      await deleteShortcut(id);
      
      setShortcuts(shortcuts.filter(s => s.id !== id));
      
      toast({
        title: 'Shortcut Deleted',
        description: 'Shortcut has been deleted'
      });
    } catch (error) {
      console.error('Error deleting shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete shortcut',
        variant: 'destructive'
      });
    }
  };
  
  // Create default shortcuts
  const handleCreateDefaultShortcuts = async () => {
    setIsDefaultLoading(true);
    
    try {
      const defaultShortcuts = await createDefaultShortcuts(userId);
      
      // Merge with existing shortcuts (avoid duplicates)
      const existingIds = shortcuts.map(s => s.id);
      const newShortcuts = defaultShortcuts.filter(s => !existingIds.includes(s.id));
      
      setShortcuts([...shortcuts, ...newShortcuts]);
      
      toast({
        title: 'Default Shortcuts Created',
        description: `${newShortcuts.length} default shortcuts have been added`
      });
    } catch (error) {
      console.error('Error creating default shortcuts:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default shortcuts',
        variant: 'destructive'
      });
    } finally {
      setIsDefaultLoading(false);
    }
  };
  
  // Toggle shortcut enabled state
  const toggleShortcutEnabled = async (shortcut: VoiceCommandShortcut) => {
    try {
      const updatedShortcut = await updateShortcut(shortcut.id, {
        isEnabled: !shortcut.isEnabled,
        userId // Required by the API
      });
      
      setShortcuts(shortcuts.map(s => 
        s.id === updatedShortcut.id ? updatedShortcut : s
      ));
      
      toast({
        title: `Shortcut ${updatedShortcut.isEnabled ? 'Enabled' : 'Disabled'}`,
        description: `"${shortcut.shortcutPhrase}" is now ${updatedShortcut.isEnabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating shortcut:', error);
      toast({
        title: 'Error',
        description: 'Failed to update shortcut',
        variant: 'destructive'
      });
    }
  };
  
  // Edit shortcut
  const openEditDialog = (shortcut: VoiceCommandShortcut) => {
    setEditingShortcut(shortcut);
    
    form.reset({
      shortcutPhrase: shortcut.shortcutPhrase,
      expandedCommand: shortcut.expandedCommand,
      commandType: shortcut.commandType,
      description: shortcut.description || '',
      priority: shortcut.priority,
      isEnabled: shortcut.isEnabled,
      isGlobal: shortcut.isGlobal
    });
    
    setIsEditing(true);
  };
  
  // Filter shortcuts based on search query and type
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = 
      searchQuery === '' || 
      shortcut.shortcutPhrase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.expandedCommand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shortcut.description && shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = 
      selectedType === 'all' || 
      shortcut.commandType === selectedType;
    
    return matchesSearch && matchesType;
  });
  
  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-full" />
      </div>
      
      <Skeleton className="h-8 w-full" />
      
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
  
  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-12 text-muted-foreground">
      <Command className="h-12 w-12 mx-auto mb-4 opacity-20" />
      <p className="text-lg font-medium">No Shortcuts</p>
      <p className="mt-1 mb-4">You don't have any voice command shortcuts yet.</p>
      
      <div className="flex justify-center gap-2">
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Shortcut
            </Button>
          </DialogTrigger>
          {renderCreateDialog()}
        </Dialog>
        
        <Button 
          variant="outline" 
          onClick={handleCreateDefaultShortcuts}
          disabled={isDefaultLoading}
        >
          {isDefaultLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Add Default Shortcuts
        </Button>
      </div>
    </div>
  );
  
  // Render create dialog
  const renderCreateDialog = () => (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Create Voice Command Shortcut</DialogTitle>
        <DialogDescription>
          Create a new shortcut for a voice command.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleCreateShortcut)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="shortcutPhrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shortcut Phrase</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. show properties" {...field} />
                  </FormControl>
                  <FormDescription>
                    What you'll say to trigger this command
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="commandType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Command Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. property, data, report" {...field} />
                  </FormControl>
                  <FormDescription>
                    Category for organizing commands
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="expandedCommand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expanded Command</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. show all property assessments in Benton County sorted by value" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The full command that will be executed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. Shows a list of all properties in the county" 
                    className="min-h-[60px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  A description to help you remember what this shortcut does
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (1-100)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={100} 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher priority takes precedence
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enabled</FormLabel>
                    <FormDescription>
                      Activate this shortcut
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Global</FormLabel>
                    <FormDescription>
                      Available in all contexts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit">Create Shortcut</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
  
  // Render edit dialog
  const renderEditDialog = () => (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Edit Voice Command Shortcut</DialogTitle>
        <DialogDescription>
          Update an existing voice command shortcut.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleUpdateShortcut)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="shortcutPhrase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shortcut Phrase</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. show properties" {...field} />
                  </FormControl>
                  <FormDescription>
                    What you'll say to trigger this command
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="commandType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Command Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. property, data, report" {...field} />
                  </FormControl>
                  <FormDescription>
                    Category for organizing commands
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="expandedCommand"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expanded Command</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. show all property assessments in Benton County sorted by value" 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The full command that will be executed
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. Shows a list of all properties in the county" 
                    className="min-h-[60px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  A description to help you remember what this shortcut does
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (1-100)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={100} 
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher priority takes precedence
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enabled</FormLabel>
                    <FormDescription>
                      Activate this shortcut
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isGlobal"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Global</FormLabel>
                    <FormDescription>
                      Available in all contexts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <DialogFooter>
            <Button type="submit">Update Shortcut</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
  
  // Main render
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Voice Command Shortcuts</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadShortcuts}
              disabled={isLoading}
              aria-label="Refresh shortcuts"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Shortcut
                </Button>
              </DialogTrigger>
              {renderCreateDialog()}
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Create and manage shortcuts for voice commands
        </CardDescription>
        
        {shortcuts.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="type-filter" className="whitespace-nowrap">
                Filter by type:
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type-filter" className="w-[180px]">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {commandTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline" 
              onClick={handleCreateDefaultShortcuts}
              disabled={isDefaultLoading}
              size="sm"
            >
              {isDefaultLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2" />
              )}
              Add Defaults
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          renderLoading()
        ) : shortcuts.length === 0 ? (
          renderEmpty()
        ) : filteredShortcuts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No shortcuts match your search.</p>
            <Button
              variant="ghost" 
              onClick={() => {
                setSearchQuery('');
                setSelectedType('all');
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">Status</TableHead>
                  <TableHead className="w-[150px]">Shortcut</TableHead>
                  <TableHead>Command</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[70px]">Priority</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShortcuts.map((shortcut) => (
                  <TableRow key={shortcut.id}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleShortcutEnabled(shortcut)}
                            >
                              {shortcut.isEnabled ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{shortcut.isEnabled ? 'Enabled' : 'Disabled'} (click to toggle)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">
                      {shortcut.shortcutPhrase}
                      {shortcut.isGlobal && (
                        <Badge variant="secondary" className="ml-2">Global</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={shortcut.expandedCommand}>
                      {shortcut.expandedCommand}
                      
                      {shortcut.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 ml-2 inline-block text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{shortcut.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{shortcut.commandType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MoveDown className="h-4 w-4 mr-1 text-muted-foreground" />
                        {shortcut.priority}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(shortcut)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Shortcut</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the "{shortcut.shortcutPhrase}" shortcut?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteShortcut(shortcut.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        {renderEditDialog()}
      </Dialog>
    </Card>
  );
}