"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiSun, FiMoon } from "react-icons/fi";
import { Web3Provider } from "@ethersproject/providers";
// Importa el SDK y el método de autenticación de OrbisDB (Ceramic)
import { OrbisDB } from "@useorbis/db-sdk";
import { OrbisEVMAuth } from "@useorbis/db-sdk/auth";
import { db } from "../ceramic/orbisDB";

// Extendemos la interfaz de Window para que reconozca ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const orbis = db; // Instancia global de OrbisDB

const Login = () => {
  const [error, setError] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [address, setAddress] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.add(storedTheme);
    } else {
      document.documentElement.classList.add("light");
    }

    // Si ya hay sesión, redirige a la home
    const session = localStorage.getItem("orbis:session");
    if (session) {
      router.push("/register");
    }
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleLogin = async () => {
    if (!window.ethereum) {
      setError("MetaMask no está instalado.");
      return;
    }
    try {
      // Solicitar conexión a la wallet
      const provider = window.ethereum;
      // Creamos la instancia de autenticación con el provider de MetaMask
      const auth = new OrbisEVMAuth(provider);
      // Conectamos el usuario: esto firma la petición y obtiene su DID
      const authResult = await orbis.connectUser({ auth });

      if (authResult) {
        debugger;
        console.log("Autenticación exitosa:", authResult);
        router.push("/register");
      } else {
        setError("Error en la autenticación: " + authResult);
      }
    } catch (err: any) {
      setError("Error en la autenticación con Ceramic.");
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md hover:shadow-lg transition-all duration-300"
      >
        {theme === "light" ? (
          <FiMoon className="text-xl" />
        ) : (
          <FiSun className="text-xl" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 text-center mb-4">
          Iniciar Sesión con Wallet 
        </h2>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
        >
          Conectar y firmar con MetaMask
        </button>

        {address && (
          <p className="text-center text-gray-600 dark:text-gray-300 mt-4">
            Conectado como: {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
