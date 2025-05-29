"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { registerUser } from "../ceramic/userService";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

const Register = () => {
  // Solo protege el registro si ya está logeado (opcional, puedes quitar si no quieres redirect automático)
  useAuthRedirect();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showModal, setShowModal] = useState(false);
  const [privateKeyToDownload, setPrivateKeyToDownload] = useState<string | null>(null);
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);

  // Configuración de tema
 useEffect(() => {
  const storedTheme = localStorage.getItem("theme") as "light" | "dark";
  if (storedTheme) {
    setTheme(storedTheme);
    document.documentElement.classList.add(storedTheme);
  } else {
    document.documentElement.classList.add("light");
  }
}, []); // <--- Esto debe quedarse siempre igual, SOLO []

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);

    localStorage.setItem("theme", newTheme);
  };

  const handleDownloadKey = () => {
    if (!privateKeyToDownload) return;
    const blob = new Blob([privateKeyToDownload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "whispy-key.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError("Por favor, ingresa un nombre de usuario.");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Debes introducir y confirmar la contraseña.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setError("");
    try {
      // Registrar usuario en OrbisDB utilizando la función registerUser
      const privateKey = await registerUser(username, password);
      // Mostrar modal de aviso y guardar la clave en estado temporal
      setPrivateKeyToDownload(privateKey);
      setShowModal(true);
    } catch (err: any) {
      console.error("Error al registrar:", err);
      setError("Error al registrar el usuario.");
    }
  };

  // Cierre del modal y redirección a login
  const handleCloseModal = () => {
    setShowModal(false);
    setPrivateKeyToDownload(null);
    router.push("/login");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      {/* Botón para cambiar de tema */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
      >
        {theme === "light" ? <FiMoon className="text-xl" /> : <FiSun className="text-xl" />}
      </button>

      {showModal && privateKeyToDownload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-[90vw] max-w-md text-center relative">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              ¡Guarda tu clave privada!
            </h3>
            <p className="mb-4 text-gray-800 dark:text-gray-200">
              Descarga y guarda este archivo JSON. Es tu clave de acceso a Whispy. <br />
              <span className="font-bold text-red-600">
                Si la pierdes, no podrás recuperar tus mensajes cifrados.
              </span>
            </p>
            <button
              onClick={handleDownloadKey}
              className="bg-blue-600 text-white rounded px-6 py-2 font-semibold hover:bg-blue-700 mb-4"
            >
              Descargar clave privada (.json)
            </button>
            <br />
            <button
              onClick={handleCloseModal}
              className="bg-green-600 text-white rounded px-6 py-2 font-semibold hover:bg-green-700"
            >
              He guardado la clave
            </button>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-4">
          Crear Cuenta de Whispy
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de usuario"
          className="w-full p-3 border rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full p-3 border rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar contraseña"
          className="w-full p-3 border rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        {password && confirmPassword && password !== confirmPassword && (
          <p className="text-red-500 text-center mb-4">
            Las contraseñas no coinciden.
          </p>
        )}

        <button
          onClick={handleRegister}
          className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
        >
          Registrarse
        </button>
      </motion.div>
    </div>
  );
};

export default Register;
