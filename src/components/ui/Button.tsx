import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-2xl border-2 font-extrabold uppercase tracking-wide " +
  "transition-[transform,box-shadow,background-color,filter] duration-100 " +
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:translate-y-0 disabled:hover:brightness-100";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-on-primary shadow-[0_4px_0_var(--primary-shadow)] hover:brightness-110 active:translate-y-1 active:shadow-none",
  secondary:
    "border-border bg-card text-foreground shadow-[0_4px_0_var(--secondary-shadow)] hover:bg-background active:translate-y-1 active:shadow-none",
  ghost:
    "border-transparent bg-transparent text-muted hover:bg-border/50 active:bg-border",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-4 text-sm",
  md: "min-h-12 px-6 text-base",
  lg: "min-h-14 px-8 text-lg",
};

type StyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: StyleProps & { className?: string }) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & StyleProps;

/** A real <button>. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}

export type ButtonLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  StyleProps & { href: string };

/** A real <a> (via next/link) that looks like a Button, for navigation. */
export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  href,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
