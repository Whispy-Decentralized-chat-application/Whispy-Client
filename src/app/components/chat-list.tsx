"use client"
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';


interface ChatListProps {
  messages: { id: string; text: string }[];
}

const ChatList: React.FC<ChatListProps> = ({ messages }) => {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="p-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg shadow-md animate-fadeIn"
          >
            {msg.text}
          </div>
        ))}
      </div>
    );
  };
  
  export default ChatList;