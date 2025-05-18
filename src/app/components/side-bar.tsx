import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSettings, FiLogOut, FiChevronUp, FiChevronDown, FiCheck, FiX, FiSlash, FiMoreVertical } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { FiUserPlus } from "react-icons/fi";  // añade este import
import ThemeToggle from "./ThemeToggle";
import { createChat, getChatMembers, retrieveMyChats } from "../ceramic/chatService";
import { acceptFriendRequest, retrieveContacts, retrieveFriendRequests, sendFriendRequest } from "../ceramic/relationService";


interface SideBarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

const SideBar: React.FC<SideBarProps> = ({ selectedChatId, onSelectChat }) => {  const [activeSection, setActiveSection] = useState<
    "main" | "contacts" | "chats" | "communities"
  >("main");

  const [confirmBlockId, setConfirmBlockId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [newContactId, setNewContactId] = useState(""); // para el modal de añadir contacto
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [chatName, setChatName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [availableContacts, setAvailableContacts] = useState<any[]>([]);
  const [selectedMembersForChat, setSelectedMembersForChat] = useState<string[]>([]);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [chatMenuOpenFor, setChatMenuOpenFor] = useState<string | null>(null);
  const [showMembersFor, setShowMembersFor] = useState<string | null>(null);
  const [chatMembers, setChatMembers] = useState<{ username: string; userId: string }[]>([]);

  const router = useRouter();

  const handleBack = () => setActiveSection("main");

  // Animaciones para las transiciones
  const variants = {
    hidden: { x: "-100%", opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("orbis:session");
    localStorage.removeItem("orbis:user");
    setIsSettingsOpen(false);
    router.push("/login"); // Redirigir a login después de cerrar sesión
  };

  const openMembersModal = async (chatId: string) => {
    try {
      const members:any = await getChatMembers(chatId);
      setChatMembers(members);
      setShowMembersFor(chatId);
    } catch (e) {
      console.error("Error cargando miembros de chat:", e);
    }
  };

  // Obtener chats cuando se selecciona la sección "chats"
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const myChats = await retrieveMyChats();
        console.log("Chats obtenidos:", myChats);
        setChats(myChats);
      } catch (error) {
        console.error("Error al obtener los chats:", error);
      }
    };

    if (activeSection === "chats") {
      fetchChats();
    }
  }, [activeSection]);

  useEffect(() => {
    if (isCreateChatOpen) {
      (async () => {
        try {
          const data = await retrieveContacts();
          setAvailableContacts(data);
        } catch (err) {
          console.error("Error cargando contactos para chat:", err);
        }
      })();
    }
  }, [isCreateChatOpen]);

  const filteredContacts = useMemo(() => 
    availableContacts
      .filter(c => {
        const name = (c.username || c.controller).toLowerCase();
        return name.includes(contactSearchTerm.toLowerCase());
      })
      .filter(c => !selectedMembersForChat.includes(c.stream_id))
  , [availableContacts, contactSearchTerm, selectedMembersForChat]);


  const handleSelectMember = (streamId: string, checked: boolean) => {
    setSelectedMembersForChat(prev =>
      checked
        ? [...prev, streamId]
        : prev.filter(id => id !== streamId)
    );
  };

  const handleContactsClick = async () => {
    setActiveSection("contacts");
    try {
      const data = await retrieveContacts();
      setContacts(data);
      const pending = await retrieveFriendRequests();
      setPendingRequests(pending);
    } catch (error) {
      console.error("Error al obtener contactos o pendientes:", error);
    }
  };

  // opcional: handlers para aceptar/rechazar
 // ACEPTAR petición y actualizar estado
 const handleAcceptRequest = async (userPeer: string, eventPeer: string) => {
  try {
    await acceptFriendRequest(userPeer, eventPeer);
    // refrescar contactos y solicitudes pendientes
    const updatedContacts = await retrieveContacts();
    setContacts(updatedContacts);
    const updatedPending = await retrieveFriendRequests();
    setPendingRequests(updatedPending);
  } catch (error) {
    console.error("Error al aceptar petición:", error);
  }
};

// RECHAZAR petición y actualizar estado
const handleRejectRequest = async (streamId: string) => {
  try {
    // TODO: implementar lógica de rechazo en backend
    // Eliminamos del array local para evitar datos inconsistentes
    setPendingRequests(prev => prev.filter(req => req.stream_id !== streamId));
  } catch (error) {
    console.error("Error al rechazar petición:", error);
  }
};

  // Lógica para bloquear
  const performBlock = async () => {
    if (!confirmBlockId) return;
    try {
      await handleBlockRequest(confirmBlockId);
    } catch (e) {
      console.error("Error bloqueando usuario:", e);
    }
    setConfirmBlockId(null);
  };

  const handleBlockRequest = async (from: string) => {
    // TODO: implementar lógica de bloqueo
    console.log("Bloquear usuario:", from);
  };


  const handleSendFriendRequest = async (to: string) => {
    try {
      await sendFriendRequest(to);
      setIsAddContactOpen(false);
    } catch (error) {
      console.error("Error enviando petición de amistad:", error);
    }
  };

  // Función para actualizar el valor de un miembro en una posición determinada
