/**
 * Terrafusion OS 1.0 - Project Creation Dialog
 * Government-Grade Project Setup Interface
 * 
 * Comprehensive project creation form with team assignment,
 * timeline planning, and compliance requirements.
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Button,
  Input,
  Textarea,
  Badge,
  Calendar,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '../../ui';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '../../ui/command';
import { CalendarIcon,
  Check,
  ChevronsUpDown,
  Plus,
  X,
  Warning,
  FileText,
  Users,
  Calendar as CalendarLucide,
  Target,
 } from '@mui/icons-material';
import { format } from 'date-fns';
import {
  Project,
  Team,
  CollaborationUser,
  ProjectType,
  ProjectPriority,
  ProjectPhase,
  Milestone,
  ResourceRequirement,
  ResourceType,
  RiskLevel,
  Risk,
  RiskCategory,
  SecurityClearance,
} from '../types/CollaborationTypes';

interface ProjectCreateDialogProps {
  teams: Team[];
  currentUser?: CollaborationUser;
  onSubmit: (project: Partial<Project>) => void;
  onClose: () => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  type: ProjectType;
  priority: ProjectPriority;
  teamId: string;
  startDate: Date;
  endDate: Date;
  estimatedBudget: number;
  securityClearanceRequired: SecurityClearance;
  complianceRequirements: string[];
  phases: ProjectPhase[];
  milestones: Milestone[];
  resourceRequirements: ResourceRequirement[];
  risks: Risk[];
}

export const ProjectCreateDialog: React.FC<ProjectCreateDialogProps> = ({
  teams,
  currentUser,
  onSubmit,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamComboboxOpen, setTeamComboboxOpen] = useState(false);
  const [complianceOptions] = useState([
    'FISMA Compliance',
    'SOC 2 Type II',
    'NIST Cybersecurity Framework',
    'Section 508 Accessibility',
    'PII Data Protection',
    'State Records Retention',
    'Government Transparency',
    'Audit Trail Requirements'
  ]);

  const form = useForm<ProjectFormData>({
    defaultValues: {
      name: '',
      description: '',
      type: ProjectType.ASSESSMENT,
      priority: ProjectPriority.MEDIUM,
      teamId: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      estimatedBudget: 0,
      securityClearanceRequired: SecurityClearance.INTERNAL,
      complianceRequirements: ['FISMA Compliance'],
      phases: [],
      milestones: [],
      resourceRequirements: [],
      risks: [],
    },
  });

  const { handleSubmit, control, watch, setValue, formState: { errors, isValid } } = form;

  const watchedTeamId = watch('teamId');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  // Update selected team when teamId changes
  useEffect(() => {
    const team = teams.find(t => t.id === watchedTeamId);
    setSelectedTeam(team || null);
  }, [watchedTeamId, teams]);

  // Add default phases when dates change
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const duration = watchedEndDate.getTime() - watchedStartDate.getTime();
      const daysTotal = Math.ceil(duration / (1000 * 60 * 60 * 24));
      
      if (daysTotal > 0) {
        const defaultPhases: ProjectPhase[] = [
          {
            id: '1',
            name: 'Planning & Setup',
            description: 'Initial project setup and planning phase',
            startDate: watchedStartDate,
            endDate: new Date(watchedStartDate.getTime() + (daysTotal * 0.2 * 24 * 60 * 60 * 1000)),
            status: 'not_started' as any,
            deliverables: ['Project Charter', 'Resource Allocation', 'Timeline'],
            responsibleTeam: selectedTeam?.name || 'TBD',
          },
          {
            id: '2',
            name: 'Execution',
            description: 'Main project execution phase',
            startDate: new Date(watchedStartDate.getTime() + (daysTotal * 0.2 * 24 * 60 * 60 * 1000)),
            endDate: new Date(watchedStartDate.getTime() + (daysTotal * 0.8 * 24 * 60 * 60 * 1000)),
            status: 'not_started' as any,
            deliverables: ['Core Deliverables', 'Testing', 'Documentation'],
            responsibleTeam: selectedTeam?.name || 'TBD',
          },
          {
            id: '3',
            name: 'Review & Closure',
            description: 'Final review, testing, and project closure',
            startDate: new Date(watchedStartDate.getTime() + (daysTotal * 0.8 * 24 * 60 * 60 * 1000)),
            endDate: watchedEndDate,
            status: 'not_started' as any,
            deliverables: ['Final Review', 'Documentation', 'Handover'],
            responsibleTeam: selectedTeam?.name || 'TBD',
          },
        ];
        
        setValue('phases', defaultPhases);
      }
    }
  }, [watchedStartDate, watchedEndDate, selectedTeam, setValue]);

  const addMilestone = () => {
    const currentMilestones = watch('milestones');
    const newMilestone: Milestone = {
      id: `milestone_${Date.now()}`,
      projectId: '', // Will be set when project is created
      name: `Milestone ${currentMilestones.length + 1}`,
      description: '',
      targetDate: new Date(watchedEndDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before end
      status: 'planned',
      deliverables: [],
      dependencies: [],
    };
    
    setValue('milestones', [...currentMilestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    const currentMilestones = watch('milestones');
    setValue('milestones', currentMilestones.filter((_, i) => i !== index));
  };

  const addResourceRequirement = () => {
    const currentResources = watch('resourceRequirements');
    const newResource: ResourceRequirement = {
      type: ResourceType.HUMAN,
      quantity: 1,
      unit: 'FTE',
      description: 'New resource requirement',
      estimatedCost: 0,
    };
    
    setValue('resourceRequirements', [...currentResources, newResource]);
  };

  const removeResourceRequirement = (index: number) => {
    const currentResources = watch('resourceRequirements');
    setValue('resourceRequirements', currentResources.filter((_, i) => i !== index));
  };

  const addRisk = () => {
    const currentRisks = watch('risks');
    const newRisk: Risk = {
      id: `risk_${Date.now()}`,
      description: 'New risk',
      impact: RiskLevel.MEDIUM,
      probability: 0.3,
      category: RiskCategory.TECHNICAL,
      mitigation: '',
    };
    
    setValue('risks', [...currentRisks, newRisk]);
  };

  const removeRisk = (index: number) => {
    const currentRisks = watch('risks');
    setValue('risks', currentRisks.filter((_, i) => i !== index));
  };

  const onFormSubmit = (data: ProjectFormData) => {
    const projectData: Partial<Project> = {
      name: data.name,
      description: data.description,
      type: data.type,
      priority: data.priority,
      team: selectedTeam!,
      owner: currentUser!,
      timeline: {
        startDate: data.startDate,
        endDate: data.endDate,
        phases: data.phases,
        currentPhase: data.phases[0]?.id || '',
      },
      milestones: data.milestones,
      metadata: {
        estimatedBudget: data.estimatedBudget,
        resourceRequirements: data.resourceRequirements,
        riskAssessment: {
          overallRisk: data.risks.length > 0 
            ? data.risks.reduce((max, risk) => 
                risk.impact === 'critical' ? 'critical' : 
                risk.impact === 'high' ? 'high' : 
                max
              , 'low' as RiskLevel)
            : RiskLevel.LOW,
          risks: data.risks,
          mitigationStrategies: data.risks.map(risk => ({
            riskId: risk.id,
            strategy: risk.mitigation || 'To be determined',
            owner: currentUser!,
            timeline: '30 days',
          })),
        },
        complianceRequirements: data.complianceRequirements,
        integrations: [],
      },
      participants: selectedTeam ? selectedTeam.members.map(member => ({
        user: member,
        role: member.id === currentUser?.id ? 'owner' as any : 'contributor' as any,
        permissions: [],
        joinedAt: new Date(),
        isActive: true,
      })) : [],
      tasks: [],
      documents: [],
      auditTrail: [],
    };

    onSubmit(projectData);
  };

  const getProjectTypeDescription = (type: ProjectType) => {
    const descriptions: Record<ProjectType, string> = {
      [ProjectType.ASSESSMENT]: 'Property assessment and evaluation projects',
      [ProjectType.VALUATION]: 'Property valuation and appraisal projects',
      [ProjectType.COMPLIANCE]: 'Compliance and regulatory projects',
      [ProjectType.SYSTEM_INTEGRATION]: 'System integration and technical projects',
      [ProjectType.DATA_MIGRATION]: 'Data migration and transformation projects',
      [ProjectType.REPORTING]: 'Reporting and analytics projects',
      [ProjectType.AUDIT]: 'Audit and review projects',
      [ProjectType.TRAINING]: 'Training and knowledge transfer projects',
    };
    return descriptions[type] || 'General project';
  };

  return (
      <DialogHeader><>

        <DialogTitle>Create New Project</DialogTitle>
        <DialogDescription
</>
</>>
          Set up a new government project with team collaboration, timeline, and compliance requirements.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4"><>

              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger
</>
value="timeline">Timeline</TabsTrigger><>

              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger
</>
value="compliance">Compliance</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="name"
                  rules={{ required: 'Project name is required' }}
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Project Name *</FormLabel>
                      <FormControl
</>
</>><>

                        <Input placeholder="Enter project name" {...field} />
                      </FormControl>
                      <FormMessage
</>
/>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Project Type</FormLabel>
                      <Select
</>
onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ProjectType).map((type) => (
                            <SelectItem key={type} value={type}>
                              <div><>

                                <div className="font-medium">{type.replace('_', ' ')}</div>
                                <div
</>
className="text-xs text-muted-foreground">
                                  {getProjectTypeDescription(type)}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="description"
                rules={{ required: 'Project description is required' }}
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Description *</FormLabel>
                    <FormControl
</>
</>><>

                      <Textarea
                        placeholder="Describe the project goals, scope, and expected outcomes"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage
</>
/>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Priority</FormLabel>
                      <Select
</>
onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent><>

                          <SelectItem value={ProjectPriority.LOW}>Low</SelectItem>
                          <SelectItem
</>
value={ProjectPriority.MEDIUM}>Medium</SelectItem><>

                          <SelectItem value={ProjectPriority.HIGH}>High</SelectItem>
                          <SelectItem
</>
value={ProjectPriority.CRITICAL}>Critical</SelectItem>
                          <SelectItem value={ProjectPriority.EMERGENCY}>Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="teamId"
                  rules={{ required: 'Team assignment is required' }}
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Assigned Team *</FormLabel>
                      <Popover
</>
open={teamComboboxOpen} onOpenChange={setTeamComboboxOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {selectedTeam ? selectedTeam.name : "Select team..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search teams..." /><>

                            <CommandEmpty>No teams found.</CommandEmpty>
                            <CommandGroup
</>
</>>
                              {teams.map((team) => (
                                <CommandItem
                                  key={team.id}
                                  value={team.id}
                                  onSelect={() => {
                                    field.onChange(team.id);
                                    setTeamComboboxOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedTeam?.id === team.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div><>

                                    <div className="font-medium">{team.name}</div>
                                    <div
</>
className="text-xs text-muted-foreground">
                                      {team.department} • {team.members.length} members
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {selectedTeam && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeam.members.map((member) => (
                        <div key={member.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar><>

                          <span className="text-sm">{member.name}</span>
                          <Badge
</>
variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>Start Date</FormLabel>
                      <Popover
</>
</>>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem><>

                      <FormLabel>End Date</FormLabel>
                      <Popover
</>
</>>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date <= watchedStartDate
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {watch('milestones').map((milestone /* , index */) => (
                    <div key={milestone.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Controller
                          control={control}
                          name={`milestones.${index}.name`}
                          render={({ field }) => (<>

                            <Input
                              placeholder="Milestone name"
                              {...field}
                            />
                          )}
                        />
                      </div>
                      <div
</>
className="w-40">
                        <Controller
                          control={control}
                          name={`milestones.${index}.targetDate`}
                          render={({ field }) => (<>

                            <Input
                              type="date"
                              {...field}
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))}
                            />
                          )}
                        />
                      </div>
                      <Button
