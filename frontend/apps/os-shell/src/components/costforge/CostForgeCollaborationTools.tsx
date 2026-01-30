/**
 * ═══════════════════════════════════════════════════════════════
 * COSTFORGE COLLABORATION TOOLS - TEAM COORDINATION
 * Migrated from TerraBuild CollaborationTools with CostForge integration
 * THE TERRAFUSION WAY - GOVERNMENT-GRADE TEAMWORK
 * ═══════════════════════════════════════════════════════════════
 */

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  MessageCircle,
  Share2,
  Star,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// CostForge Collaboration Types
interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'offline' | 'busy';
  lastSeen: string;
  permissions: string[];
}

interface ProjectComment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  type: 'comment' | 'approval' | 'revision' | 'question';
  attachments?: string[];
  mentions?: string[];
}

interface ProjectActivity {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'estimation' | 'review' | 'approval' | 'export' | 'revision';
}

// Mock CostForge team data
const costForgeTeam: TeamMember[] = [
  {
    id: 'cf-001',
    name: 'Sarah Chen',
    role: 'Lead Cost Estimator',
    avatar: '👩‍💼',
    status: 'online',
    lastSeen: '2 minutes ago',
    permissions: ['estimate', 'approve', 'export', 'manage'],
  },
  {
    id: 'cf-002',
    name: 'Marcus Rodriguez',
    role: 'Senior Analyst',
    avatar: '👨‍💻',
    status: 'online',
    lastSeen: '5 minutes ago',
    permissions: ['estimate', 'review', 'export'],
  },
  {
    id: 'cf-003',
    name: 'Emily Thompson',
    role: 'Data Specialist',
    avatar: '👩‍🔬',
    status: 'busy',
    lastSeen: '1 hour ago',
    permissions: ['review', 'export'],
  },
  {
    id: 'cf-004',
    name: 'David Kim',
    role: 'Quality Assurance',
    avatar: '👨‍🔧',
    status: 'offline',
    lastSeen: '3 hours ago',
    permissions: ['review', 'approve'],
  },
];

const projectComments: ProjectComment[] = [
  {
    id: 'comm-001',
    userId: 'cf-001',
    content:
      'The Washington State regional multipliers look accurate for this Q4 analysis. Benton County shows 15% increase YoY.',
    timestamp: '2024-01-19T10:30:00Z',
    type: 'comment',
    mentions: ['cf-002'],
  },
  {
    id: 'comm-002',
    userId: 'cf-002',
    content: 'Approved for final export. CostForge accuracy at 99.7% for this batch.',
    timestamp: '2024-01-19T11:15:00Z',
    type: 'approval',
  },
  {
    id: 'comm-003',
    userId: 'cf-003',
    content: 'Question: Should we include the Arkansas legacy data comparison in this report?',
    timestamp: '2024-01-19T14:22:00Z',
    type: 'question',
    mentions: ['cf-001'],
  },
];

const recentActivity: ProjectActivity[] = [
  {
    id: 'act-001',
    userId: 'cf-001',
    action: 'Created new estimation',
    details: 'BEN-45789-2024 Single Family Residential - $245,000',
    timestamp: '2024-01-19T09:15:00Z',
    type: 'estimation',
  },
  {
    id: 'act-002',
    userId: 'cf-002',
    action: 'Reviewed estimation accuracy',
    details: 'Validated CostForge AI calculations - 98.6% accuracy',
    timestamp: '2024-01-19T10:45:00Z',
    type: 'review',
  },
  {
    id: 'act-003',
    userId: 'cf-004',
    action: 'Approved for export',
    details: 'Government compliance check passed - Washington State standards',
    timestamp: '2024-01-19T13:30:00Z',
    type: 'approval',
  },
];