const handleMemberChange = (index: number, value: string) => {
  const newMembers = [...members];
  newMembers[index] = value;
  setMembers(newMembers);
};

// Función para agregar un nuevo input de miembro (vacío)
const addMemberInput = () => {
  setMembers([...members, ""]);
};

// Función para remover un input de miembro
const removeMemberInput = (index: number) => {
  const newMembers = [...members];
  newMembers.splice(index, 1);
  setMembers(newMembers);
};

// Actualiza la función de crear chat para usar el array "members"
const handleCreateChat = async () => {
  if (!chatName.trim() || selectedMembersForChat.length === 0) return;
  try {
    await createChat(chatName, selectedMembersForChat);
    const myChats = await retrieveMyChats();
    setChats(myChats);
    setIsCreateChatOpen(false);
    setChatName("");
    setSelectedMembersForChat([]);
  } catch (error) {
    console.error("Error creando chat:", error);
  }
};

  return (
    <div className="w-64 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg flex flex-col overflow-hidden h-full">
    {/* Contenido superior: Menú y secciones */}
    <div className="flex-grow">
      <div className="p-4 bg-gray-300 dark:bg-gray-700 flex items-center">
        {activeSection !== "main" && (
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            <FiArrowLeft className="text-xl" />
          </button>
        )}
        <h2
          className={`text-lg font-bold ${
            activeSection === "main" ? "hidden" : "block"
          }`}
        >
          {activeSection === "contacts" && "Contactos"}
          {activeSection === "chats" && "Chats"}
          {activeSection === "communities" && "Comunidades"}
        </h2>
      </div>

      <motion.div
        key={activeSection}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="p-4"
      >
        {activeSection === "main" && (
          <div className="space-y-4">
           <div className="flex">
           <button
                onClick={handleContactsClick}
                className="flex-grow p-3 bg-blue-500 text-white rounded-l-lg hover:bg-blue-600 transition"
              >
                Contactos
              </button>
            <button
              onClick={() => setIsAddContactOpen(true)}
              className="p-3 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition"
            >
              <FiUserPlus className="text-xl" />
            </button>
          </div>
            <button
              onClick={() => setActiveSection("chats")}
              className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Chats
            </button>
            <button
              onClick={() => setActiveSection("communities")}
              className="w-full p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
            >
              Comunidades
            </button>
          </div>
        )}

    {activeSection === "contacts" && (
      <>
          <ul className="space-y-2">
      {contacts.length > 0 ? (
        contacts.map((c, i) => (
          <li
            key={i}
            onClick={() => router.push(`/profile/${c.stream_id}`)}
            className="p-3 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition cursor-pointer"
          >
            {c.username || c.controller}
          </li>
        ))
      ) : (
        <p>No hay contactos.</p>
      )}
    </ul>

        {/* BANDA DE PENDING */}
        <div
          onClick={() => setIsPendingOpen((o) => !o)}
          className="mt-4 bg-yellow-100 dark:bg-yellow-700 flex justify-between items-center px-4 py-2 rounded-lg cursor-pointer"
        >
          <span className="text-yellow-800 dark:text-yellow-200">
            Solicitudes pendientes ({pendingRequests.length})
          </span>
          {isPendingOpen ? (
            <FiChevronUp className="text-yellow-800 dark:text-yellow-200" />
          ) : (
            <FiChevronDown className="text-yellow-800 dark:text-yellow-200" />
          )}
        </div>

        {isPendingOpen && (
          <ul className="mt-2 space-y-2">
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <li
                key={req.stream_id}
                className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-800 p-3 rounded-lg"
              >
                {/* Mostrar el username del solicitante */}
                <span className="text-gray-800 dark:text-gray-200">
                  {req.username}
                </span>
                <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptRequest(req.userStream, req.eventToRespond)}
                  className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                >
                  <FiCheck className="text-lg" />
                </button>
                <button
                  onClick={() => handleRejectRequest(req.stream_id)}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <FiX className="text-lg" />
                </button>
                <button
                  onClick={() => setConfirmBlockId(req.stream_id)}
                  className="p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
                >
                  <FiSlash className="text-lg" />
                </button>
                </div>
              </li>
            ))
          ) : (
            <p className="px-4 py-2 text-gray-600 dark:text-gray-400">
              No hay solicitudes pendientes.
            </p>
          )}
        </ul>
        )}
      </>
    )}

    {/* Confirmación de bloqueo */}
    {confirmBlockId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-lg w-80"
          >
            <h3 className="text-lg font-bold mb-4">Confirmar bloqueo</h3>
            <p className="mb-6">
              ¿Estás seguro de bloquear a este usuario? Ya no podrás ver sus peticiones.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmBlockId(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                onClick={performBlock}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Bloquear
              </button>
            </div>
          </motion.div>
        </div>
      )}

