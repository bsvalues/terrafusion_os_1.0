'use client';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

interface CollaborationUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentWorkspace: string;
  lastActivity: Date;
}

interface WorkspaceActivity {
  id: string;
  user: string;
  action: string;
  workspace: string;
  timestamp: Date;
  details: string;
}

interface ChatMessage {
  id: string;
  user: CollaborationUser;
  message: string;
  timestamp: Date;
  workspace?: string;
  type: 'text' | 'system' | 'file' | 'alert';
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CollaborationHub() {
  const [activeUsers, setActiveUsers] = useState<CollaborationUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<WorkspaceActivity[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('all');
  const [showUserList, setShowUserList] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Real-time data fetching
  const { data: users } = useSWR('/api/collaboration/users', fetcher, { refreshInterval: 5000 });
  const { data: activity } = useSWR('/api/collaboration/activity', fetcher, { refreshInterval: 2000 });
  const { data: workspaces } = useSWR('http://localhost:8787/api/portal/workspaces', fetcher);

  useEffect(() => {
    // Simulate real-time user data
    const mockUsers: CollaborationUser[] = [
      {
        id: '1',
        name: 'Sarah Chen',
        avatar: '👩‍💼',
        role: 'System Administrator',
        status: 'online',
        currentWorkspace: 'terra-levy',
        lastActivity: new Date(),
      },
      {
        id: '2',
        name: 'Mike Rodriguez',
        avatar: '👨‍💻',
        role: 'Developer',
        status: 'online',
        currentWorkspace: 'backend',
        lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: '3',
        name: 'Emily Johnson',
        avatar: '👩‍🔧',
        role: 'DevOps Engineer',
        status: 'busy',
        currentWorkspace: 'os-platform',
        lastActivity: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: '4',
        name: 'David Kim',
        avatar: '👨‍🎓',
        role: 'Data Analyst',
        status: 'away',
        currentWorkspace: 'terra-bank',
        lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      },
    ];

    const mockActivity: WorkspaceActivity[] = [
      {
        id: '1',
        user: 'Sarah Chen',
        action: 'deployed',
        workspace: 'terra-levy',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        details: 'Version 2.1.1 - Bug fixes and performance improvements',
      },
      {
        id: '2',
        user: 'Mike Rodriguez',
        action: 'updated',
        workspace: 'backend',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        details: 'Added new API endpoint for analytics',
      },
      {
        id: '3',
        user: 'Emily Johnson',
        action: 'scaled',
        workspace: 'os-platform',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        details: 'Increased memory allocation by 50%',
      },
      {
        id: '4',
        user: 'David Kim',
        action: 'analyzed',
        workspace: 'terra-bank',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        details: 'Generated performance report for Q4',
      },
    ];

    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        user: mockUsers[0],
        message: 'Terra Levy deployment completed successfully! 🎉',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        workspace: 'terra-levy',
        type: 'text',
      },
      {
        id: '2',
        user: mockUsers[1],
        message: 'Great work Sarah! The new performance improvements are showing a 15% increase in response times.',
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        type: 'text',
      },
      {
        id: '3',
        user: mockUsers[2],
        message: 'OS Platform monitoring shows all systems green 💚',
        timestamp: new Date(Date.now() - 30 * 1000),
        workspace: 'os-platform',
        type: 'text',
      },
    ];

    setActiveUsers(mockUsers);
    setRecentActivity(mockActivity);
    setChatMessages(mockMessages);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#28a745';
      case 'away': return '#ffc107';
      case 'busy': return '#dc3545';
      case 'offline': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'deployed': return '🚀';
      case 'updated': return '🔄';
      case 'scaled': return '📈';
      case 'analyzed': return '📊';
      case 'fixed': return '🔧';
      default: return '📝';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: {
        id: 'current',
        name: 'You',
        avatar: '👤',
        role: 'Administrator',
        status: 'online',
        currentWorkspace: selectedWorkspace,
        lastActivity: new Date(),
      },
      message: newMessage,
      timestamp: new Date(),
      workspace: selectedWorkspace !== 'all' ? selectedWorkspace : undefined,
      type: 'text',
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onlineUsers = activeUsers.filter(user => user.status === 'online');
  const busyUsers = activeUsers.filter(user => user.status === 'busy');
  const awayUsers = activeUsers.filter(user => user.status === 'away');

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8f9fa' }}>
      {/* Sidebar - User List */}
      {showUserList && (
        <div style={{
          width: 300,
          background: 'white',
          borderRight: '1px solid #dee2e6',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: 16,
            borderBottom: '1px solid #dee2e6',
            background: '#007bff',
            color: 'white'
          }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>
              🤝 Collaboration Hub
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, opacity: 0.9 }}>
              {onlineUsers.length} online • {activeUsers.length} total
            </p>
          </div>

          {/* Online Users */}
          <div style={{ padding: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#6c757d', textTransform: 'uppercase' }}>
              Online ({onlineUsers.length})
            </h4>
            {onlineUsers.map(user => (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: 8,
                borderRadius: 6,
                marginBottom: 4,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ position: 'relative', marginRight: 8 }}>
                  <span style={{ fontSize: 20 }}>{user.avatar}</span>
                  <div style={{
                    width: 8,
                    height: 8,
                    background: getStatusColor(user.status),
                    borderRadius: '50%',
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    border: '2px solid white'
                  }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#6c757d' }}>
                    {user.role} • {user.currentWorkspace}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Busy Users */}
          {busyUsers.length > 0 && (
            <div style={{ padding: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#6c757d', textTransform: 'uppercase' }}>
                Busy ({busyUsers.length})
              </h4>
              {busyUsers.map(user => (
                <div key={user.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 8,
                  opacity: 0.7
                }}>
                  <div style={{ position: 'relative', marginRight: 8 }}>
                    <span style={{ fontSize: 20 }}>{user.avatar}</span>
                    <div style={{
                      width: 8,
                      height: 8,
                      background: getStatusColor(user.status),
                      borderRadius: '50%',
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      border: '2px solid white'
                    }}></div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2c3e50' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#6c757d' }}>
                      {user.currentWorkspace}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          <div style={{ flex: 1, padding: 12, borderTop: '1px solid #dee2e6' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: 12, color: '#6c757d', textTransform: 'uppercase' }}>
              Recent Activity
            </h4>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {recentActivity.map(activity => (
                <div key={activity.id} style={{
                  padding: 8,
                  borderRadius: 4,
                  marginBottom: 4,
                  background: '#f8f9fa',
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ marginRight: 4 }}>{getActionIcon(activity.action)}</span>
                    <span style={{ fontWeight: 600, color: '#007bff' }}>{activity.user}</span>
                    <span style={{ margin: '0 4px', color: '#6c757d' }}>{activity.action}</span>
                    <span style={{ color: '#28a745' }}>{activity.workspace}</span>
                  </div>
                  <div style={{ color: '#6c757d', fontSize: 11 }}>
                    {activity.details}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: 10, marginTop: 2 }}>
                    {activity.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <div style={{
          padding: 16,
          background: 'white',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, color: '#2c3e50' }}>
              💬 Team Chat
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6c757d' }}>
              Workspace: {selectedWorkspace === 'all' ? 'All Workspaces' : selectedWorkspace}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #dee2e6',
                borderRadius: 4,
                fontSize: 12
              }}
            >
              <option value="all">All Workspaces</option>
              <option value="terra-levy">Terra Levy</option>
              <option value="terra-bank">Terra Bank</option>
              <option value="backend">Backend</option>
              <option value="frontend">Frontend</option>
              <option value="os-platform">OS Platform</option>
            </select>
            
            <button
              onClick={() => setShowUserList(!showUserList)}
              style={{
                padding: '6px 12px',
                background: showUserList ? '#007bff' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {showUserList ? 'Hide Users' : 'Show Users'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
          background: '#f8f9fa'
        }}>
          {chatMessages
            .filter(msg => selectedWorkspace === 'all' || !msg.workspace || msg.workspace === selectedWorkspace)
            .map(message => (
            <div key={message.id} style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              <div style={{ fontSize: 20 }}>{message.user.avatar}</div>
              <div style={{
                flex: 1,
                background: 'white',
                padding: '12px 16px',
                borderRadius: '8px 8px 8px 2px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 4,
                  gap: 8
                }}>
                  <span style={{ fontWeight: 600, color: '#2c3e50', fontSize: 14 }}>
                    {message.user.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#6c757d' }}>
                    {message.user.role}
                  </span>
                  {message.workspace && (
                    <span style={{
                      fontSize: 10,
                      color: '#007bff',
                      background: '#e3f2fd',
                      padding: '2px 6px',
                      borderRadius: 10
                    }}>
                      {message.workspace}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: '#6c757d', marginLeft: 'auto' }}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: '#495057', fontSize: 14, lineHeight: 1.4 }}>
                  {message.message}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input */}
        <div style={{
          padding: 16,
          background: 'white',
          borderTop: '1px solid #dee2e6'
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={2}
              style={{
                flex: 1,
                padding: 12,
                border: '1px solid #dee2e6',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                resize: 'none'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              style={{
                padding: '0 20px',
                background: newMessage.trim() ? '#007bff' : '#e9ecef',
                color: newMessage.trim() ? 'white' : '#6c757d',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: newMessage.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Send
            </button>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            fontSize: 11,
            color: '#6c757d'
          }}>
            <span>
              💡 Use @workspace to mention specific workspaces • Use @user to mention team members
            </span>
            <span>
              {onlineUsers.length} users online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}