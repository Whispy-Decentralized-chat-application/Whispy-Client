import { useEffect, useRef, useState } from "react";
import { getUserById } from "../ceramic/userService";  // import para resolver username

interface Message {
  stream_id: string;
  author: string;
  content: string;
  date: string;
  msgType: string;
}

interface ChatListProps {
  messages: Message[];
}

const ChatList: React.FC<ChatListProps> = ({ messages }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [myStreamId, setMyStreamId] = useState<string | null>(null);
  const [usernames, setUsernames] = useState<Record<string, string>>({}); // cache de usernames

  useEffect(() => {
    const stored = localStorage.getItem("orbis:user");
    const me = stored ? JSON.parse(stored).stream_id : null;
    setMyStreamId(me);
  }, []);

  // Auto-scroll al final
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  // Ordenar mensajes por fecha
  const sorted = [...messages].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Cargar usernames faltantes
  useEffect(() => {
    const authors = Array.from(new Set(sorted.map(m => m.author)));
    const missing = authors.filter(id => !usernames[id]);
    if (missing.length === 0) return;

    missing.forEach(async (id) => {
      try {
        const user = await getUserById(id);
        setUsernames(prev => ({ ...prev, [id]: user.username }));
      } catch (e) {
        console.error("Error fetching username for", id, e);
      }
    });
  }, [sorted, usernames]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900 flex flex-col space-y-3"
    >
     {sorted.map((msg) => {
  const isMine = msg.author === myStreamId;
  const time = new Date(msg.date).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const authorName = msg.author === myStreamId
    ? "Tú"
    : usernames[msg.author] || msg.author.substring(0,6);

  return (
    <div
      key={msg.stream_id}
      className={`max-w-[70%] p-3 rounded-lg shadow-md break-words flex flex-col
        ${isMine
          ? "self-end bg-blue-500 text-white"
          : "self-start bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
        }`}
    >
      {/* Autor arriba */}
      <span className="mb-1 text-xs text-gray-500 dark:text-gray-400">
        {authorName}
      </span>
      {/* Contenido */}
      <div className="flex-1 text-sm">
        {msg.content}
      </div>
      {/* Hora abajo a la derecha */}
      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 self-end">
        {time}
      </span>
    </div>
  );
})}
    </div>
  );
};

export default ChatList;