</>

                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <FormField
                control={control}
                name="estimatedBudget"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Estimated Budget ($)</FormLabel>
                    <FormControl
</>
</>><>

                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage
</>
/>
                  </FormItem>
                )}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resource Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {watch('resourceRequirements').map((resource /* , index */) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center p-3 border rounded-lg">
                      <Controller
                        control={control}
                        name={`resourceRequirements.${index}.type`}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><>

                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent
</>
</>><>

                              <SelectItem value={ResourceType.HUMAN}>Human</SelectItem>
                              <SelectItem
</>
value={ResourceType.HARDWARE}>Hardware</SelectItem><>

                              <SelectItem value={ResourceType.SOFTWARE}>Software</SelectItem>
                              <SelectItem
</>
value={ResourceType.EXTERNAL_SERVICE}>Service</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`resourceRequirements.${index}.quantity`}
                        render={({ field }) => (
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        )}
                      />
                      <Controller
                        control={control}
                        name={`resourceRequirements.${index}.description`}
                        render={({ field }) => (
                          <Input
                            placeholder="Description"
                            {...field}
                          />
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResourceRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addResourceRequirement}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Warning className="h-4 w-4" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {watch('risks').map((risk /* , index */) => (
                    <div key={risk.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name={`risks.${index}.description`}
                          render={({ field }) => (
                            <Input
                              placeholder="Risk description"
                              className="flex-1"
                              {...field}
                            />
                          )}
                        />
                        <Controller
                          control={control}
                          name={`risks.${index}.impact`}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger className="w-32"><>

                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent
</>
</>><>

                                <SelectItem value={RiskLevel.LOW}>Low</SelectItem>
                                <SelectItem
</>
value={RiskLevel.MEDIUM}>Medium</SelectItem><>

                                <SelectItem value={RiskLevel.HIGH}>High</SelectItem>
                                <SelectItem
</>
value={RiskLevel.CRITICAL}>Critical</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRisk(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Controller
                        control={control}
                        name={`risks.${index}.mitigation`}
                        render={({ field }) => (
                          <Input
                            placeholder="Mitigation strategy"
                            {...field}
                          />
                        )}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRisk}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Risk
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-4">
              <FormField
                control={control}
                name="securityClearanceRequired"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Security Clearance Required</FormLabel>
                    <Select
</>
onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select clearance level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent><>

                        <SelectItem value={SecurityClearance.PUBLIC}>Public</SelectItem>
                        <SelectItem
</>
value={SecurityClearance.INTERNAL}>Internal</SelectItem><>

                        <SelectItem value={SecurityClearance.CONFIDENTIAL}>Confidential</SelectItem>
                        <SelectItem
</>
value={SecurityClearance.SECRET}>Secret</SelectItem>
                        <SelectItem value={SecurityClearance.TOP_SECRET}>Top Secret</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="complianceRequirements"
                render={({ field }) => (
                  <FormItem><>

                    <FormLabel>Compliance Requirements</FormLabel>
                    <FormControl
</>
</>>
                      <div className="space-y-2">
                        {complianceOptions.map((option) => (
                          <div key={option} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={option}
                              checked={field.value.includes(option)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, option]);
                                } else {
                                  field.onChange(field.value.filter(req => req !== option));
                                }
                              }}
                            />
                            <label
                              htmlFor={option}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Compliance Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {watch('complianceRequirements').map((req) => (
                      <Badge key={req} variant="secondary">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4"><>

            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <div
</>
className="flex gap-2">
              {activeTab !== 'basic' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ['basic', 'timeline', 'resources', 'compliance'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                >
                  Previous
                </Button>
              )}
              {activeTab !== 'compliance' ? (
                <Button
                  type="button"
                  onClick={() => {
                    const tabs = ['basic', 'timeline', 'resources', 'compliance'];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={!isValid}>
                  Create Project
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
  );
};

export default ProjectCreateDialog;