export function CostForgeCollaborationTools() {
  const [activeTab, setActiveTab] = useState<'team' | 'comments' | 'activity'>('team');
  const [newComment, setNewComment] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [onlineMembers, setOnlineMembers] = useState(
    costForgeTeam.filter((m) => m.status === 'online')
  );

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update online status simulation
      setOnlineMembers(costForgeTeam.filter((m) => Math.random() > 0.3));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handle comment submission
  const handleCommentSubmit = () => {
    if (newComment.trim()) {
      const comment: ProjectComment = {
        id: `comm-${Date.now()}`,
        userId: 'current-user',
        content: newComment,
        timestamp: new Date().toISOString(),
        type: 'comment',
        mentions: selectedMembers,
      };

      // In real implementation, this would be sent to the backend
      console.log('New comment:', comment);
      setNewComment('');
      setSelectedMembers([]);
    }
  };

  // Format timestamp for display
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  // Get user by ID
  const getUserById = (id: string): TeamMember | undefined => {
    return costForgeTeam.find((member) => member.id === id);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6'>
      {/* Header */}
      <div className='mb-8'>
        <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -translate-x-full animate-pulse' />
          <div className='relative z-10'>
            <h1 className='text-5xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-2'>
              COSTFORGE COLLABORATION
            </h1>
            <p className='text-xl text-cyan-400 font-semibold'>
              Team Coordination • Real-Time Communication • Government-Grade Security
            </p>
            <p className='text-lg text-slate-300 mt-2'>
              Cross-County Teams • Secure Messaging • Project Management
            </p>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Main Collaboration Panel */}
        <div className='lg:col-span-2 bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6'>
          {/* Tab Navigation */}
          <div className='flex mb-6 bg-slate-800/50 rounded-lg p-1'>
            {[
              { id: 'team', label: 'Team Members', icon: Users },
              { id: 'comments', label: 'Comments', icon: MessageCircle },
              { id: 'activity', label: 'Activity Feed', icon: Clock },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md transition-all duration-300 ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className='w-4 h-4 mr-2' />
                {label}
              </button>
            ))}
          </div>

          {/* Team Members Tab */}
          {activeTab === 'team' && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-white'>CostForge Team</h3>
                <div className='text-sm text-cyan-400'>{onlineMembers.length} online</div>
              </div>

              <div className='grid gap-4'>
                {costForgeTeam.map((member) => (
                  <div
                    key={member.id}
                    className='flex items-center justify-between p-4 bg-white/5 rounded-xl border border-slate-600/30 hover:border-cyan-400/30 transition-colors'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='relative'>
                        <div className='w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-2xl'>
                          {member.avatar}
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            member.status === 'online'
                              ? 'bg-green-400'
                              : member.status === 'busy'
                                ? 'bg-yellow-400'
                                : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className='font-semibold text-white'>{member.name}</div>
                        <div className='text-sm text-cyan-400'>{member.role}</div>
                        <div className='text-xs text-slate-400'>Last seen: {member.lastSeen}</div>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-1'>
                      {member.permissions.map((permission) => (
                        <span
                          key={permission}
                          className='px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-md'
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className='space-y-6'>
              <h3 className='text-xl font-bold text-white'>Project Comments</h3>

              {/* New Comment Input */}
              <div className='bg-slate-800/50 rounded-xl p-4'>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder='Add a comment, question, or update...'
                  className='w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-400 resize-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400 focus:ring-offset-0'
                  rows={3}
                />
                <div className='flex items-center justify-between mt-3'>
                  <div className='flex space-x-2'>
                    <button className='px-3 py-1 bg-blue-500/20 text-blue-400 rounded-md text-sm hover:bg-blue-500/30 transition-colors'>
                      @mention
                    </button>
                    <button className='px-3 py-1 bg-green-500/20 text-green-400 rounded-md text-sm hover:bg-green-500/30 transition-colors'>
                      📎 attach
                    </button>
                  </div>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
                    className='bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    Post Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className='space-y-4'>
                {projectComments.map((comment) => {
                  const user = getUserById(comment.userId);
                  return (
                    <div
                      key={comment.id}
                      className='bg-white/5 rounded-xl p-4 border border-slate-600/30'
                    >
                      <div className='flex items-start space-x-3'>
                        <div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-sm'>
                          {user?.avatar || '👤'}
                        </div>
                        <div className='flex-1'>
                          <div className='flex items-center space-x-2 mb-2'>
                            <span className='font-semibold text-white'>
                              {user?.name || 'Unknown User'}
                            </span>
                            <span className='text-xs text-slate-400'>
                              {formatTime(comment.timestamp)}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                comment.type === 'approval'
                                  ? 'bg-green-500/20 text-green-400'
                                  : comment.type === 'question'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : comment.type === 'revision'
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {comment.type}
                            </span>
                          </div>
                          <p className='text-slate-300'>{comment.content}</p>
                          {comment.mentions && comment.mentions.length > 0 && (
                            <div className='mt-2 text-xs text-cyan-400'>
                              Mentioned:{' '}
                              {comment.mentions.map((id) => getUserById(id)?.name).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className='space-y-6'>
              <h3 className='text-xl font-bold text-white'>Recent Activity</h3>

              <div className='space-y-3'>
                {recentActivity.map((activity) => {
                  const user = getUserById(activity.userId);
                  return (
                    <div
                      key={activity.id}
                      className='flex items-center space-x-4 p-4 bg-white/5 rounded-lg border border-slate-600/30'
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === 'estimation'
                            ? 'bg-blue-500/20 text-blue-400'
                            : activity.type === 'review'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : activity.type === 'approval'
                                ? 'bg-green-500/20 text-green-400'
                                : activity.type === 'export'
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-slate-500/20 text-slate-400'
                        }`}
                      >
                        {activity.type === 'estimation'
                          ? '🧮'
                          : activity.type === 'review'
                            ? '🔍'
                            : activity.type === 'approval'
                              ? '✅'
                              : activity.type === 'export'
                                ? '📊'
                                : '📝'}
                      </div>
                      <div className='flex-1'>
                        <div className='font-medium text-white'>
                          {user?.name} {activity.action}
                        </div>
                        <div className='text-sm text-slate-400'>{activity.details}</div>
                        <div className='text-xs text-slate-500 mt-1'>
                          {formatTime(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Online Team Status */}
          <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6'>
            <h3 className='text-xl font-bold text-white mb-4 flex items-center'>
              <div className='w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3' />
              Live Status
            </h3>
            <div className='space-y-3'>
              {onlineMembers.slice(0, 3).map((member) => (
                <div key={member.id} className='flex items-center space-x-3'>
                  <div className='w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-sm'>
                    {member.avatar}
                  </div>
                  <div className='flex-1'>
                    <div className='text-sm font-medium text-white'>{member.name}</div>
                    <div className='text-xs text-green-400'>Currently active</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6'>
            <h3 className='text-xl font-bold text-white mb-4'>Quick Actions</h3>
            <div className='space-y-3'>
              <button className='w-full text-left p-3 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors'>
                <Share2 className='w-4 h-4 inline mr-2' />
                Share Estimation
              </button>
              <button className='w-full text-left p-3 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors'>
                <CheckCircle className='w-4 h-4 inline mr-2' />
                Request Approval
              </button>
              <button className='w-full text-left p-3 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors'>
                <AlertTriangle className='w-4 h-4 inline mr-2' />
                Flag for Review
              </button>
              <button className='w-full text-left p-3 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors'>
                <Calendar className='w-4 h-4 inline mr-2' />
                Schedule Meeting
              </button>
            </div>
          </div>

          {/* Project Statistics */}
          <div className='bg-white/10 backdrop-blur-lg border border-cyan-400/20 rounded-2xl p-6'>
            <h3 className='text-xl font-bold text-white mb-4'>Project Stats</h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Total Comments:</span>
                <span className='text-cyan-400 font-semibold'>47</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Pending Reviews:</span>
                <span className='text-yellow-400 font-semibold'>3</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Completed Tasks:</span>
                <span className='text-green-400 font-semibold'>89%</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-slate-400'>Team Rating:</span>
                <span className='text-white font-semibold flex items-center'>
                  4.9 <Star className='w-4 h-4 text-yellow-400 ml-1' />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostForgeCollaborationTools;
