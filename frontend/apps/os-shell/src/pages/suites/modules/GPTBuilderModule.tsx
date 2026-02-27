/**
 * GPT Builder Module -- Custom GPT Configuration Creator
 * ===================================================================
 * Constitutional module of TerraGPT (Article V Section 5.1).
 * Owns: Custom GPT creation, prompt engineering, RAG wiring, function binding.
 */

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Wrench, Bot, Save, Play, Database, Zap, Shield, Clock } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface GptDraft {
  name: string;
  displayName: string;
  description: string;
  category: string;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enableRAG: boolean;
  ragDatasetId: string;
  enableFunctions: boolean;
  isPublic: boolean;
  requiredRole: string;
}

interface GptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  systemPromptPreview: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data                                                                   */
/* -------------------------------------------------------------------------- */

const TEMPLATES: GptTemplate[] = [
  { id: 'property-assist', name: 'Property Assistant', description: 'Answers questions about property assessments and valuations', category: 'Assessment', systemPromptPreview: 'You are a property assessment assistant...' },
  { id: 'zoning-advisor', name: 'Zoning Advisor', description: 'Provides guidance on zoning regulations and land use', category: 'Planning', systemPromptPreview: 'You are a zoning and land use advisor...' },
  { id: 'tax-calc', name: 'Tax Calculator', description: 'Calculates property tax estimates with levy rates', category: 'Tax', systemPromptPreview: 'You are a property tax calculation assistant...' },
  { id: 'appeal-guide', name: 'Appeal Guide', description: 'Guides citizens through the BOE appeal process', category: 'Appeals', systemPromptPreview: 'You help citizens understand the Board of Equalization appeal process...' },
  { id: 'data-analyst', name: 'Data Analyst', description: 'Queries and analyzes county property data', category: 'Analytics', systemPromptPreview: 'You are a county data analyst with SQL capabilities...' },
  { id: 'compliance', name: 'Compliance Checker', description: 'Validates IAAO standards and FISMA compliance', category: 'Compliance', systemPromptPreview: 'You are a government compliance specialist...' },
];

