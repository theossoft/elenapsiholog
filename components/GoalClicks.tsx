"use client";

import { useEffect } from "react";
import { trackGoal } from "@/lib/track";

export function GoalClicks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest("[data-goal]");
      if (!target) return;
      const goal = target.getAttribute("data-goal");
      if (goal) trackGoal(goal);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
