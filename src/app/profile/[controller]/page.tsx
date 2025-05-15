"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiUserPlus } from "react-icons/fi";
import { getUserByBcAdress, getUserByUsername } from "@/app/ceramic/userService";
import { isFriend, sendFriendRequest } from "@/app/ceramic/relationService";

interface Profile {
  stream_id: string;
  controller: string;
  bio: string;
  username: string;
}

const OtherProfilePage = () => {
  const { controller } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [canAdd, setCanAdd] = useState(false);
  const router = useRouter();

  // Obtener perfil
  useEffect(() => {
    if (!controller) {
      router.push("/profile");
      return;
    }
    const param = Array.isArray(controller) ? controller[0] : controller;
    const isBc = /^0x[0-9a-fA-F]{40}$/.test(param);
    (async () => {
      try {
        const data = isBc
          ? await getUserByBcAdress(param)
          : await getUserByUsername(param);
        if (!data) {
          router.push("/profile");
          return;
        }
        setProfile(data);
      } catch {
        router.push("/profile");
      }
    })();
  }, [controller, router]);

  // Comprobar amistad (mostrar botón solo si isFriend devuelve true)
  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const me = localStorage.getItem("orbis:user");
        const myStreamId = me ? JSON.parse(me).stream_id : null;
        const ok = await isFriend(profile.stream_id) || profile.stream_id == myStreamId;
        setCanAdd(!ok);
      } catch {
        setCanAdd(false);
      }
    })();
  }, [profile]);

  const handleAddContact = async () => {
    if (!profile) return;
    try {
      await sendFriendRequest(profile.stream_id);
      console.log("Petición de amistad enviada a", profile.stream_id);
    } catch (err) {
      console.error("Error enviando petición de amistad:", err);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
            <img
              src="/avatar-placeholder.png"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            {profile.username}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
            {profile.controller}
          </p>
          <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
            {profile.bio || "Sin biografía."}
          </p>
          <div className="flex space-x-2 mt-6">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Volver
            </button>

            {canAdd && (
              <button
                onClick={handleAddContact}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              >
                <FiUserPlus className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => {}}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Reportar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherProfilePage;