"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useSubscription(userId?: string) {
  const [status, setStatus] = useState<"free" | "active" | "cancelled">("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      setStatus(data?.status ?? "free");
      setLoading(false);
    };

    fetchStatus();
  }, [userId]);

  return { status, loading, isPremium: status === "active" };
}
