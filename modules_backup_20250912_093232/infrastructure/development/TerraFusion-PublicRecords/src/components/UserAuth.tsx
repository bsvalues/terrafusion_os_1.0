import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {User, Lock, Mail, Shield, CreditCard, Key, AlertCircle, CheckCircle} from '@mui/icons-material';

interface UserAuthProps {onLogin: (user: any) => void;
  onClose: () => void;}

export const UserAuth: React.FC<UserAuthProps> = ({onLogin, onClose}) => {const [mode, setMode] = useState<'login' | 'register' | 'gov'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [governmentId, setGovernmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate authentication
    setTimeout(() => {
      const user = {
        id: Date.now().toString(),
        email,
        name: name || email.split('@')[0],
        type: mode === 'gov' ? 'government' : 'citizen',
        address,
        phone,
        verified: mode === 'gov',
        permissions: mode === 'gov' ? ['admin', 'approve', 'review'] : ['view', 'apply'],
        savedSearches: [],
        applications: [],
        notifications: [
          { id: '1', message: 'Welcome to Terrafusion Public Records!', unread: true}
        ]
      };

      // Store in localStorage for persistence
      localStorage.setItem('tfpr_user', JSON.stringify(user));
      localStorage.setItem('tfpr_session', Date.now().toString());
      
      setLoading(false);
      onLogin(user);
    }, 1000);
  };

  return (<motion.div
      initial={{ opacity: 0}}
      animate={{ opacity: 1}}
      exit={{ opacity: 0}}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    ><motion.div
        initial={{ scale: 0.9, opacity: 0}}
        animate={{ scale: 1, opacity: 1}}
        className="bg-white rounded-2xl max-w-md w-full p-8"
      >{/* Header */}<div className="text-center mb-6"><><h2 className="text-3xl font-bold text-gray-900 mb-2">{mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Government Access'}</h2><p
</>className="text-gray-600">
            {mode === 'login' ? 'Access your records and applications' : 
             mode === 'register' ? 'Start accessing public records instantly' :
             'Secure portal for government employees'}</p></div>{/* Mode Selector */}<div className="flex gap-2 mb-6">{['login', 'register', 'gov'].map((m) => (<button
              key={m}
              onClick={() =>setMode(m as any)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                mode === m 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {m === 'login' ? 'Sign In' : m === 'register' ? 'Register' : 'Gov Employee'}</button>))}</div>{/* Form */}<form onSubmit={handleSubmit} className="space-y-4">{mode === 'register' && (<div><><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><div
</>
className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="John Doe"
                  required
                /></div></div>)}<div><><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><div
</>
className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={mode === 'gov' ? 'john.doe@bentoncounty.gov' : 'john@example.com'}
                required
              /></div></div><div><><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div
</>
className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required
              /></div></div>{mode === 'gov' && (<div><><label className="block text-sm font-medium text-gray-700 mb-1">Employee ID / PIV Card</label><div
</>
className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input
                  type="text"
                  value={governmentId}
                  onChange={(e) => setGovernmentId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="BC-2024-1234"
                  required
                /></div></div>)}

          {mode === 'register' && (<div><><label className="block text-sm font-medium text-gray-700 mb-1">Address (for location-based services)</label><input
</>

                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="123 Main St, Kennewick, WA"
                /></div><div><><label className="block text-sm font-medium text-gray-700 mb-1">Phone (for SMS notifications)</label><input
</>

                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="(509) 555-0123"
                /></div>)}

          {error && (<div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span></div>)}

          {/* Features List */}<div className="py-4 space-y-2">{mode === 'register' && (<div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /><span>Save searches and get alerts</span></div><div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /><span>Apply for permits online</span></div><div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /><span>Track application status</span></div>)}
            {mode === 'gov' && (<div className="flex items-center gap-2 text-sm text-gray-600"><Shield className="w-4 h-4 text-blue-500" /><span>Secure government access</span></div><div className="flex items-center gap-2 text-sm text-gray-600"><Shield className="w-4 h-4 text-blue-500" /><span>Review and approve applications</span></div><div className="flex items-center gap-2 text-sm text-gray-600"><Shield className="w-4 h-4 text-blue-500" /><span>Access restricted records</span></div>)}</div>{/* Submit Button */}<button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
          >{loading ? (<span className="flex items-center justify-center gap-2"><motion.div
                  animate={{ rotate: 360}}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear"}}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />Processing...</span>) : (
              mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Access Portal'
            )}</button>{/* Alternative Actions */}<div className="text-center text-sm text-gray-600">{mode === 'login' ? (<span>Don't have an account?{' '}<button
                  type="button"
                  onClick={() =>setMode('register')}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Register now</button></span>) : mode === 'register' ? (<span>Already have an account?{' '}<button
                  type="button"
                  onClick={() =>setMode('login')}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Sign in</button></span>) : (<span>Not a government employee?{' '}<button
                  type="button"
                  onClick={() =>setMode('login')}
                  className="text-purple-600 hover:underline font-medium"
                >
                  Citizen login</button></span>)}</div></form>{/* Close Button */}<button
          onClick={onClose}
          className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
        >Continue without account</button></motion.div></motion.div>
  );
};