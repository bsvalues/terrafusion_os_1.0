import {useState} from "react";
import MainLayout from "@/layouts/main-layout";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Progress} from "@/components/ui/progress";
import {CheckCircle, 
  Warning, 
  Clock,
  Target,
  Palette,
  Type,
  Image,
  MessageSquare,
  Monitor,
  FileText,
  Shield,
  TrendingUp} from '@mui/icons-material';

interface ChecklistItem {id: string;
  category: string;
  item: string;
  specification: string;
  implementation: string;
  status: 'complete' | 'partial' | 'pending';
  priority: 'immediate' | 'short-term' | 'long-term';}

const brandChecklist: ChecklistItem[] = [
  // Visual Identity System
  {id: 'logo-primary',
    category: 'Visual Identity',
    item: 'Primary Intelligence Mark',
    specification: 'Linear gradient from #0891b2 to #00d2ff, 48px minimum, official communications',
    implementation: 'Implemented in sidebar with correct gradient and proportions',
    status: 'complete',
    priority: 'immediate'},
  {id: 'logo-variations',
    category: 'Visual Identity',
    item: 'Logo Variations (Flowing, Architectural, Minimal)',
    specification: 'Multi-gradient flowing effects, geometric depth, monochrome variations',
    implementation: 'Primary mark implemented, other variations pending',
    status: 'partial',
    priority: 'short-term'},
  
  // Color Palette
  {id: 'color-primary',
    category: 'Color System',
    item: 'Primary Colors Implementation',
    specification: 'Terrafusion Cyan #00d2ff, Intelligence Blue #0891b2, Authority Teal #3a7bd5, Innovation Purple #667eea',
    implementation: 'All primary colors implemented in CSS variables and components',
    status: 'complete',
    priority: 'immediate'},
  {id: 'color-secondary',
    category: 'Color System',
    item: 'Secondary Colors Implementation',
    specification: 'Success Green #10b981, Warning Amber #f59e0b, Critical Red #ef4444, Neutral Gray #6b7280',
    implementation: 'Functional colors implemented for status indicators and alerts',
    status: 'complete',
    priority: 'immediate'},
  {id: 'gradients',
    category: 'Color System',
    item: 'Gradient Combinations',
    specification: 'Primary: #0891b2 → #00d2ff, Secondary: #00d2ff → #3a7bd5 → #667eea, Accent: #3a7bd5 → #00d2ff',
    implementation: 'All gradient combinations implemented in brand classes',
    status: 'complete',
    priority: 'immediate'},

  // Typography
  {id: 'font-primary',
    category: 'Typography',
    item: 'Primary Typeface: Inter',
    specification: 'Weights 300-700, body text, UI elements, general communication',
    implementation: 'Inter font loaded and implemented for all body text',
    status: 'complete',
    priority: 'immediate'},
  {id: 'font-secondary',
    category: 'Typography',
    item: 'Secondary Typeface: JetBrains Mono',
    specification: 'Weights 400-700, code snippets, technical documentation',
    implementation: 'JetBrains Mono loaded with font-jetbrains class',
    status: 'complete',
    priority: 'immediate'},
  {id: 'font-display',
    category: 'Typography',
    item: 'Display Typeface: Orbitron',
    specification: 'Weights 400-900, headlines, brand statements, hero text',
    implementation: 'Orbitron implemented for hero headings and brand titles',
    status: 'complete',
    priority: 'immediate'},

  // Voice & Tone
  {id: 'voice-authoritative',
    category: 'Voice & Tone',
    item: 'Authoritative Voice',
    specification: 'Speak with confidence and expertise, definitive source for territorial intelligence',
    implementation: 'Implemented in Terrafusion Enterprise messaging and content',
    status: 'complete',
    priority: 'immediate'},
  {id: 'voice-innovative',
    category: 'Voice & Tone',
    item: 'Innovative Messaging',
    specification: 'Highlight cutting-edge capabilities, pioneering future of civil infrastructure',
    implementation: 'Messaging focuses on AI advancement and territorial intelligence innovation',
    status: 'complete',
    priority: 'immediate'},
  {id: 'voice-aspirational',
    category: 'Voice & Tone',
    item: 'Aspirational Standard',
    specification: 'The standard that creates competitive envy, transforming counties into legends',
    implementation: '"Intelligence That Counties Envy" tagline consistently applied',
    status: 'complete',
    priority: 'immediate'},

  // Digital Applications
  {id: 'website-design',
    category: 'Digital Brand',
    item: 'Website Design System',
    specification: 'Clean, modern, data-driven layout with dark themes and brand accent colors',
    implementation: 'Dark theme with brand colors, modern card-based layout implemented',
    status: 'complete',
    priority: 'immediate'},
  {id: 'software-interface',
    category: 'Digital Brand',
    item: 'Software Interface Consistency',
    specification: 'Consistent components, predictable interactions, accessible color coding',
    implementation: 'Brand-compliant card system and component library established',
    status: 'complete',
    priority: 'immediate'},
  {id: 'navigation',
    category: 'Digital Brand',
    item: 'Intuitive Government-Focused Navigation',
    specification: 'Role-based navigation structure optimized for government users',
    implementation: 'Sidebar navigation with clear categorization and brand styling',
    status: 'complete',
    priority: 'immediate'},

  // Brand Applications
  {id: 'presentations',
    category: 'Brand Applications',
    item: 'Brand-Compliant Presentation Templates',
    specification: 'Consistent templates with brand compliance for government presentations',
    implementation: 'Brand showcase page created, templates pending',
    status: 'partial',
    priority: 'short-term'},
  {id: 'documentation',
    category: 'Brand Applications',
    item: 'Professional Documentation Style',
    specification: 'Subtle logo placement, consistent formatting, logical structure',
    implementation: 'Brand specification documentation created and maintained',
    status: 'complete',
    priority: 'immediate'},

  // Brand Protection
  {id: 'asset-management',
    category: 'Brand Protection',
    item: 'Centralized Brand Asset Library',
    specification: 'Official logo files, brand guidelines, centralized management',
    implementation: 'CSS-based brand system established, asset library development needed',
    status: 'partial',
    priority: 'short-term'},
  {id: 'compliance-monitoring',
    category: 'Brand Protection',
    item: 'Brand Compliance Review Process',
    specification: 'All materials reviewed before publication, regular audits',
    implementation: 'Brand checklist system implemented for monitoring compliance',
    status: 'complete',
    priority: 'immediate'}
];