{activeSection === "chats" && (
        <>
          <ul className="space-y-2">
          {chats.map((chat) => {
  const isSelected = chat.stream_id === selectedChatId;
  return (
    <li key={chat.stream_id} className="relative flex items-center">
      <div
        onClick={() => onSelectChat(chat.stream_id)}
        className={`flex-1 px-3 py-3 rounded-l-lg cursor-pointer transition ${
          isSelected
            ? "bg-indigo-500 text-white"
            : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
        }`}
      >
        {chat.title || `Chat ${chat.stream_id.substring(0, 6)}`}
      </div>
      <button
        onClick={() =>
          setChatMenuOpenFor(
            chatMenuOpenFor === chat.stream_id ? null : chat.stream_id
          )
        }
        className={`px-3 py-3 rounded-r-lg flex items-center justify-center transition ${
          isSelected
            ? "bg-indigo-500 text-white"
            : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
        }`}
      >
        <FiMoreVertical className="text-xl" />
      </button>
                  {chatMenuOpenFor === chat.stream_id && (
                    <div className="absolute right-0 mt-10 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                      <button
                        onClick={() => {
                          openMembersModal(chat.stream_id);
                          setChatMenuOpenFor(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Ver miembros
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            onClick={() => setIsCreateChatOpen(true)}
            className="mt-4 w-full p-3 bg-indigo-500 text-white rounded-lg"
          >
            Crear Chat
          </button>
        </>
      )}

      {/* Modal de miembros */}
      {showMembersFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-lg w-80 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Miembros del chat</h3>
              <button onClick={() => setShowMembersFor(null)}>
                <FiX />
              </button>
            </div>
            <ul className="space-y-2">
              {chatMembers.map((m) => (
                <li
                  key={m.userId}
                  onClick={() => {
                    setShowMembersFor(null);
                    router.push(`/profile/${m.userId}`);
                  }}
                  className="cursor-pointer px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {m.username}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

        {activeSection === "communities" && (
          <ul className="space-y-2">
            {["React Developers", "Gaming", "Fitness"].map(
              (community, index) => (
                <li
                  key={index}
                  className="p-3 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  {community}
                </li>
              )
            )}
          </ul>
        )}
      </motion.div>
    </div>

    {/* Botón de ajustes en la parte inferior */}
    <div className="p-4 border-t border-gray-300 dark:border-gray-700 mt-auto">
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="w-full flex items-center justify-center p-3 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
      >
        <FiSettings className="text-xl mr-2" />
        Ajustes
      </button>
    </div>

      {/* Modal de Configuración */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-lg w-96"
          >
            <h2 className="text-lg font-bold mb-4">Configuración</h2>
            <p className="mb-4">Ajustes de la aplicación.</p>

            {/* Botón de Cerrar Sesión dentro del modal */}
            <ThemeToggle/>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              <FiLogOut className="text-xl mr-2" />
              Cerrar Sesión
            </button>

            {/* Botón para cerrar el modal */}
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Cerrar
            </button>
          </motion.div>
        </div>
      )}

      {/* Modal de Añadir Contacto */}
      {isAddContactOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-lg w-80"
          >
            <h2 className="text-lg font-bold mb-4">Añadir Contacto</h2>
            <input
              type="text"
              placeholder="Dirección blockchain o nombre de usuario"
              className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700 mb-4"
              onChange={e => setNewContactId(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddContactOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSendFriendRequest(newContactId)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Enviar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Crear Chat */}
      {isCreateChatOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-6 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-lg font-bold mb-4">Crear Chat</h2>
        <div className="mb-4">
          <label className="block text-sm mb-1">Nombre del Chat</label>
          <input
            type="text"
            value={chatName}
            onChange={e => setChatName(e.target.value)}
            placeholder="Ingrese el nombre del chat"
            className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700"
          />
        </div>

        {/* Etiquetas de miembros seleccionados */}
        <div className="mb-4 flex flex-wrap gap-2">
          {selectedMembersForChat.map(streamId => {
            const contact = availableContacts.find(c => c.stream_id === streamId);
            return (
              <div
                key={streamId}
                className="flex items-center bg-blue-100 dark:bg-blue-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full"
              >
                <span className="mr-1 text-sm">
                  {contact?.username || contact?.controller}
                </span>
                <FiX
                  className="cursor-pointer"
                  onClick={() => handleSelectMember(streamId, false)}
                />
              </div>
            );
          })}
        </div>

        {/* Buscador de contactos */}
        <div className="mb-4 relative">
          <input
            type="text"
            value={contactSearchTerm}
            onChange={e => setContactSearchTerm(e.target.value)}
            placeholder="Añadir miembros..."
            className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
          />
          {contactSearchTerm && filteredContacts.length > 0 && (
            <ul className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md max-h-40 overflow-auto z-50">
              {filteredContacts.map(c => (
                <li
                  key={c.stream_id}
                  onClick={() => {
                    handleSelectMember(c.stream_id, true);
                    setContactSearchTerm("");
                  }}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                >
                  {c.username || c.controller}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setIsCreateChatOpen(false)}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreateChat}
            className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
          >
            Crear
          </button>
        </div>
      </motion.div>
    </div>
  )}
    </div>
  );
};

export default SideBar;