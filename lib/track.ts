export function trackGoal(name: string) {
  const id = process.env.NEXT_PUBLIC_METRIKA_ID;
  if (!id || typeof window === "undefined") return;
  const ym = window.ym;
  if (typeof ym === "function") {
    ym(Number(id), "reachGoal", name);
  }
}

declare global {
  interface Window {
    ym?: (id: number, method: string, goal?: string) => void;
  }
}