export default function BrandChecklistPage() {const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(brandChecklist.map(item =>item.category)));
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return<CheckCircle className="h-5 w-5 text-[#10b981]" />;
      case 'partial': return <Clock className="h-5 w-5 text-[#f59e0b]" />;
      case 'pending': return <Warning className="h-5 w-5 text-[#ef4444]" />;
      default: return <Target className="h-5 w-5 text-[#6b7280]" />;}
  };

  const getStatusBadge = (status: string) =>{const colors = {
      complete: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30',
      partial: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30',
      pending: 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'};
    return colors[status as keyof typeof colors] || 'bg-[#6b7280]/20 text-[#6b7280] border-[#6b7280]/30';
  };

  const getCategoryIcon = (category: string) => {const icons = {
      'Visual Identity': Palette,
      'Color System': Palette,
      'Typography': Type,
      'Voice & Tone': MessageSquare,
      'Digital Brand': Monitor,
      'Brand Applications': FileText,
      'Brand Protection': Shield};
    const IconComponent = icons[category as keyof typeof icons] || Target;
    return<IconComponent className="h-5 w-5" />;
  };

  const filteredItems = selectedCategory 
    ? brandChecklist.filter(item =>item.category === selectedCategory)
    : brandChecklist;

  const completionStats = {total: brandChecklist.length,
    complete: brandChecklist.filter(item => item.status === 'complete').length,
    partial: brandChecklist.filter(item => item.status === 'partial').length,
    pending: brandChecklist.filter(item => item.status === 'pending').length};

  const completionPercentage = Math.round((completionStats.complete / completionStats.total) * 100);

  return (<div className="space-y-6 p-6">{/* Header */}<div className="text-center space-y-4"><><h1 className="text-brand-hero font-orbitron bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent">Brand Implementation</h1><p
</>className="text-brand-title font-orbitron text-[#00d2ff]">
            Compliance Verification System</p><p className="text-xl text-gray-300 max-w-3xl mx-auto">Systematic verification of Terrafusion brand specification implementation 
            across all enterprise touchpoints and digital properties.</p></div>{/* Overall Progress */}<Card className="brand-card"><CardHeader className="brand-card-header"><CardTitle className="flex items-center gap-3"><div className="h-10 w-10 intelligence-mark flex items-center justify-center"><><TrendingUp className="h-6 w-6 text-white" /></div><div
</></>><><div className="text-xl font-bold text-white">Implementation Progress</div><div
</>
className="text-sm text-[#00d2ff]">Brand Specification Compliance Status</div></div></CardTitle></CardHeader><CardContent className="pt-6"><div className="space-y-6"><div className="text-center"><><div className="text-4xl font-bold text-[#00d2ff] mb-2">{completionPercentage}%</div><div
</>
className="text-lg text-white">Overall Compliance</div><><Progress value={completionPercentage} className="mt-4 h-3" /></div><div
</>
className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="text-center p-4 bg-[#10b981]/10 rounded-lg border border-[#10b981]/30"><><div className="text-2xl font-bold text-[#10b981]">{completionStats.complete}</div><div
</>
className="text-sm text-gray-300">Complete</div></div><div className="text-center p-4 bg-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/30"><><div className="text-2xl font-bold text-[#f59e0b]">{completionStats.partial}</div><div
</>
className="text-sm text-gray-300">Partial</div></div><div className="text-center p-4 bg-[#ef4444]/10 rounded-lg border border-[#ef4444]/30"><><div className="text-2xl font-bold text-[#ef4444]">{completionStats.pending}</div><div
</>
className="text-sm text-gray-300">Pending</div></div></div></div></CardContent></Card>{/* Category Filters */}<Card className="brand-card"><CardHeader><><CardTitle className="text-white">Brand Categories</CardTitle><CardDescription
</>className="text-gray-300">
              Filter implementation items by brand specification category</CardDescription></CardHeader><CardContent><div className="flex flex-wrap gap-2"><button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedCategory === null 
                    ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/30' 
                    : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'}`}
              ><Target className="h-4 w-4" />All Categories</button>{categories.map((category) => (<button
                  key={category}
                  onClick={() =>setSelectedCategory(category)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    selectedCategory === category 
                      ? 'bg-[#00d2ff]/20 text-[#00d2ff] border-[#00d2ff]/30' 
                      : 'bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700'}`}
                >
                  {getCategoryIcon(category)}
                  {category}</button>))}</div></CardContent></Card>{/* Implementation Checklist */}<div className="space-y-4">{filteredItems.map((item) => (<Card key={item.id} className="brand-card"><CardContent className="p-6"><div className="flex items-start justify-between"><div className="flex items-start gap-4 flex-1">{getStatusIcon(item.status)}<div className="flex-1"><div className="flex items-center gap-3 mb-2"><><h3 className="text-lg font-semibold text-white">{item.item}</h3><Badge
</>className={getStatusBadge(item.status)}>
                          {item.status}</Badge><Badge variant="outline" className="text-[#3a7bd5] border-[#3a7bd5]/30">{item.category}</Badge></div><div className="space-y-3 text-sm"><div><><div className="text-gray-400 font-medium mb-1">Brand Specification:</div><div
</>
className="text-gray-300">{item.specification}</div></div><div><><div className="text-gray-400 font-medium mb-1">Current Implementation:</div><div
</>
className="text-gray-300">{item.implementation}</div></div></div></div></div></div></CardContent></Card>))}</div>{/* Next Steps */}<Card className="brand-card"><CardHeader className="brand-card-header"><CardTitle className="text-white">Implementation Roadmap</CardTitle></CardHeader><CardContent className="pt-6"><div className="space-y-4"><div><><h4 className="text-white font-semibold mb-2">Immediate Actions (Week 1)</h4><ul
</>
className="text-gray-300 space-y-1 ml-4"><><li>✅ Deploy primary logo across all digital properties</li><li
</></>>✅ Update website with brand-compliant design</li><><li>✅ Implement brand guidelines in interface components</li><li
</></>>✅ Create brand-compliant presentation templates</li></ul></div><div><><h4 className="text-white font-semibold mb-2">Short-term Goals (Month 1)</h4><ul
</>
className="text-gray-300 space-y-1 ml-4"><><li>🔄 Complete brand asset library development</li><li
</></>>🔄 Train all team members on brand guidelines</li><><li>✅ Implement brand compliance review process</li><li
</></>>🔄 Launch brand-compliant marketing materials</li></ul></div><div><><h4 className="text-white font-semibold mb-2">Long-term Objectives (Quarter 1)</h4><ul
</>
className="text-gray-300 space-y-1 ml-4"><><li>⏳ Achieve consistent brand application across all touchpoints</li><li
</></>>⏳ Establish brand recognition metrics and tracking</li><><li>⏳ Develop brand protection and enforcement procedures</li><li
</></>>⏳ Create brand evolution and refresh planning process</li></ul></div></div></CardContent></Card></div></div>
  );
}