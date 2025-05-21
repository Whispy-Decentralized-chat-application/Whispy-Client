"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { getCommunityById, joinCommunity } from "@/app/ceramic/communityService";
import { retrieveCommunityPosts } from "@/app/ceramic/postService";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";





const CommunityPage: React.FC = () => {
  const { controller } = useParams() as { controller: string };
  const router = useRouter();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [showBanner, setShowBanner] = useState(true);

  // estado editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [content, setContent] = useState("");

  

  useEffect(() => {
    ;(async () => {
      const data = await getCommunityById(controller);
      setCommunity(data);
      const p = await retrieveCommunityPosts(controller);
      setPosts(p);
    })();
  }, [controller]);

  useEffect(() => {
    const onScroll = () => setShowBanner(window.scrollY < 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleJoin = async () => {
    await joinCommunity(controller);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    //await createPost(controller, content);
    const p = await retrieveCommunityPosts(controller);
    setPosts(p);
    setContent("");
    setEditorOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner */}
      <div
        className={`fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md transition-transform duration-300 z-10 ${
          showBanner ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold truncate">
            {community?.name || "Cargando..."}
          </h1>
          <button
            onClick={handleJoin}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            Unirme
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="pt-20 px-4 space-y-4 pb-32">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {new Date(post.date).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div
                className="text-base text-gray-900 dark:text-gray-100"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No hay publicaciones.
          </p>
        )}
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-6 left-6">
        <motion.button
          onClick={() => setEditorOpen((o) => !o)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          {editorOpen ? <FiX size={24} /> : <FiPlus size={24} />}
        </motion.button>
      </div>

      {/* Editor Panel */}
<AnimatePresence>
  {editorOpen && (
    <motion.div
      className="
        fixed inset-x-6 bottom-20
        max-w-3xl w-[calc(100%-3rem)] h-[60vh]
        p-6 bg-white dark:bg-gray-800
        rounded-2xl shadow-2xl z-20

        flex flex-col         /* ① */
        min-h-0               /* ② */
      "
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.2 }}
    >
      <ReactQuill
        theme="snow"
        value={content}
        onChange={setContent}
        modules={{
          toolbar: [
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
          ],
        }}
        className="
          flex flex-col         /* hace que toolbar + container sean hijos flexibles */
          flex-1                /* ocupa todo el espacio disponible */
          min-h-0               /* permite que encoger funcione */
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          mb-4
        "
      />

      <button
        onClick={handleSubmit}
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        Publicar
      </button>

      <style jsx global>{`
        .ql-toolbar {
          background-color: #f3f4f6;
          border-bottom: 1px solid #d1d5db;
        }
        .dark .ql-toolbar {
          background-color: rgb(134, 138, 146);
          border-bottom: 1px solid #4b5563;
        }
        .ql-toolbar .ql-formats button {
          color: #1f2937;
        }
        .dark .ql-toolbar .ql-formats button {
          color: #f3f4f6;
        }

        /* ③ que el contenedor interno respete el flex y haga scroll interno */
        .ql-container {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          min-height: 0 !important;
          overflow-y: auto;
          border: none;
        }
        .ql-editor {
          flex: 1 !important;
          min-height: 0 !important;
        }
      `}</style>
    </motion.div>
  )}
</AnimatePresence>


    </div>
  );
};

export default CommunityPage;