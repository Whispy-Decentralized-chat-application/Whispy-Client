"use client";
import React, { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/header";
import ChatList from "./components/chat-list";
import ChatInput from "./components/chat-input";
import SideBar from "./components/side-bar";
import { getMe } from "./ceramic/userService";
import { retrieveMessages, sendMessage } from "./ceramic/messageService";
import { useSession } from "@/context/SessionContext";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const ChatApp = () => {
  const { isUnlocked } = useSession();
  useAuthRedirect(true, { isUnlocked });
  const [user, setUser] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("orbis:user");
    if (user) {
      setUser(JSON.parse(user).stream_id);
    } 
  }
  , [router]);


  // cuando cambia el chat seleccionado, cargamos mensajes
  useEffect(() => {
    if (!selectedChatId) {
      setChatMessages([]);
      return;
    }
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const msgs = await retrieveMessages(selectedChatId);
        if (!isMounted) return;
        setChatMessages(
          msgs
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        );
      } catch (e) {
        console.error("Error loading messages:", e);
      }
    };

    // primera carga inmediata
    fetchMessages();
    // refrescar cada 5 segundos
    const intervalId = setInterval(fetchMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [selectedChatId]);

  const handleSend = async (content: string) => {
    if (!selectedChatId || !user) return;
    // Construir mensaje con la estructura requerida
    const messageObj = {
      author: user,
      chatId: selectedChatId,
      content,
      msgType: "text",
      date: new Date().toISOString(),
    };
    try {
      // Enviar y recargar mensajes
      await sendMessage(messageObj);
      const msgs = await retrieveMessages(selectedChatId);
      setChatMessages(
        msgs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      );
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideBar
          selectedChatId={selectedChatId}
          onSelectChat={(chatId: string) => setSelectedChatId(chatId)}
        />
        <div className="flex flex-col flex-1">
          <ChatList messages={chatMessages} />
          <ChatInput onSendMessage={handleSend} disabled={!selectedChatId} />
        </div>
      </div>
    </div>
  );
};

export default ChatApp;