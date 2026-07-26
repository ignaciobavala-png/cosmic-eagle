import { updateSession } from "@/lib/supabase/proxy";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Excluir auth/ para no pisar cookies de sesion (ej. code_verifier de PKCE).
    "/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
