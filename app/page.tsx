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

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error deleting bookmark");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-lg">Bookmarks</span>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Add bookmark card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Add New Bookmark</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Title"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="URL — https://..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              onClick={handleAddBookmark}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium rounded-xl transition-all cursor-pointer"
            >
              Add Bookmark
            </button>
          </div>
        </div>

        {/* Bookmarks list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Saved</h2>
            <span className="text-xs bg-indigo-100 text-indigo-600 font-medium px-2.5 py-1 rounded-full">
              {bookmarks.length}
            </span>
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">🔖</div>
              <p className="text-sm">No bookmarks yet. Add one above!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:shadow-md hover:border-indigo-200 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{bookmark.title}</p>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-500 hover:text-indigo-700 truncate block transition-colors"
                    >
                      {bookmark.url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="shrink-0 text-slate-300 hover:text-red-500 transition-colors cursor-pointer text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}