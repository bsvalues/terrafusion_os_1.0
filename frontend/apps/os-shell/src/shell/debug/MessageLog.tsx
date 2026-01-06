import React from 'react';
import { useMessageBusStore } from '../../stores/messageBusStore';

export const MessageLog: React.FC = () => {
  const messages = useMessageBusStore((state) => state.messages);

  return (
    <div className='p-4 bg-gray-900 text-green-400 font-mono text-xs h-full overflow-auto'>
      <h3 className='font-bold mb-2 border-b border-green-700 pb-1'>System Bus Log</h3>
      {messages.length === 0 && <div className='opacity-50'>No messages...</div>}
      {messages.map((msg) => (
        <div key={msg.id} className='mb-1 hover:bg-gray-800 p-1 rounded'>
          <span className='text-gray-500'>[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
          <span className='text-blue-400 mx-1'>{msg.sourceModuleId}</span>
          <span className='text-yellow-500'>→</span>
          <span className='text-purple-400 mx-1'>{msg.targetModuleId || '*'}</span>
          <span className='font-bold text-white'>{msg.event}</span>
          <pre className='ml-4 text-gray-400 overflow-hidden text-ellipsis'>
            {JSON.stringify(msg.payload)}
          </pre>
        </div>
      ))}
    </div>
  );
};
