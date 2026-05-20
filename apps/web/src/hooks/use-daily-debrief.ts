"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "grove_last_active";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyDebrief() {
  const [isNewDay, setIsNewDay] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const today = todayISO();
    const last = window.localStorage.getItem(STORAGE_KEY);
    setIsNewDay(last !== today);
    setReady(true);
  }, []);

  const markVisited = useCallback(() => {
    window.localStorage.setItem(STORAGE_KEY, todayISO());
    setIsNewDay(false);
  }, []);

  return { isNewDay, ready, markVisited };
}
