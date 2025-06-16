"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { retrievePost } from "@/app/ceramic/postService";
import { retrieveReplies, replyToPost } from "@/app/ceramic/replyService";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPlus } from "react-icons/fi";
import ReplyCard from "@/app/components/reply-card";
import { getUserByBcAdress } from "@/app/ceramic/userService";
import { parseToBcAddress } from "@/app/ceramic/orbisDB";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface Post {
  stream_id: string;
  title?: string;
  date: string;
  content: string;
  username: string;
  communityId: string;
}
interface Reply {
  stream_id: string;
  content: string;
  date: string;
  username: string;
}

export default function PostPage() {
  const { postId } = useParams() as { postId: string };
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState("<p></p>");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});


  const fetchReplies = async () => {
    try {
      const fetched = await retrieveReplies(postId);
      const mapped = await Promise.all(
        fetched.map(async (r: any) => {
          let username = "Desconocido";
          const bcAddress = r.writer ? parseToBcAddress(r.writer) : null;
          if (bcAddress) {
            const user = await getUserByBcAdress(bcAddress);
            username = user.username;
          }
          return {
            stream_id: r.stream_id,
            content: r.content,
            date: r.indexed_at,
            username,
          };
        })
      );
      setReplies(mapped);
    } catch (err) {
      console.error("Error fetching replies:", err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const fetched = await retrievePost(postId);
        setPost(fetched);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [postId]);

  useEffect(() => {
    if (!post) return;
    (async () => {
      try {
        const fetched = await retrieveReplies(postId);
        // mapeamos y resolvemos getUserByBcAdress para cada reply
        const mapped = await Promise.all(
          fetched.map(async (r: any) => {
            let username = "Desconocido";
            if (r.writer) {
              // pasamos r.writer a la función
              debugger;
              const bcAddress = r.writer ? parseToBcAddress(r.writer) : null;
              const user = bcAddress ? await getUserByBcAdress(bcAddress) : { username: "Desconocido" };
              username = user.username;
            }
            return {
              stream_id: r.stream_id,
              content: r.content,
              date: r.indexed_at,
              username,
            };
          })
        );
        setReplies(mapped);
      } catch (err) {
        console.error("Error fetching replies:", err);
      }
    })();
  }, [postId, post]);

  const handleReply = async () => {
    if (!newReply || newReply === "<p></p>") return;
    setSending(true);
    try {
      await replyToPost(postId, newReply);
      await fetchReplies();          // ← refresca las respuestas
      setNewReply("<p></p>");        // ← limpia el editor
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><span className="text-gray-500">Cargando...</span></div>;
  if (!post) return <div className="p-4">No se encontró la publicación.</div>;

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Banner */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-10">
        <div className="flex items-center p-4">
          <button onClick={() => router.push(`/community/${post.communityId}`)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <FiArrowLeft className="text-xl" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-20 p-4 w-full">
        <article className="w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {post.title && <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{post.title}</h1>}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {new Date(post.date).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })} • {post.username}
          </div>
          <div className="prose dark:prose-dark max-w-full text-gray-900 dark:text-gray-100" dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>

        {/* Replies */}
        <div className="mt-8 space-y-4">
          {replies.map((reply) => (
            <div key={reply.stream_id}>
              <ReplyCard reply={reply} />
            </div>
          ))}
        </div>

        {/* Reply Editor Toggle */}
              {/* Reply Editor Toggle */}
      <div className="fixed bottom-6 right-6">
        <motion.button
          onClick={() => setExpandedReplies((prev) => ({ ...prev, editor: !prev.editor }))}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg"
          whileTap={{ scale: 0.9 }}
        >
          {expandedReplies.editor ? <FiX size={24} /> : <FiPlus size={24} />}
        </motion.button>
      </div>

      {/* Editor Panel */}
      <AnimatePresence>
        {expandedReplies.editor && (
          <motion.div
            className="
              fixed bottom-20 right-6 left-auto
              max-w-md w-[calc(100%-3rem)] h-[50vh]
              p-6 bg-white dark:bg-gray-800
              rounded-2xl shadow-2xl z-20

              flex flex-col
              min-h-0
            "
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.2 }}
          >
            <ReactQuill
              theme="snow"
              value={newReply}
              onChange={setNewReply}
              modules={{
                toolbar: [
                  ["bold", "italic", "underline", "strike"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"],
                ],
              }}
              className="
                flex flex-col
                flex-1
                min-h-0
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                mb-4
              "
            />

            <button
              onClick={handleReply}
              disabled={sending}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              {sending ? "Enviando..." : "Publicar respuesta"}
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
        </div>
    );
}
