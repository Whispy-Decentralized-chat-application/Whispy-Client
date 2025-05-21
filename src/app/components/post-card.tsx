import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiChevronDown, FiChevronUp, FiHeart, FiMessageCircle } from "react-icons/fi";
import { checkLike, getNumberOfLikes, underlikeObject, likeObject } from "../ceramic/likeService";
import { getNumberOfReplies } from "../ceramic/replyService";


interface Post {
  stream_id: string;
  title?: string;
  date: string;
  content: string;
  username: string;
}

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [replyCount, setReplyCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const [initialLiked, initialLikes, initialReplies] = await Promise.all([
        checkLike(post.stream_id),
        getNumberOfLikes(post.stream_id),
        getNumberOfReplies(post.stream_id),
      ]);
      setLiked(!!initialLiked);
      setLikeCount(initialLikes);
      setReplyCount(initialReplies);
    }
    fetchData();
  }, [post.stream_id]);

  const handleLike = async () => {
    if (liked) {
      await underlikeObject(post.stream_id);
      setLiked(false);
      setLikeCount((count) => Math.max(count - 1, 0));
    } else {
      await likeObject(post.stream_id);
      setLiked(true);
      setLikeCount((count) => count + 1);
    }
  };

  const navigateToPost = () => {
    router.push(`/post/${post.stream_id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700">
        <h2
          onClick={navigateToPost}
          className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:underline cursor-pointer"
        >
          {post.title || "Sin título"}
        </h2>
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mt-1">
          <span>
            {new Date(post.date).toLocaleString("es-ES", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <span className="mx-2">•</span>
          <span>{post.username}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-4 pt-2 pb-1 text-base text-gray-900 dark:text-gray-100 transition-all duration-200">
        <div
          className={`${expanded ? "" : "h-40 overflow-hidden"}`}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>

      {/* ACTIONS */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={handleLike}
            className="flex items-center focus:outline-none"
          >
            <FiHeart
              className={liked ? "text-red-500" : "text-transparent"}
              size={20}
            />
            <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
              {likeCount}
            </span>
          </button>

          <button
            onClick={navigateToPost}
            className="flex items-center ml-4 focus:outline-none"
          >
            <FiMessageCircle
              className="text-gray-500 dark:text-gray-400"
              size={20}
            />
            <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
              {replyCount}
            </span>
          </button>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center text-blue-500 hover:text-blue-600"
        >
          {expanded ? <FiChevronUp /> : <FiChevronDown />}
          <span className="ml-1 text-sm">
            {expanded ? "Ver menos" : "Ver más"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
