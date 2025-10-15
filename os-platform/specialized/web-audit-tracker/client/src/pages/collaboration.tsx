import {AnnotationSystem} from "@/components/annotation-system";
import {NotificationBadge} from "@/components/notification-center";
import AuditTrail from "@/components/audit-trail";
import AdvancedSearch from "@/components/advanced-search";
import TeamPerformance from "@/components/team-performance";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {MessageSquare, 
  Users, 
  Pin, 
  Clock, 
  CheckCircle2,
  FileText,
  MapPin,
  Building2,
  Activity} from '@mui/icons-material';

// Mock data for demonstration
const mockAudit = {id: 123,
  auditNumber: "A-2025-0123",
  propertyAddress: "1234 Main Street, Springfield County",
  assessedValue: 285000,
  status: "in_progress"};

const mockProperty = {id: 456,
  address: "1234 Main Street",
  parcelNumber: "123-456-789",
  assessedValue: 285000,
  yearBuilt: 1995};

const mockTeamMembers = [
  {id: 1, name: "Sarah Johnson", role: "Senior Auditor", avatar: "SJ"},
  {id: 2, name: "Mike Chen", role: "Supervisor", avatar: "MC"},
  {id: 3, name: "Lisa Rodriguez", role: "Analyst", avatar: "LR"},
  {id: 4, name: "Tom Wilson", role: "Administrator", avatar: "TW"}
];

