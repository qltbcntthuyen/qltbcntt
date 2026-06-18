import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function runTransitionAction(
  startTransition: (callback: () => void) => void,
  task: () => Promise<void>
) {
  startTransition(() => {
    void task()
  })
}
