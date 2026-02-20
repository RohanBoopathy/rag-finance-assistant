'use client'

import { ChatHistoryProps } from '@/types/chat'
import { PlusCircle, Trash2 } from 'lucide-react';
import { useState } from 'react'

const ChatHistory = ({ conversations, currentConversationId, onSelectConversation, onNewChat, onDeleteConversation, isLoading }: ChatHistoryProps) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
    
  return (
    <div className="w-60 flex flex-col h-full">
      <div className="p-1 border-b border-gray-700">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 border border-transparent hover:border-blue-700 text-white rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      <div className='flex-1 overflow-y-auto p-2'>
        {isLoading ? (
            <div className='flex items-center justify-center h-20 text-gray-500'>
                <div className='animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent'></div>
            </div>
        ) : conversations.length === 0 ? (
            <div className='text-start text-sm text-gray-400 mt-2 px-4'>
                <p>No conversations yet.</p>
            </div>
        ) : (
            <div className='space-y-1'>
                {conversations.map((conv) => (
                    <div
                      key={conv._id}
                      className={`relative group rounded-lg transition-colors ${
                        currentConversationId === conv._id
                          ? 'bg-[#1a2942]'
                          : 'hover:bg-[#0f1c33]'
                      }`}
                      onMouseEnter={() => setHoverId(conv._id)}
                      onMouseLeave={() => setHoverId(null)}
                    >
                        <button
                          onClick={() => onSelectConversation(conv._id)}
                          className='w-full text-left px-3 py-2.5 flex items-start gap-2'
                        >
                            <div className='flex-1 min-w-0'>
                                <p className='text-sm text-white truncate font-medium'>
                                    {conv.title || 'Untitled Conversation'}
                                </p>
                                <p className='text-sm text-gray-400 truncate font-medium'>
                                    {conv.lastMessage}
                                </p>
                            </div>
                        </button>

                        {hoverId === conv._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Delete this convo.?')) {
                                    onDeleteConversation(conv._id)
                                }
                              }}
                              className='absolute right-2 top-2 p-1.5 border border-red-600 hover:bg-red-600 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity'
                              aria-label='Delete Conversation'
                            >
                              <Trash2  className='w-3 h-3.5' />  
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}

export default ChatHistory
