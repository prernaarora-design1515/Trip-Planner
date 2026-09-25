import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "coral" | "outline" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark disabled:bg-primary/40",
  coral: "bg-coral text-white hover:bg-coral-dark active:bg-coral-dark disabled:bg-coral/40",
  outline: "border-2 border-primary text-primary hover:bg-primary-light disabled:opacity-40",
  ghost: "text-primary hover:bg-primary-light disabled:opacity-40",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`tap-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
