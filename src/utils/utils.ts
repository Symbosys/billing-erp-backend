import { randomUUID } from "node:crypto";
import type { ZodError } from "zod";

export const zodError = (error: ZodError) => {
  let errors: any = {};
  error.issues.forEach((issue) => {
    const path = issue.path?.[0];
    if (path !== undefined) errors[path] = issue.message;
  });
  return errors;
};


// Function to parse cookies from Cookie header
export const parseCookies = (cookieHeader: string | undefined): { [key: string]: string } => {
  const cookies: { [key: string]: string } = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts[0]?.trim();
    const value = parts.slice(1).join("=").trim();
    if (key) cookies[key] = value;
  });

  return cookies;
};



type DecimalObj = {s: number; e: number; d: number[]};

export function parseToDecimal(
  price: number | DecimalObj | null | undefined,
): number {
  if (!price) return 0;
  if (typeof price === 'number') return price;

  const high = price.d?.[0] ?? 0;
  const low = price.d?.[1] ?? 0;
  return (high + low / 1e7) * (price.s ?? 1);
}


export const getDateRange = (date?: Date) => {
  if (!date) return undefined;
  const start = new Date(date);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};



export function generateOrderNumber() {
  const dateStr = new Date().toISOString().split("T")[0]?.replace(/-/g, "") ?? "00000000";
  const uniquePart = randomUUID().slice(0, 6).toUpperCase();
  return `ORD-${dateStr}-${uniquePart}`;
}


export function extractPartnerId(memberName: string): number {
  const match = memberName.match(/^partner:(\d+)$/);
  if (!match) throw new Error(`Invalid member name format: ${memberName}`);
  return Number(match[1]);
}


export function removeUndefined<T extends object>(obj: T): {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K]
} {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as any;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")     // Replace spaces with -
    .replace(/[^\w-]+/g, "")    // Remove all non-word chars
    .replace(/--+/g, "-");    // Replace multiple - with single -
}
