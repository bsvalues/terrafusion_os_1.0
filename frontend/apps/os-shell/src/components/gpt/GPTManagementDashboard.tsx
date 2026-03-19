// TerraFusionGPT Suite: Management Dashboard Component
// Elite Government OS Engineering - GPT Management & Administration

import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  BarChart3,
  Download,
  Search,
  Filter,
  DollarSign,
  Users,
  Star,
  Settings,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { gptAPI, GPTConfiguration, GPTUsageStatistics } from '@/services/gptAPI';
import { gptHub } from '@/services/gptHub';
import { useSession } from '@/auth/useSession';

interface GPTManagementDashboardProps {
  onCreateGPT?: () => void;
  onEditGPT?: (gpt: GPTConfiguration) => void;
  onChatWithGPT?: (gpt: GPTConfiguration) => void;
}

type TabType = 'my-gpts' | 'installed' | 'all';
type SortBy = 'recent' | 'popular' | 'cost' | 'name';
type EditorMode = 'create' | 'edit';

type GPTFormState = {
  name: string;
  displayName: string;
  description: string;
  category: string;
  modelProvider: string;
  modelName: string;
  systemPrompt: string;
  temperature: string;
  maxTokens: string;
  topP: string;
  frequencyPenalty: string;
  presencePenalty: string;
  enableRAG: boolean;
  ragDatasetId: string;
  ragTopK: string;
  ragScoreThreshold: string;
  enableFunctions: boolean;
  functionsJson: string;
  requiredRole: string;
  isPublic: boolean;
  isFeatured: boolean;
  price: string;
};

const MODEL_PROVIDERS = ['OpenAI', 'Anthropic', 'Azure', 'Local'] as const;

const DEFAULT_FORM_STATE: GPTFormState = {
  name: '',
  displayName: '',
  description: '',
  category: '',
  modelProvider: 'OpenAI',
  modelName: 'gpt-4.1-mini',
  systemPrompt: '',
  temperature: '0.7',
  maxTokens: '4000',
  topP: '1',
  frequencyPenalty: '0',
  presencePenalty: '0',
  enableRAG: false,
  ragDatasetId: '',
  ragTopK: '5',
  ragScoreThreshold: '0.7',
  enableFunctions: false,
  functionsJson: '',
  requiredRole: '',
  isPublic: false,
  isFeatured: false,
  price: '0',
};

function toFormState(gpt?: GPTConfiguration | null): GPTFormState {
  if (!gpt) {
    return { ...DEFAULT_FORM_STATE };
  }

  return {
    name: gpt.name,
    displayName: gpt.displayName,
    description: gpt.description ?? '',
    category: gpt.category ?? '',
    modelProvider: gpt.modelProvider,
    modelName: gpt.modelName,
    systemPrompt: gpt.systemPrompt,
    temperature: String(gpt.temperature),
    maxTokens: String(gpt.maxTokens),
    topP: String(gpt.topP),
    frequencyPenalty: String(gpt.frequencyPenalty),
    presencePenalty: String(gpt.presencePenalty),
    enableRAG: gpt.enableRAG,
    ragDatasetId: gpt.ragDatasetId ? String(gpt.ragDatasetId) : '',
    ragTopK: String(gpt.ragTopK),
    ragScoreThreshold: String(gpt.ragScoreThreshold),
    enableFunctions: gpt.enableFunctions,
    functionsJson: gpt.functionsJson ?? '',
    requiredRole: gpt.requiredRole ?? '',
    isPublic: gpt.isPublic,
    isFeatured: gpt.isFeatured,
    price: String(gpt.price),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as {
      response?: { data?: { error?: string; message?: string } };
      message?: string;
    };
    return (
      maybeResponse.response?.data?.error ||
      maybeResponse.response?.data?.message ||
      maybeResponse.message ||
      fallback
    );
  }

  return fallback;
}

function normalizeOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseInteger(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseDecimal(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildManagementPayload(
  form: GPTFormState,
  existing?: GPTConfiguration | null,
): Partial<GPTConfiguration> {
  return {
    name: existing?.name ?? form.name.trim(),
    displayName: form.displayName.trim(),
    description: normalizeOptional(form.description),
    category: normalizeOptional(form.category),
    isSystemGPT: existing?.isSystemGPT ?? false,
    isPublic: form.isPublic,
    createdByUserId: existing?.createdByUserId,
    countyId: existing?.countyId,
    modelProvider: form.modelProvider,
    modelName: form.modelName.trim(),
    systemPrompt: form.systemPrompt.trim(),
    temperature: parseDecimal(form.temperature, existing?.temperature ?? 0.7),
    maxTokens: parseInteger(form.maxTokens, existing?.maxTokens ?? 4000),
    topP: parseDecimal(form.topP, existing?.topP ?? 1),
    frequencyPenalty: parseDecimal(
      form.frequencyPenalty,
      existing?.frequencyPenalty ?? 0,
    ),
    presencePenalty: parseDecimal(
      form.presencePenalty,
      existing?.presencePenalty ?? 0,
    ),
    enableRAG: form.enableRAG,
    ragDatasetId:
      form.enableRAG && form.ragDatasetId.trim().length > 0
        ? parseInteger(form.ragDatasetId, existing?.ragDatasetId ?? 0)
        : undefined,
    ragTopK: parseInteger(form.ragTopK, existing?.ragTopK ?? 5),
    ragScoreThreshold: parseDecimal(
      form.ragScoreThreshold,
      existing?.ragScoreThreshold ?? 0.7,
    ),
    enableFunctions: form.enableFunctions,
    functionsJson: form.enableFunctions ? normalizeOptional(form.functionsJson) : undefined,
    requiredRole: normalizeOptional(form.requiredRole),
    totalConversations: existing?.totalConversations ?? 0,
    totalMessages: existing?.totalMessages ?? 0,
    totalTokensUsed: existing?.totalTokensUsed ?? 0,
    totalCost: existing?.totalCost ?? 0,
    averageRating: existing?.averageRating,
    ratingCount: existing?.ratingCount ?? 0,
    installCount: existing?.installCount ?? 0,
    isFeatured: form.isFeatured,
    price: parseDecimal(form.price, existing?.price ?? 0),
    status: existing?.status ?? 'Active',
    version: existing?.version ?? '1.0',
    createdAt: existing?.createdAt,
    updatedAt: existing?.updatedAt,
    createdBy: existing?.createdBy,
    updatedBy: existing?.updatedBy,
  };
}

export const GPTManagementDashboard: React.FC<GPTManagementDashboardProps> = () => {
  const session = useSession();

  const [activeTab, setActiveTab] = useState<TabType>('my-gpts');
  const [allGPTs, setAllGPTs] = useState<GPTConfiguration[]>([]);
  const [myGPTs, setMyGPTs] = useState<GPTConfiguration[]>([]);
  const [installedGPTs, setInstalledGPTs] = useState<GPTConfiguration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedGPTStats, setSelectedGPTStats] = useState<GPTUsageStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gptToDelete, setGPTToDelete] = useState<GPTConfiguration | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGPT, setEditingGPT] = useState<GPTConfiguration | null>(null);
  const [editorForm, setEditorForm] = useState<GPTFormState>(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setNoticeMessage(null);
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const loadGPTs = async () => {
    setIsLoading(true);

    try {
      const gpts = await gptAPI.getAvailableGPTs();
      setAllGPTs(gpts);

      const currentUserId = session.userId;
      const myCreatedGPTs = gpts.filter((gpt) => gpt.createdByUserId === currentUserId);
      const myInstalledGPTs = gpts.filter(
        (gpt) => gpt.createdByUserId !== currentUserId && !gpt.isSystemGPT,
      );

      setMyGPTs(myCreatedGPTs);
      setInstalledGPTs(myInstalledGPTs);

      const nextCategories = Array.from(
        new Set(gpts.map((gpt) => gpt.category).filter(Boolean)),
      ) as string[];
      setCategories(nextCategories);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to load GPTs'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadGPTs();
  }, []);

  useEffect(() => {
    const connectHub = async () => {
      try {
        if (!gptHub.isConnected()) {
          await gptHub.start({
            onGPTUpdate: (update) => {
              const updateList = (gpts: GPTConfiguration[]) =>
                gpts.map((gpt) => (gpt.id === update.gptId ? { ...gpt, ...update.data } : gpt));

              setAllGPTs((prev) => updateList(prev));
              setMyGPTs((prev) => updateList(prev));
              setInstalledGPTs((prev) => updateList(prev));
            },
          });
        }
      } catch (error) {
        console.error('Failed to connect to GPT Hub:', error);
      }
    };

    void connectHub();
  }, []);

  const filteredGPTs = useMemo(() => {
    let gpts: GPTConfiguration[] = [];

    switch (activeTab) {
      case 'my-gpts':
        gpts = myGPTs;
        break;
      case 'installed':
        gpts = installedGPTs;
        break;
      default:
        gpts = allGPTs;
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      gpts = gpts.filter(
        (gpt) =>
          gpt.displayName.toLowerCase().includes(query) ||
          gpt.description?.toLowerCase().includes(query) ||
          gpt.category?.toLowerCase().includes(query),
      );
    }

    if (selectedCategory !== 'all') {
      gpts = gpts.filter((gpt) => gpt.category === selectedCategory);
    }

    return [...gpts].sort((left, right) => {
      switch (sortBy) {
        case 'recent':
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        case 'popular':
          return right.installCount - left.installCount;
        case 'cost':
          return right.totalCost - left.totalCost;
        case 'name':
          return left.displayName.localeCompare(right.displayName);
        default:
          return 0;
      }
    });
  }, [activeTab, allGPTs, installedGPTs, myGPTs, searchQuery, selectedCategory, sortBy]);

  const openCreateEditor = () => {
    clearMessages();
    setEditorMode('create');
    setEditingGPT(null);
    setEditorForm({ ...DEFAULT_FORM_STATE });
    setEditorOpen(true);
  };

  const openEditEditor = (gpt: GPTConfiguration) => {
    clearMessages();
    setEditorMode('edit');
    setEditingGPT(gpt);
    setEditorForm(toFormState(gpt));
    setEditorOpen(true);
  };

  const handleEditorSubmit = async () => {
    clearMessages();
    setIsSaving(true);

    try {
      const payload = buildManagementPayload(editorForm, editingGPT);

      if (editorMode === 'create') {
        const created = await gptAPI.createGPT(payload);
        setSuccessMessage(`GPT "${created.displayName}" created successfully`);
      } else if (editingGPT) {
        const updated = await gptAPI.updateGPT(editingGPT.id, payload);
        setSuccessMessage(`GPT "${updated.displayName}" updated successfully`);
      }

      setEditorOpen(false);
      setEditingGPT(null);
      await loadGPTs();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          editorMode === 'create' ? 'Failed to create GPT' : 'Failed to update GPT',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewStats = async (gpt: GPTConfiguration) => {
    clearMessages();
    setLoadingStats(true);
    setStatsDialogOpen(true);

    try {
      const stats = await gptAPI.getGPTStatistics(gpt.id);
      setSelectedGPTStats(stats);
    } catch (error) {
      setStatsDialogOpen(false);
      setErrorMessage(getErrorMessage(error, 'Failed to load statistics'));
    } finally {
      setLoadingStats(false);
    }
  };

  const handleDeleteClick = (gpt: GPTConfiguration) => {
    clearMessages();
    setGPTToDelete(gpt);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gptToDelete) {
      return;
    }

    setIsDeleting(true);
    clearMessages();

    try {
      await gptAPI.deleteGPT(gptToDelete.id);
      setSuccessMessage(`GPT "${gptToDelete.displayName}" archived successfully`);
      setDeleteDialogOpen(false);
      setGPTToDelete(null);
      await loadGPTs();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to delete GPT'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (gpt: GPTConfiguration) => {
    clearMessages();

    try {
      const duplicate = await gptAPI.createGPT({
        ...buildManagementPayload(toFormState(gpt), null),
        name: `${gpt.name}-copy`,
        displayName: `${gpt.displayName} (Copy)`,
      });
      setSuccessMessage(`GPT duplicated as "${duplicate.displayName}"`);
      await loadGPTs();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to duplicate GPT'));
    }
  };

  const handleToggleVisibility = async (gpt: GPTConfiguration) => {
    clearMessages();

    try {
      await gptAPI.updateGPT(gpt.id, { ...gpt, isPublic: !gpt.isPublic });
      setSuccessMessage(`GPT is now ${!gpt.isPublic ? 'public' : 'private'}`);
      await loadGPTs();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to update visibility'));
    }
  };

  const handleChat = (gpt: GPTConfiguration) => {
    clearMessages();
    setNoticeMessage(
      `Chat for ${gpt.displayName} stays queued until CP-W2-5 when conversation truth is opened.`,
    );
  };

  const formatCost = (cost: number): string => `$${cost.toFixed(4)}`;

  const formatNumber = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const renderGPTCard = (gpt: GPTConfiguration) => {
    const isMyGPT = myGPTs.some((candidate) => candidate.id === gpt.id);

    return (
      <Card key={gpt.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              {gpt.iconUrl ? (
                <img src={gpt.iconUrl} alt={gpt.displayName} className="h-12 w-12 rounded-lg" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {gpt.displayName.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{gpt.displayName}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {gpt.category && <Badge variant="secondary">{gpt.category}</Badge>}
                  {gpt.isSystemGPT && <Badge variant="outline">System</Badge>}
                  {isMyGPT && <Badge>Created by Me</Badge>}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Manage GPT ${gpt.displayName}`}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled onSelect={(event) => event.preventDefault()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat queued for CP-W2-5
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleViewStats(gpt)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Statistics
                </DropdownMenuItem>
                {isMyGPT && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => openEditEditor(gpt)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Configuration
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleDuplicate(gpt)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => void handleToggleVisibility(gpt)}>
                      {gpt.isPublic ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Make Private
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Make Public
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDeleteClick(gpt)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="line-clamp-2 mb-4">{gpt.description}</CardDescription>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatNumber(gpt.totalConversations)} conversations
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatCost(gpt.totalCost)} spent
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatNumber(gpt.installCount)} installs
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {gpt.averageRating?.toFixed(1) || 'N/A'} ({gpt.ratingCount})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {gpt.modelProvider}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {gpt.modelName}
            </Badge>
            {gpt.enableRAG && (
              <Badge variant="outline" className="text-xs">
                RAG
              </Badge>
            )}
            {gpt.enableFunctions && (
              <Badge variant="outline" className="text-xs">
                Functions
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Updated {new Date(gpt.updatedAt).toLocaleDateString()}</span>
            <Badge variant={gpt.status === 'Active' ? 'default' : 'secondary'}>{gpt.status}</Badge>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            className="flex-1"
            variant="outline"
            disabled
            aria-label={`Chat queued for ${gpt.displayName}`}
            onClick={() => handleChat(gpt)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat queued
          </Button>
          <Button
            variant="outline"
            aria-label={`View statistics for ${gpt.displayName}`}
            onClick={() => void handleViewStats(gpt)}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          {isMyGPT && (
            <Button
              variant="outline"
              aria-label={`Edit GPT ${gpt.displayName}`}
              onClick={() => openEditEditor(gpt)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const renderStatsDialog = () => {
    if (!selectedGPTStats) return null;

    return (
      <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>GPT Statistics: {selectedGPTStats.gptName}</DialogTitle>
            <DialogDescription>
              Usage statistics from {new Date(selectedGPTStats.periodStart).toLocaleDateString()}{' '}
              to {new Date(selectedGPTStats.periodEnd).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {loadingStats ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(selectedGPTStats.totalConversations)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(selectedGPTStats.totalMessages)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Tokens</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatNumber(selectedGPTStats.totalTokens)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Total Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{formatCost(selectedGPTStats.totalCost)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Unique Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      <p className="text-xl font-semibold">{selectedGPTStats.uniqueUsers}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-600">Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <p className="text-xl font-semibold">
                        {selectedGPTStats.averageRating.toFixed(1)}/5.0
                      </p>
                      <span className="text-sm text-gray-500">({selectedGPTStats.ratingCount} ratings)</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cost Per Conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">
                    {formatCost(selectedGPTStats.totalCost / Math.max(selectedGPTStats.totalConversations, 1))}
                  </p>
                  <Progress value={Math.min(selectedGPTStats.totalCost, 100)} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDeleteDialog = () => (
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete GPT</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{gptToDelete?.displayName}"? This action archives the GPT from active collections.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Active listings will drop this GPT after deletion. Historical records may still exist for audit continuity.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void handleDeleteConfirm()} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete GPT'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderEditorDialog = () => (
    <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editorMode === 'create' ? 'Create GPT' : 'Edit GPT Configuration'}</DialogTitle>
          <DialogDescription>
            {editorMode === 'create'
              ? 'Create a real GPT configuration on the canonical /api/gpt surface.'
              : 'Update the live GPT configuration using the canonical /api/gpt/{id} contract.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gpt-name">GPT name</Label>
            <Input
              id="gpt-name"
              aria-label="GPT name"
              value={editorForm.name}
              disabled={editorMode === 'edit' || isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            {editorMode === 'edit' && (
              <p className="text-xs text-gray-500">Backend truth: `name` is immutable after creation in the update lane.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-display-name">Display name</Label>
            <Input
              id="gpt-display-name"
              aria-label="GPT display name"
              value={editorForm.displayName}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, displayName: event.target.value }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gpt-description">Description</Label>
            <Textarea
              id="gpt-description"
              aria-label="GPT description"
              value={editorForm.description}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-category">Category</Label>
            <Input
              id="gpt-category"
              aria-label="GPT category"
              value={editorForm.category}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, category: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-model-provider">Model provider</Label>
            <Select
              value={editorForm.modelProvider}
              onValueChange={(value) => setEditorForm((prev) => ({ ...prev, modelProvider: value }))}
              disabled={isSaving}
            >
              <SelectTrigger id="gpt-model-provider" aria-label="GPT model provider">
                <SelectValue placeholder="Model provider" />
              </SelectTrigger>
              <SelectContent>
                {MODEL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-model-name">Model name</Label>
            <Input
              id="gpt-model-name"
              aria-label="GPT model name"
              value={editorForm.modelName}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, modelName: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-required-role">Required role</Label>
            <Input
              id="gpt-required-role"
              aria-label="GPT required role"
              value={editorForm.requiredRole}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, requiredRole: event.target.value }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gpt-system-prompt">System prompt</Label>
            <Textarea
              id="gpt-system-prompt"
              aria-label="GPT system prompt"
              value={editorForm.systemPrompt}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, systemPrompt: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-temperature">Temperature</Label>
            <Input
              id="gpt-temperature"
              aria-label="GPT temperature"
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={editorForm.temperature}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, temperature: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-max-tokens">Max tokens</Label>
            <Input
              id="gpt-max-tokens"
              aria-label="GPT max tokens"
              type="number"
              min="100"
              max="128000"
              value={editorForm.maxTokens}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, maxTokens: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-top-p">Top P</Label>
            <Input
              id="gpt-top-p"
              aria-label="GPT top p"
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={editorForm.topP}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, topP: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpt-price">Price</Label>
            <Input
              id="gpt-price"
              aria-label="GPT price"
              type="number"
              min="0"
              step="0.01"
              value={editorForm.price}
              disabled={isSaving}
              onChange={(event) => setEditorForm((prev) => ({ ...prev, price: event.target.value }))}
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="gpt-public-switch">Public visibility</Label>
                <p className="text-xs text-gray-500">Uses the canonical update contract on the GPT record.</p>
              </div>
              <Switch
                id="gpt-public-switch"
                aria-label="GPT public visibility"
                checked={editorForm.isPublic}
                disabled={isSaving}
                onCheckedChange={(checked) => setEditorForm((prev) => ({ ...prev, isPublic: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="gpt-featured-switch">Featured</Label>
                <p className="text-xs text-gray-500">Featured state persists as `isFeatured` on the GPT record.</p>
              </div>
              <Switch
                id="gpt-featured-switch"
                aria-label="GPT featured"
                checked={editorForm.isFeatured}
                disabled={isSaving}
                onCheckedChange={(checked) => setEditorForm((prev) => ({ ...prev, isFeatured: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="gpt-rag-switch">Enable RAG</Label>
                <p className="text-xs text-gray-500">If enabled, backend validation requires a dataset id.</p>
              </div>
              <Switch
                id="gpt-rag-switch"
                aria-label="GPT enable rag"
                checked={editorForm.enableRAG}
                disabled={isSaving}
                onCheckedChange={(checked) => setEditorForm((prev) => ({ ...prev, enableRAG: checked }))}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="gpt-functions-switch">Enable functions</Label>
                <p className="text-xs text-gray-500">Function JSON only ships when this is enabled.</p>
              </div>
              <Switch
                id="gpt-functions-switch"
                aria-label="GPT enable functions"
                checked={editorForm.enableFunctions}
                disabled={isSaving}
                onCheckedChange={(checked) => setEditorForm((prev) => ({ ...prev, enableFunctions: checked }))}
              />
            </div>
          </div>

          {editorForm.enableRAG && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gpt-rag-dataset-id">RAG dataset id</Label>
                <Input
                  id="gpt-rag-dataset-id"
                  aria-label="GPT rag dataset id"
                  type="number"
                  value={editorForm.ragDatasetId}
                  disabled={isSaving}
                  onChange={(event) => setEditorForm((prev) => ({ ...prev, ragDatasetId: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpt-rag-top-k">RAG Top K</Label>
                <Input
                  id="gpt-rag-top-k"
                  aria-label="GPT rag top k"
                  type="number"
                  min="1"
                  value={editorForm.ragTopK}
                  disabled={isSaving}
                  onChange={(event) => setEditorForm((prev) => ({ ...prev, ragTopK: event.target.value }))}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gpt-rag-threshold">RAG score threshold</Label>
                <Input
                  id="gpt-rag-threshold"
                  aria-label="GPT rag score threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editorForm.ragScoreThreshold}
                  disabled={isSaving}
                  onChange={(event) => setEditorForm((prev) => ({ ...prev, ragScoreThreshold: event.target.value }))}
                />
              </div>
            </>
          )}

          {editorForm.enableFunctions && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gpt-functions-json">Functions JSON</Label>
              <Textarea
                id="gpt-functions-json"
                aria-label="GPT functions json"
                value={editorForm.functionsJson}
                disabled={isSaving}
                onChange={(event) => setEditorForm((prev) => ({ ...prev, functionsJson: event.target.value }))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={() => void handleEditorSubmit()} disabled={isSaving}>
            {isSaving ? 'Saving...' : editorMode === 'create' ? 'Create GPT' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="h-full flex flex-col" data-testid="gpt-management-dashboard">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">My GPTs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create, edit, review statistics, and retire GPT configurations on the canonical service lane.
            </p>
          </div>

          <Button onClick={openCreateEditor} aria-label="Create GPT">
            <Plus className="h-4 w-4 mr-2" />
            Create GPT
          </Button>
        </div>

        <Alert className="mb-4 border-blue-200 bg-blue-50 text-blue-900">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Live in this slice: create, edit, duplicate, visibility, delete, and statistics. Chat remains deferred until CP-W2-5.
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search GPTs..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="cost">Highest Cost</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {noticeMessage && (
        <Alert className="m-6 mb-0">
          <Info className="h-4 w-4" />
          <AlertDescription>{noticeMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert className="m-6 mb-0">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive" className="m-6 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex-1 flex flex-col">
        <div className="px-6 pt-4 border-b">
          <TabsList>
            <TabsTrigger value="my-gpts">My GPTs ({myGPTs.length})</TabsTrigger>
            <TabsTrigger value="installed">Installed ({installedGPTs.length})</TabsTrigger>
            <TabsTrigger value="all">All Available ({allGPTs.length})</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-12" data-testid="gpt-management-loading">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading GPTs...</p>
                </div>
              ) : filteredGPTs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTab === 'my-gpts' ? "You haven't created any GPTs yet" : 'No GPTs found'}
                  </p>
                  {activeTab === 'my-gpts' && (
                    <Button onClick={openCreateEditor}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First GPT
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGPTs.map(renderGPTCard)}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Tabs>

      {renderStatsDialog()}
      {renderDeleteDialog()}
      {renderEditorDialog()}
    </div>
  );
};

export default GPTManagementDashboard;
