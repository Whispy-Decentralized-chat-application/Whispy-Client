"use client";
import React, { useState } from "react";
import Header from "./components/header";
import ChatList from "./components/chat-list";
import ChatInput from "./components/chat-input";
import SideBar from "./components/side-bar";

const ChatApp = () => {
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);

  const handleSendMessage = (message: string) => {
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), text: message },
    ]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Header permanece arriba */}
      <Header />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar se posiciona a la izquierda */}
        <SideBar />
        {/* Contenido principal ocupa el resto del espacio */}
        <div className="flex flex-col flex-1">
          <ChatList messages={messages} />
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;