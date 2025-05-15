"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "./components/header";
import ChatList from "./components/chat-list";
import ChatInput from "./components/chat-input";
import SideBar from "./components/side-bar";
import { getMe } from "./ceramic/userService";

const ChatApp = () => {
  const [user, setUser] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const session = localStorage.getItem("orbis:session");
      if (!session) {
        router.push("/login");
        return;
      }
      try {
        const profile = await getMe();
        if (!profile) {
          router.push("/register");
          return;
        }
        const profileStr = JSON.stringify(profile);
        localStorage.setItem("orbis:user", profileStr);
        setUser(profileStr);
      } catch (err) {
        console.error("Error fetching profile:", err);
        router.push("/login");
      }
    };

    fetchUser();
  }, [router]);

  if (!user) return null; // Esperar a que cargue el estado del usuario

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <SideBar />
        <div className="flex flex-col flex-1">
          <ChatList messages={[]} />
          <ChatInput onSendMessage={() => {}} />
        </div>
      </div>
      
    </div>
  );
};

export default ChatApp;
