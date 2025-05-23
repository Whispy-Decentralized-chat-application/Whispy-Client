"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { getMe, registerUser } from "../ceramic/userService";

const Register = () => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const router = useRouter();


  useEffect(() => {
    if(typeof window !== "undefined" && localStorage.getItem("orbis:user")){ 
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === "orbis:user" && e.newValue) {
          router.push("/");
        }
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
    }, [router]);

  useEffect(() => {
    // Configurar tema
    const storedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.add(storedTheme);
    } else {
      document.documentElement.classList.add("light");
    }

    // Verificar sesión o perfil de usuario
    const fetchUser = async () => {
      const session = localStorage.getItem("orbis:session");
      let userProfile:any;
      try {
        userProfile = localStorage.getItem("orbis:user");
  
        if (userProfile) {
          router.push("/"); // Redirige si ya hay perfil
        }else {
          const user = await getMe();
          localStorage.setItem("orbis:user", JSON.stringify(user));
          router.push("/"); // Redirige si hay perfil
        }
      } catch (error) {
        if (!session) {
          router.push("/login"); // Redirige si no hay sesión
        }
      }
    };

    fetchUser();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);

    localStorage.setItem("theme", newTheme);
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      setError("Por favor, ingresa un nombre de usuario.");
      return;
    }

    setError("");
    try {
      // Registrar usuario en OrbisDB utilizando la función registerUser
      const userData = username ;
      const result = await registerUser(userData);
      console.log("Usuario registrado:", result);

      router.push("/");
    } catch (err: any) {
      console.error("Error al registrar:", err);
      setError("Error al registrar el usuario.");
    }
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

        {/* Input de Nombre de Usuario */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nombre de usuario"
          className="w-full p-3 border rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        {/* Botón de Registro */}
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
