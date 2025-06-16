"use client";
import React, { useState, useRef, ChangeEvent, useEffect } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void | Promise<void>;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPreviewingAudio, setIsPreviewingAudio] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    const payload = { msgType: "text", content: message.trim() };
    await onSendMessage(JSON.stringify(payload));
    setMessage("");
  };

  const handleFileChange = async (
  e: ChangeEvent<HTMLInputElement>,
  type: "image" | "file"
) => {
  const file = e.target.files?.[0];
  e.target.value = ""; // <- IMPORTANTE: resetear input para permitir subir el mismo archivo dos veces

  if (!file || disabled) return;

  if (type === "file" && file.size > 150000) {
    alert("El documento es demasiado grande. Intenta que pese menos de 180 KB.");
    return;
  }

  if (type === "image") {
  try {
    const resizedBase64 = await resizeImage(file);

    const base64Size = Math.ceil((resizedBase64.length * 3) / 4); // estimación real bytes
    if (base64Size > 200000) {
      alert("La imagen es demasiado grande tras redimensionar (máx. 200 KB).");
      return;
    }

    const payload = { msgType: "image", content: resizedBase64 };
    await onSendMessage(JSON.stringify(payload));
  } catch {
    alert("Hubo un error al procesar la imagen.");
  }
  return;
}

  if (type === "file") {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const payload = { msgType: "file", content: base64 };
      await onSendMessage(JSON.stringify(payload));
    };
    reader.readAsDataURL(file);
    return;
  }
};
  const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") return reject();
      img.src = reader.result;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject();

      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/jpeg", 0.6); // Comprimir
      resolve(base64);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunks.current = [];

    recorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      setAudioBlob(blob);
      setIsPreviewingAudio(true);
    };

    recorder.start();
    setIsRecording(true);

    // Detener automáticamente después de 15s
    setTimeout(() => {
      recorder.stop();
      setIsRecording(false);
    }, 15_000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Cerrar popup al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center gap-2 p-4 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700"
    >
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Escribe un mensaje..."
        disabled={disabled}
        className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
      />

      {/* Menú de adjuntos con click */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsMenuOpen(prev => !prev)}
          disabled={disabled}
          className="p-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition disabled:opacity-50"
        >
          📎
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2 z-10 flex flex-col bg-white dark:bg-gray-900 border dark:border-gray-700 shadow-lg rounded-md">
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Imagen
            </button>
            <button
              type="button"
              onClick={() => docInputRef.current?.click()}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Documento
            </button>
          </div>
        )}
      </div>

      {/* Inputs ocultos */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleFileChange(e, "image")}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        hidden
        onChange={(e) => handleFileChange(e, "file")}
      />

      {/* Botón grabación audio */}
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="ml-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          ⏹️
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="ml-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
        >
          🎙️
        </button>
      )}

      {isPreviewingAudio && audioBlob && (
  <div className="w-full flex flex-col items-end space-y-2">
    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
    <div className="flex gap-2">
      <button
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={async () => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            const payload = { msgType: "audio", content: base64 };
            await onSendMessage(JSON.stringify(payload));
            setIsPreviewingAudio(false);
            setAudioBlob(null);
          };
          reader.readAsDataURL(audioBlob);
        }}
      >
        ✅ Enviar
      </button>
      <button
        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
        onClick={() => {
          setIsPreviewingAudio(false);
          setAudioBlob(null);
        }}
      >
        ❌ Cancelar
      </button>
    </div>
  </div>
)}

      <button
        type="submit"
        disabled={disabled}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
      >
        Enviar
      </button>
    </form>
  );
};

export default ChatInput;