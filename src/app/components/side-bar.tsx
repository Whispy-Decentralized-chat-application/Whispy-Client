import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiArrowLeft, FiSettings, FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { retrieveMyChats } from "../ceramic/orbisDB";

const SideBar = () => {
  const [activeSection, setActiveSection] = useState<
    "main" | "contacts" | "chats" | "communities"
  >("main");

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  return (
    <div className="w-64 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg flex flex-col justify-between overflow-hidden">
      {/* Parte superior: Opciones principales */}
      <div>
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

      {/* Parte inferior: Botón de ajustes */}
      <div className="p-4 border-t border-gray-300 dark:border-gray-700">
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
    </div>
  );
};

export default SideBar;