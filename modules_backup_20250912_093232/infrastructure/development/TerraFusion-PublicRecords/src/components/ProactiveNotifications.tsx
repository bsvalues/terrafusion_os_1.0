import React, {useState, useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Bell, Warning, Info, CheckCircle, Calendar,
  Home, DollarSign, Users, Truck, Construction, 
  AlertCircle, TrendingUp, Sparkles, X} from '@mui/icons-material';

interface Notification {id: string;
  type: 'urgent' | 'info' | 'success' | 'warning' | 'ai_discovery';
  title: string;
  message: string;
  timestamp: Date;
  actionable: boolean;
  action?: string;
  metadata?: any;}

export const ProactiveNotifications: React.FC = () => {const [notifications, setNotifications] = useState<Notification[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showDetail, setShowDetail] = useState<Notification | null>(null);

  useEffect(() =>{
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(perm => {
        setPermission(perm);});
    }

    // Simulate AI-driven proactive notifications
    const simulateNotifications = () => {const proactiveAlerts: Notification[] = [
        {
          id: '1',
          type: 'urgent',
          title: 'Construction Alert',
          message: 'Water main work starting on your street tomorrow 9 AM',
          timestamp: new Date(),
          actionable: true,
          action: 'View Details',
          metadata: {
            location: '200 block of Main St',
            duration: '8 hours',
            impact: 'No water service'}
        },
        {id: '2',
          type: 'ai_discovery',
          title: 'AI Found: Property Tax Savings',
          message: 'You may qualify for $340/year reduction based on new assessment',
          timestamp: new Date(Date.now() - 3600000),
          actionable: true,
          action: 'Apply Now',
          metadata: {
            savings: '$340/year',
            reason: 'Senior citizen exemption',
            deadline: '30 days'}
        },
        {id: '3',
          type: 'info',
          title: 'Permit Update',
          message: 'Your deck permit moved to final review',
          timestamp: new Date(Date.now() - 7200000),
          actionable: true,
          action: 'Track Status',
          metadata: {
            permitNumber: '2024-1892',
            currentStage: 'Final Review',
            estimatedCompletion: '2 days'}
        },
        {id: '4',
          type: 'warning',
          title: 'Business License Expiring',
          message: 'Your business license expires in 14 days',
          timestamp: new Date(Date.now() - 86400000),
          actionable: true,
          action: 'Renew Now',
          metadata: {
            licenseType: 'General Business',
            expiryDate: '2024-02-01',
            renewalFee: '$125'}
        },
        {id: '5',
          type: 'success',
          title: 'Payment Received',
          message: 'Water bill payment of $67.43 processed',
          timestamp: new Date(Date.now() - 172800000),
          actionable: false,
          metadata: {
            amount: '$67.43',
            accountNumber: '****4821',
            nextDue: '2024-03-15'}
        }
      ];

      setNotifications(proactiveAlerts);

      // Send browser notification for urgent items
      if (permission === 'granted') {const urgent = proactiveAlerts.find(n => n.type === 'urgent');
        if (urgent) {
          new Notification('Terrafusion Alert', {
            body: urgent.message,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            vibrate: [200, 100, 200],
            tag: urgent.id,
            requireInteraction: true});
        }
      }
    };

    // Initial load
    simulateNotifications();

    // Simulate new notifications arriving
    const interval = setInterval(() => {const newNotification: Notification = {
        id: Date.now().toString(),
        type: ['info', 'warning', 'ai_discovery'][Math.floor(Math.random() * 3)] as any,
        title: 'New Activity Detected',
        message: 'Something relevant to you just happened',
        timestamp: new Date(),
        actionable: true,
        action: 'View'};

      setNotifications(prev => [newNotification, ...prev].slice(0, 10));

      // Browser notification
      if (permission === 'granted') {new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/icon-192.png'});
      }
    }, 30000); // Every 30 seconds for demo

    return () => clearInterval(interval);
  }, [permission]);

  const getIcon = (type: string) => {switch (type) {
      case 'urgent': return<Warning className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ai_discovery': return <Sparkles className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;}
  };

  const getTimeAgo = (date: Date) =>{
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds< 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">{/* Header */}<div className="flex items-center justify-between mb-6"><div><><h2 className="text-2xl font-bold text-gray-900">Proactive Notifications</h2><p
</>className="text-gray-600 mt-1">
            AI monitors your county 24/7 and alerts you to what matters</p></div><div className="flex items-center gap-2"><Bell className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-600">{permission === 'granted' ? 'Enabled' : 'Disabled'}</span></div></div>{/* AI Insight Banner */}<motion.div
        initial={{ opacity: 0, y: -20}}
        animate={{ opacity: 1, y: 0}}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 mb-6"
      ><div className="flex items-start gap-4"><div className="bg-white/20 rounded-full p-3"><><Sparkles className="w-6 h-6" /></div><div
</>
className="flex-1"><><h3 className="text-xl font-bold mb-2">AI is actively monitoring for you</h3><p
</>className="text-white/90 mb-4">
              Our AI agents are watching 47,892,341 records for patterns that affect you.
              You'll be notified instantly when something important happens.</p><div className="grid grid-cols-3 gap-4"><div><><div className="text-2xl font-bold">1,247</div><div
</>
className="text-sm text-white/70">Active monitors</div></div><div><><div className="text-2xl font-bold">$4.2K</div><div
</>
className="text-sm text-white/70">Savings found</div></div><div><><div className="text-2xl font-bold">0.3s</div><div
</>
className="text-sm text-white/70">Alert speed</div></div></div></div></div></motion.div>{/* Notification Categories */}<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">{[
          {icon: Construction, label: 'Construction', count: 3, color: 'orange'},
          {icon: DollarSign, label: 'Financial', count: 7, color: 'green'},
          {icon: Calendar, label: 'Deadlines', count: 2, color: 'red'},
          {icon: TrendingUp, label: 'Opportunities', count: 5, color: 'purple'}
        ].map((category) => (<motion.button
            key={category.label}
            whileHover={{ scale: 1.05}}
            whileTap={{ scale: 0.95}}
            className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow"
          ><category.icon className={`w-6 h-6 text-${category.color}-500 mb-2`} /><><div className="text-sm font-medium text-gray-900">{category.label}</div><div
</>
className="text-xs text-gray-500">{category.count} active</div></motion.button>))}</div>{/* Notification List */}<div className="space-y-3"><AnimatePresence>{notifications.map((notification /* , index */) => (<motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20}}
              animate={{ opacity: 1, x: 0}}
              exit={{ opacity: 0, x: 20}}
              transition={{ delay: index * 0.1}}
              whileHover={{ scale: 1.02}}
              onClick={() => setShowDetail(notification)}
              className={`bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer ${
                notification.type === 'urgent' ? 'border-l-4 border-red-500' : ''}`}
            ><div className="flex items-start gap-3">{getIcon(notification.type)}<div className="flex-1"><div className="flex items-start justify-between"><div><><h3 className="font-medium text-gray-900">{notification.title}</h3><p
</>className="text-sm text-gray-600 mt-1">
                        {notification.message}</p></div><span className="text-xs text-gray-400 whitespace-nowrap">{getTimeAgo(notification.timestamp)}</span></div>{notification.actionable && (<button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700">{notification.action} →</button>)}</div></div></motion.div>))}</AnimatePresence></div>{/* Detail Modal */}<AnimatePresence>{showDetail && (<motion.div
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetail(null)}
          ><motion.div
              initial={{ scale: 0.9, opacity: 0}}
              animate={{ scale: 1, opacity: 1}}
              exit={{ scale: 0.9, opacity: 0}}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            ><div className="flex items-start justify-between mb-4"><div className="flex items-start gap-3">{getIcon(showDetail.type)}<div><><h3 className="text-xl font-bold text-gray-900">{showDetail.title}</h3><p
</>className="text-sm text-gray-500 mt-1">
                      {getTimeAgo(showDetail.timestamp)}</p></div></div><button onClick={() => setShowDetail(null)}><X className="w-5 h-5 text-gray-400" /></button></div><p className="text-gray-700 mb-4">{showDetail.message}</p>{showDetail.metadata && (<div className="bg-gray-50 rounded-lg p-4 mb-4"><h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>{Object.entries(showDetail.metadata).map(([key, value]) => (<div key={key} className="flex justify-between py-1"><><span className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span><span
</>className="text-sm font-medium text-gray-900">
                        {value as string}</span></div>))}</div>)}

              {showDetail.actionable && (<button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-shadow">{showDetail.action}</button>)}</motion.div></motion.div>)}</AnimatePresence></div>
  );
};