export default function CollaborationDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6"><div className="max-w-7xl mx-auto space-y-6">{/* Header */}<div className="text-center space-y-4"><div className="flex items-center justify-center gap-3"><div className="h-12 w-12 intelligence-mark flex items-center justify-center"><><MessageSquare className="h-6 w-6 text-white" /></div><h1
</>className="text-4xl font-bold font-orbitron text-white tracking-wide">
              Collaborative Workspace</h1></div><p className="text-xl text-terrafusion-cyan/80 max-w-3xl mx-auto">Enterprise-grade collaborative annotation and commenting system for seamless teamwork across property assessments and audit processes.</p></div>{/* Team Overview */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Users className="h-5 w-5 text-terrafusion-cyan" />Active Team Members</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{mockTeamMembers.map((member) => (<div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/50"><Avatar className="h-8 w-8"><AvatarFallback className="bg-terrafusion-cyan/20 text-terrafusion-cyan text-xs">{member.avatar}</AvatarFallback></Avatar><div><><div className="text-white text-sm font-medium">{member.name}</div><div
</>
className="text-terrafusion-cyan/70 text-xs">{member.role}</div></div></div>))}</div></CardContent></Card>{/* Main Collaboration Interface */}<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{/* Left Side - Audit Context */}<div className="space-y-6">{/* Current Audit */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-white flex items-center gap-2"><><FileText className="h-5 w-5 text-terrafusion-cyan" />Current Audit</CardTitle><NotificationBadge
</>
entityType="audit" entityId={mockAudit.id} /></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><><label className="text-terrafusion-cyan/70 text-sm">Audit Number</label><div
</>
className="text-white font-medium">{mockAudit.auditNumber}</div></div><div><><label className="text-terrafusion-cyan/70 text-sm">Status</label><div
</></>><Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{mockAudit.status.replace('_', ' ').toUpperCase()}</Badge></div></div></div><div><><label className="text-terrafusion-cyan/70 text-sm">Property Address</label><div
</>
className="text-white">{mockAudit.propertyAddress}</div></div><div><><label className="text-terrafusion-cyan/70 text-sm">Assessed Value</label><div
</>
className="text-white font-medium">${mockAudit.assessedValue.toLocaleString()}</div></div></CardContent></Card>{/* Property Information */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-white flex items-center gap-2"><><Building2 className="h-5 w-5 text-terrafusion-cyan" />Property Details</CardTitle><NotificationBadge
</>
entityType="property" entityId={mockProperty.id} /></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><><label className="text-terrafusion-cyan/70 text-sm">Parcel Number</label><div
</>
className="text-white font-medium">{mockProperty.parcelNumber}</div></div><div><><label className="text-terrafusion-cyan/70 text-sm">Year Built</label><div
</>
className="text-white">{mockProperty.yearBuilt}</div></div></div><div><><label className="text-terrafusion-cyan/70 text-sm">Current Value</label><div
</>
className="text-white font-medium">${mockProperty.assessedValue.toLocaleString()}</div></div></CardContent></Card>{/* Activity Feed */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Activity className="h-5 w-5 text-terrafusion-cyan" />Recent Activity</CardTitle></CardHeader><CardContent><div className="space-y-3"><div className="flex items-start gap-3"><Avatar className="h-6 w-6"><AvatarFallback className="bg-terrafusion-cyan/20 text-terrafusion-cyan text-xs">SJ</AvatarFallback></Avatar><div className="flex-1"><div className="text-white text-sm"><span className="font-medium">Sarah Johnson</span>added an annotation to audit {mockAudit.auditNumber}</div><div className="text-terrafusion-cyan/70 text-xs">2 minutes ago</div></div></div><div className="flex items-start gap-3"><Avatar className="h-6 w-6"><AvatarFallback className="bg-terrafusion-cyan/20 text-terrafusion-cyan text-xs">MC</AvatarFallback></Avatar><div className="flex-1"><div className="text-white text-sm"><span className="font-medium">Mike Chen</span>resolved a compliance flag</div><div className="text-terrafusion-cyan/70 text-xs">15 minutes ago</div></div></div><div className="flex items-start gap-3"><Avatar className="h-6 w-6"><AvatarFallback className="bg-terrafusion-cyan/20 text-terrafusion-cyan text-xs">LR</AvatarFallback></Avatar><div className="flex-1"><div className="text-white text-sm"><span className="font-medium">Lisa Rodriguez</span>commented on property assessment</div><div className="text-terrafusion-cyan/70 text-xs">1 hour ago</div></div></div></div></CardContent></Card></div>{/* Right Side - Annotation System */}<div className="space-y-6"><Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-white flex items-center gap-2"><Pin className="h-5 w-5 text-terrafusion-cyan" />Collaborative Annotations</CardTitle></CardHeader><CardContent><Tabs defaultValue="audit" className="w-full"><TabsList className="grid w-full grid-cols-5"><><TabsTrigger value="audit">Annotations</TabsTrigger><TabsTrigger
</>
value="property">Notes</TabsTrigger><><TabsTrigger value="search">Search</TabsTrigger><TabsTrigger
</>
value="audit-trail">Trail</TabsTrigger><TabsTrigger value="team">Team</TabsTrigger></TabsList><TabsContent value="audit" className="mt-6"><><AnnotationSystem 
                      entityType="audit" 
                      entityId={mockAudit.id}
                      showCreateButton={true} /></TabsContent><TabsContent
</>
value="property" className="mt-6"><><AnnotationSystem 
                      entityType="property" 
                      entityId={mockProperty.id}
                      showCreateButton={true} /></TabsContent><TabsContent
</>
value="search" className="mt-6"><><AdvancedSearch 
                      onResultSelect={(result) => {
                        console.log('Selected search result:', result);
                        // Navigate to selected result}}
                      defaultFilters={{
                        entityType: 'all',
                        dateRange: '30d'}}
                    /></TabsContent><TabsContent
</>
value="audit-trail" className="mt-6"><><AuditTrail 
                      showFilters={true} /></TabsContent><TabsContent
</>
value="team" className="mt-6"><TeamPerformance 
                      dateRange="7d" /></TabsContent></Tabs></CardContent></Card></div></div>{/* Feature Showcase */}<Card className="bg-slate-800/50 border-terrafusion-cyan/20"><CardHeader><CardTitle className="text-white text-center">Collaborative Features</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="text-center space-y-3"><div className="h-12 w-12 mx-auto intelligence-mark flex items-center justify-center"><><MessageSquare className="h-6 w-6 text-white" /></div><h3
</>
className="text-white font-semibold">Real-time Annotations</h3><p className="text-terrafusion-cyan/70 text-sm">Add contextual notes, flags, and suggestions directly to audits and properties with instant team visibility.</p></div><div className="text-center space-y-3"><div className="h-12 w-12 mx-auto intelligence-mark flex items-center justify-center"><><Users className="h-6 w-6 text-white" /></div><h3
</>
className="text-white font-semibold">Team Collaboration</h3><p className="text-terrafusion-cyan/70 text-sm">Mention team members, track resolution status, and maintain threaded discussions for complex cases.</p></div><div className="text-center space-y-3"><div className="h-12 w-12 mx-auto intelligence-mark flex items-center justify-center"><><CheckCircle2 className="h-6 w-6 text-white" /></div><h3
</>
className="text-white font-semibold">Workflow Integration</h3><p className="text-terrafusion-cyan/70 text-sm">Seamlessly integrated with audit workflows, priority management, and compliance tracking systems.</p></div></div></CardContent></Card></div></div>
  );
}