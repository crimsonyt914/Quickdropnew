import crypto from "node:crypto";
import { CODE_ALPHABET, CODE_LENGTH } from "@quickdrop/shared";
import { db } from "../db";

/**
 * Generates a cryptographically random share code and guarantees it is not
 * already in use. Codes are never sequential and never expose any
 * internal id — they're independent random tokens.
 */
export function generateUniqueCode(): string {
  const exists = db.prepare("SELECT 1 FROM drops WHERE code = ?");

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = randomCode();
    if (!exists.get(code)) return code;
  }

  throw new Error("Could not generate a unique code — code space exhausted");
}

function randomCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}
