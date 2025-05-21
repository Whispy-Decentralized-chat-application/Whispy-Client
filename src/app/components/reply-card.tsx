"use client";
import React, { useState, useEffect } from "react";
import { FiHeart, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { checkLike, getNumberOfLikes, underlikeObject, likeObject } from "../ceramic/likeService";

interface Reply {
  stream_id: string;
  content: string;
  date: string;
  username: string;
}

const ReplyCard: React.FC<{ reply: Reply }> = ({ reply }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchLikes() {
      const [initialLiked, initialCount] = await Promise.all([
        checkLike(reply.stream_id),
        getNumberOfLikes(reply.stream_id),
      ]);
      setLiked(!!initialLiked);
      setLikeCount(initialCount);
    }
    fetchLikes();
  }, [reply.stream_id]);

  const handleLike = async () => {
    if (liked) {
      await underlikeObject(reply.stream_id);
      setLiked(false);
      setLikeCount((c) => Math.max(c - 1, 0));
    } else {
      await likeObject(reply.stream_id);
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {reply.username}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-300">
            {new Date(reply.date).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
        <button onClick={() => setExpanded((e) => !e)} className="focus:outline-none">
          {expanded ? <FiChevronUp className="text-gray-600 dark:text-gray-300" /> : <FiChevronDown className="text-gray-600 dark:text-gray-300" />}
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-1 text-gray-900 dark:text-gray-100">
        <div className={`${expanded ? "" : "h-32 overflow-hidden"}`} dangerouslySetInnerHTML={{ __html: reply.content }} />
      </div>

      {/* Footer Actions */}
      <div className="px-4 pb-4 flex items-center">
        <button onClick={handleLike} className="flex items-center focus:outline-none">
          <FiHeart className={liked ? "text-red-500" : "text-transparent"} size={18} />
          <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">{likeCount}</span>
        </button>
      </div>
    </div>
  );
};

export default ReplyCard;
