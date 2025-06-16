"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import ThemeToggle from "../components/ThemeToggle";
import {
  getMe,
  changeProfilePicture,
  updateBio,
} from "../ceramic/userService";
import { FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";


interface UserProfile {
  stream_id: string;
  username: string;
  bio: string;
  profilePicture?: string;
  controller: string;
}

export default function SettingsPage() {
      const router = useRouter();                                 // ← adicional

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const u = await getMe();
      setProfile(u);
      setBio(u.bio || "");
      setPreview(u.profilePicture);
    })();
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  async function resizeAndConvert(file: File, maxSize = 200): Promise<string> {
  const b64 = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(maxSize / width, maxSize / height, 1);
      width *= ratio;
      height *= ratio;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // calidad opcional: 0.8
      const resized = canvas.toDataURL("image/jpeg", 0.8);
      resolve(resized);
    };
    img.onerror = reject;
    img.src = b64;
  });
}


  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.onerror = () => rej(reader.error);
      reader.readAsDataURL(file);
    });

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
       if (imageFile) {
      const smallB64 = await resizeAndConvert(imageFile, 200);
      await changeProfilePicture(smallB64);
    }

    if (bio !== profile.bio) {
      await updateBio(bio);
    }

      const updated = await getMe();
      localStorage.setItem("orbis:user", JSON.stringify(updated));
      setProfile(updated);
      setPreview(updated.profilePicture);
    } catch (err) {
      console.error("Error guardando perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="absolute top-4 left-4">
            <button
                onClick={() => router.back()}
                className="p-2 rounded-full bg-white dark:bg-gray-800 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
                <FiArrowLeft className="h-5 w-5 text-gray-800 dark:text-gray-200" />
            </button>
        </div>
      <div className="w-full max-w-2xl mx-4 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Ajustes de usuario
        </h1>

        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-6 mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            {preview ? (
              <img
                src={preview}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="block w-full h-full text-gray-500 dark:text-gray-400 flex items-center justify-center text-3xl">
                👤
              </span>
            )}
          </div>
          <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={profile.username}
              disabled
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dirección blockchain
            </label>
            <input
              type="text"
              value={profile.controller}
              disabled
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
              Biografía
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <ThemeToggle />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}