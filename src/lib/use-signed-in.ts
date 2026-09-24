"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Si hay sesión iniciada, para gatear en el cliente accesos que no dependen de
 * RLS (el desplegable de Experiencias/Contenidos del navbar, el CTA "Explorar
 * experiencias" de la home, el link de Privacidad del footer — pedido de
 * Sofía, 24/09). `null` mientras no se sabe todavía: los llamadores tratan ese
 * estado como "no gatear" para no mostrarle un candado a alguien que sí tiene
 * sesión mientras carga.
 */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session?.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(Boolean(session?.user))
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return signedIn;
}
