/**
 * PUBLIC_INTERFACE
 * useLocalStorage - sync state with localStorage
 */
import { useEffect, useState } from "react";

export default function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    if (state === undefined || state === null) return localStorage.removeItem(key);
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
