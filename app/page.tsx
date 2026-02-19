"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome to Smart Bookmark App</h1>
    </main>
  );
}