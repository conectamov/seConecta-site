import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "lg" | "icon";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  return <button
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/35 disabled:pointer-events-none disabled:opacity-50",
      variant === "default" && "bg-[#079272] text-white shadow-[0_8px_24px_rgba(7,146,114,.18)] hover:-translate-y-0.5 hover:bg-[#067a60]",
      variant === "outline" && "border border-[#dfe5e1] bg-white text-[#1c372c] hover:-translate-y-0.5 hover:border-[#079272]/30 hover:bg-[#f4faf7]",
      variant === "ghost" && "text-[#52615a] hover:bg-[#edf5f1]",
      size === "default" && "h-11 px-5 text-sm",
      size === "lg" && "h-13 px-6 text-sm",
      size === "icon" && "size-11 p-0",
      className,
    )}
    {...props}
  />;
}
