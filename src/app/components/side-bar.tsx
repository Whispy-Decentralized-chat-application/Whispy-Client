import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSettings, FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { retrieveMyChats, createChat } from "../ceramic/orbisDB";

const SideBar = () => {
  const [activeSection, setActiveSection] = useState<
    "main" | "contacts" | "chats" | "communities"
  >("main");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateChatOpen, setIsCreateChatOpen] = useState(false);
  const [chatName, setChatName] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [chats, setChats] = useState<any[]>([]);
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
  if (!chatName.trim()) return;
  // Filtrar entradas vacías
  const filteredMembers = members.map(m => m.trim()).filter(m => m !== "");
  try {
    await createChat(chatName, filteredMembers);
    // Opción: Volver a obtener los chats luego de la creación
    const myChats = await retrieveMyChats();
    setChats(myChats);
    setIsCreateChatOpen(false);
    setChatName("");
    setMembers([]);
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
            <button
              onClick={() => setActiveSection("contacts")}
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Contactos
            </button>
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
          <ul className="space-y-2">
            {["Juan", "María", "Carlos"].map((contact, index) => (
              <li
                key={index}
                className="p-3 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              >
                {contact}
              </li>
            ))}
          </ul>
        )}

        {activeSection === "chats" && (
          <>
            {chats.length > 0 ? (
              <ul className="space-y-2">
                {chats.map((chat, index) => (
                  <li
                    key={index}
                    className="p-3 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                  >
                    {chat.title || `Chat ${index + 1}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay chats disponibles.</p>
            )}
            <div className="mt-4">
              <button
                onClick={() => setIsCreateChatOpen(true)}
                className="w-full p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
              >
                Crear Chat
              </button>
            </div>
          </>
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

      {/* Modal de Crear Chat */}
      // Dentro del modal de "Crear Chat"
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
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Ingrese el nombre del chat"
                className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm mb-1">Miembros</label>
              {members.map((member, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => handleMemberChange(index, e.target.value)}
                    placeholder={`ID del miembro ${index + 1}`}
                    className="w-full p-2 border rounded-lg bg-gray-100 dark:bg-gray-700"
                  />
                  <button
                    onClick={() => removeMemberInput(index)}
                    className="ml-2 p-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    -
                  </button>
                </div>
              ))}
              <button
                onClick={addMemberInput}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
              >
                Agregar Miembro
              </button>
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