const CATEGORIES = ['Assessment', 'Planning', 'Tax', 'Appeals', 'Analytics', 'Compliance', 'General', 'Custom'];
const MODELS = [
  { provider: 'openai', name: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
  { provider: 'openai', name: 'gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
  { provider: 'anthropic', name: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { provider: 'local', name: 'llama-3.1-70b', label: 'LLaMA 3.1 70B (Local)' },
];

const DEFAULT_DRAFT: GptDraft = {
  name: '', displayName: '', description: '', category: 'Assessment',
  modelProvider: 'openai', modelName: 'gpt-4o', systemPrompt: '',
  temperature: 0.7, maxTokens: 4096, enableRAG: false, ragDatasetId: '',
  enableFunctions: false, isPublic: false, requiredRole: 'assessor',
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function GPTBuilderModule() {
  const [draft, setDraft] = useState<GptDraft>(DEFAULT_DRAFT);
  const [step, setStep] = useState<'template' | 'configure' | 'prompt' | 'test'>('template');

  const updateDraft = useCallback(<K extends keyof GptDraft>(key: K, value: GptDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyTemplate = useCallback((template: GptTemplate) => {
    setDraft((prev) => ({
      ...prev,
      name: template.id,
      displayName: template.name,
      description: template.description,
      category: template.category,
      systemPrompt: template.systemPromptPreview,
    }));
    setStep('configure');
  }, []);

  const steps = [
    { id: 'template' as const, label: '1. Template', icon: Bot },
    { id: 'configure' as const, label: '2. Configure', icon: Wrench },
    { id: 'prompt' as const, label: '3. System Prompt', icon: Zap },
    { id: 'test' as const, label: '4. Test', icon: Play },
  ];

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-2xl font-semibold flex items-center gap-3' style={{ color: 'hsl(var(--tf-fg))' }}>
          <Wrench style={{ color: 'hsl(var(--tf-suite-gpt))' }} size={28} />
          GPT Builder
        </h2>
        <p style={{ color: 'hsl(var(--tf-muted))' }} className='mt-1'>
          Create custom GPT configurations with RAG and function binding
        </p>
      </div>

      {/* Step Navigation */}
      <div className='flex items-center gap-2'>
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              style={{ border: `1px solid ${isActive ? 'hsl(var(--tf-suite-gpt) / 0.4)' : 'hsl(var(--tf-border))'}` }}
            >
              <Icon size={16} style={{ color: isActive ? 'hsl(var(--tf-suite-gpt))' : 'hsl(var(--tf-muted))' }} />
              <span className='text-sm' style={{ color: isActive ? 'hsl(var(--tf-fg))' : 'hsl(var(--tf-muted))' }}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      {step === 'template' && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardHeader>
            <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Choose a Starting Template</CardTitle>
            <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
              Start from a template or begin from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className='text-left p-4 rounded-lg hover:bg-white/5 transition-colors'
                  style={{ background: 'hsl(var(--tf-bg))', border: '1px solid hsl(var(--tf-border))' }}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <Bot size={16} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                    <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-fg))' }}>{tpl.name}</span>
                  </div>
                  <p className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>{tpl.description}</p>
                  <Badge variant='outline' className='text-xs mt-2' style={{ borderColor: 'hsl(var(--tf-border))' }}>
                    {tpl.category}
                  </Badge>
                </button>
              ))}
              <button
                onClick={() => setStep('configure')}
                className='text-left p-4 rounded-lg hover:bg-white/5 transition-colors border-dashed'
                style={{ background: 'hsl(var(--tf-bg))', border: '2px dashed hsl(var(--tf-border))' }}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <Wrench size={16} style={{ color: 'hsl(var(--tf-muted))' }} />
                  <span className='text-sm font-medium' style={{ color: 'hsl(var(--tf-muted))' }}>Start from Scratch</span>
                </div>
                <p className='text-xs' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>Build a custom GPT with full control</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'configure' && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Identity</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Display Name</label>
                <Input value={draft.displayName} onChange={(e) => updateDraft('displayName', e.target.value)} className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }} />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Description</label>
                <textarea
                  value={draft.description}
                  onChange={(e) => updateDraft('description', e.target.value)}
                  rows={3}
                  className='w-full mt-1 p-2 rounded-lg text-sm resize-y'
                  style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))', border: '1px solid', color: 'hsl(var(--tf-fg))' }}
                />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Category</label>
                <Select value={draft.category} onValueChange={(v) => updateDraft('category', v)}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardHeader>
              <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>Model & Parameters</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Model</label>
                <Select value={`${draft.modelProvider}/${draft.modelName}`} onValueChange={(v) => { const [p, n] = v.split('/'); updateDraft('modelProvider', p); updateDraft('modelName', n); }}>
                  <SelectTrigger className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => <SelectItem key={`${m.provider}/${m.name}`} value={`${m.provider}/${m.name}`}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Temperature: {draft.temperature}</label>
                <input type='range' min={0} max={2} step={0.1} value={draft.temperature} onChange={(e) => updateDraft('temperature', Number(e.target.value))} className='w-full mt-1' />
              </div>
              <div>
                <label className='text-xs' style={{ color: 'hsl(var(--tf-muted))' }}>Max Tokens</label>
                <Input type='number' value={draft.maxTokens} onChange={(e) => updateDraft('maxTokens', Number(e.target.value))} className='mt-1' style={{ background: 'hsl(var(--tf-input-bg))', borderColor: 'hsl(var(--tf-border))' }} />
              </div>
              <Separator style={{ background: 'hsl(var(--tf-border))' }} />
              <div className='space-y-3'>
                <label className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Database size={14} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                    <span className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>Enable RAG</span>
                  </div>
                  <Switch checked={draft.enableRAG} onCheckedChange={(v) => updateDraft('enableRAG', v)} />
                </label>
                <label className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Zap size={14} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                    <span className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>Enable Functions</span>
                  </div>
                  <Switch checked={draft.enableFunctions} onCheckedChange={(v) => updateDraft('enableFunctions', v)} />
                </label>
                <label className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Shield size={14} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                    <span className='text-sm' style={{ color: 'hsl(var(--tf-fg))' }}>Public</span>
                  </div>
                  <Switch checked={draft.isPublic} onCheckedChange={(v) => updateDraft('isPublic', v)} />
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 'prompt' && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardHeader>
            <CardTitle className='text-base' style={{ color: 'hsl(var(--tf-fg))' }}>System Prompt</CardTitle>
            <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
              Define the GPT's behavior, personality, and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={draft.systemPrompt}
              onChange={(e) => updateDraft('systemPrompt', e.target.value)}
              rows={16}
              className='w-full font-mono text-sm p-4 rounded-lg resize-y'
              style={{ background: 'hsl(var(--tf-bg))', color: 'hsl(var(--tf-fg))', border: '1px solid hsl(var(--tf-border))' }}
              placeholder='You are a government property assessment assistant for Benton County, WA...'
              spellCheck={false}
            />
            <p className='text-xs mt-2' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>
              {draft.systemPrompt.length} characters · Best practice: be specific about role, boundaries, and data access
            </p>
          </CardContent>
        </Card>
      )}

      {step === 'test' && (
        <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
          <CardContent className='p-12 flex flex-col items-center justify-center min-h-[400px]'>
            <Play size={48} style={{ color: 'hsl(var(--tf-suite-gpt) / 0.3)' }} />
            <p className='mt-4 text-lg' style={{ color: 'hsl(var(--tf-muted))' }}>Test Your GPT</p>
            <p className='text-sm mt-1' style={{ color: 'hsl(var(--tf-muted) / 0.6)' }}>
              {draft.displayName || 'Unnamed GPT'} · {draft.modelName} · Temp {draft.temperature}
            </p>
            <p className='text-xs mt-4' style={{ color: 'hsl(var(--tf-muted) / 0.5)' }}>
              Chat sandbox connects to the governed TerraFusion inference endpoint
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          {draft.displayName && (
            <Badge variant='outline' style={{ background: 'hsl(var(--tf-suite-gpt) / 0.1)', color: 'hsl(var(--tf-suite-gpt))', borderColor: 'hsl(var(--tf-suite-gpt) / 0.3)' }}>
              {draft.displayName}
            </Badge>
          )}
          {draft.enableRAG && <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>RAG</Badge>}
          {draft.enableFunctions && <Badge variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>Functions</Badge>}
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' style={{ borderColor: 'hsl(var(--tf-border))' }}>
            <Clock size={14} className='mr-1' /> Save Draft
          </Button>
          <Button style={{ background: 'hsl(var(--tf-suite-gpt))', color: 'hsl(var(--tf-bg))' }}>
            <Save size={14} className='mr-1' /> Publish GPT
          </Button>
        </div>
      </div>
    </div>
  );
}
