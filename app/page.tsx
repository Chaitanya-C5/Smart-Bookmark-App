"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      } else {
        setLoading(false);
        
        const { data: bookmarksData, error } = await supabase
          .from("bookmarks")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && bookmarksData) {
          setBookmarks(bookmarksData);
        }
      }
    };

    checkUser();
  }, [router]);

  useEffect(() => {
    const setupRealtime = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) return;

      const channel = supabase
        .channel("bookmarks-channel")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setBookmarks((prev) => [payload.new, ...prev]);
            }

            if (payload.eventType === "DELETE") {
              setBookmarks((prev) =>
                prev.filter((b) => b.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtime();
  }, []);

  const handleAddBookmark = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;

    if (!user) return;

    if (!title || !url) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    if (error) {
      console.error(error);
      alert("Error adding bookmark");
    } else {
      setTitle("");
      setUrl("");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">Smart Bookmark App</h1>

      <input
        type="text"
        placeholder="Title"
        className="border p-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        type="text"
        placeholder="URL"
        className="border p-2 rounded"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button
        onClick={handleAddBookmark}
        className="px-6 py-2 bg-black text-white rounded"
      >
        Add Bookmark
      </button>

      <div className="mt-6 w-full max-w-md">
        {bookmarks.length === 0 ? (
          <p className="text-gray-500">No bookmarks yet</p>
        ) : (
          bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="border p-3 rounded mb-2 flex justify-between"
            >
              <div>
                <p className="font-semibold">{bookmark.title}</p>
                <a
                  href={bookmark.url}
                  target="_blank"
                  className="text-blue-500 text-sm"
                >
                  {bookmark.url}
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}