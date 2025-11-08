// src/common/components/lib.ts
import clsx from "clsx";

export function cn(...classes: (string | undefined | false | null)[]) {
  return clsx(...classes);
}
