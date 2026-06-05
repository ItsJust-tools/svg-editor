/**
 * Merges class names, filtering out falsy values.
 * Similar to clsx — useful for conditionally applying CSS classes.
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
