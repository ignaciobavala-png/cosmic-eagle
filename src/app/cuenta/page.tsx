import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { AuthScreen } from "@/components/ui/AuthScreen";
import { getSiteContent } from "@/lib/site-content";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { logout } from "./actions";
import { MisSolicitudes } from "./MisSolicitudes";
import { AvatarUpload } from "./AvatarUpload";

// Avisos que llegan por querystring desde /auth/confirm y desde updatePassword.
const ERROR_MESSAGES: Record<string, string> = {
  "enlace-vencido":
    "El enlace venció o ya se usó. Pedí uno nuevo desde “¿Olvidaste tu contraseña?”.",
  "enlace-invalido": "El enlace no es válido. Probá pidiendo uno nuevo.",
};

const AVISO_MESSAGES: Record<string, string> = {
  "clave-cambiada": "Listo, tu contraseña quedó actualizada.",
};

function Notice({ text, tone }: { text: string; tone: "error" | "ok" }) {
  return (
    <p
      role="alert"
      className={`max-w-sm rounded-lg border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-[#ffb4a8]/40 bg-[#ffb4a8]/10 text-[#ffb4a8]"
          : "border-primary-container/40 bg-primary-container/10 text-primary-container"
      }`}
    >
      {text}
    </p>
  );
}

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    modo?: string;
    vista?: string;
    error?: string;
    aviso?: string;
  }>;
}) {
  const { next, modo, vista, error, aviso } = await searchParams;
  const content = await getSiteContent();
  const isSignup = modo === "registro";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let applications: {
    id: string;
    trip_id: string;
    status: string;
    payment_status: string;
    is_first_time: boolean;
    health_form_submitted: boolean;
    created_at: string;
    trip: { title: string; location: string | null; start_date: string; end_date: string } | null;
  }[] = [];

  let profile: { full_name: string | null; avatar_url: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;

    // El admin no se postula a viajes: su "cuenta" es el panel. Se puede ver
    // igual el perfil de viajero con ?vista=viajero (link en AdminNav), y un
    // ?next= pendiente siempre gana, para no romper un flujo a medias.
    if (data?.is_admin && vista !== "viajero") redirect(next || "/admin");

    // La vista es lo único que el postulante puede leer de sus solicitudes: la
    // tabla base no le devuelve ninguna fila, ni las propias.
    const { data: mine } = await supabase
      .from("my_applications")
      .select(
        "id, trip_id, status, payment_status, is_first_time, health_form_submitted, created_at"
      )
      .order("created_at", { ascending: false });

    // Todas las columnas de una vista son nullable para el tipo generado; acá
    // ninguna lo es de verdad, así que se descartan las filas incompletas.
    const raw = (mine ?? []).flatMap((a) =>
      a.id !== null &&
      a.trip_id !== null &&
      a.status !== null &&
      a.payment_status !== null &&
      a.created_at !== null
        ? [
            {
              id: a.id,
              trip_id: a.trip_id,
              status: a.status,
              payment_status: a.payment_status,
              is_first_time: a.is_first_time ?? false,
              health_form_submitted: a.health_form_submitted ?? false,
              created_at: a.created_at,
            },
          ]
        : []
    );

    const tripIds = [...new Set(raw.map((a) => a.trip_id))];
    const { data: trips } =
      tripIds.length > 0
        ? await supabase
            .from("trips")
            .select("id, title, location, start_date, end_date")
            .in("id", tripIds)
        : { data: [] };

    const tripsById = new Map((trips ?? []).map((t) => [t.id, t]));

    applications = raw
      .map((a) => ({ ...a, trip: tripsById.get(a.trip_id) ?? null }))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  return (
    <>
      <Header />
      <main className="pt-16 lg:pt-21">
        {user ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-5 py-12">
            <AvatarUpload
              avatarUrl={profile?.avatar_url ?? null}
              fallbackLabel={(profile?.full_name?.trim()?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            />
            <div className="text-center">
              <h1 className="font-display text-[28px] md:text-[36px] font-medium text-primary-fixed-dim">
                {profile?.full_name?.trim() || "Mi Cuenta"}
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">{user.email}</p>
            </div>

            {aviso && AVISO_MESSAGES[aviso] && (
              <Notice text={AVISO_MESSAGES[aviso]} tone="ok" />
            )}

            <MisSolicitudes applications={applications} />

            <form action={logout}>
              <button
                type="submit"
                className="mt-2 text-sm text-on-surface-variant hover:text-primary-fixed-dim transition-colors underline"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <AuthScreen
            image={content("cuenta.acceso.image")}
            eyebrow={isSignup ? "Crear cuenta" : "Iniciar sesión"}
            title={isSignup ? "Bienvenido" : "Hola de nuevo"}
            subtitle={
              isSignup
                ? "Creá tu cuenta para postularte a un viaje."
                : "Ingresá tu email y contraseña para continuar tu camino."
            }
            notice={
              error && ERROR_MESSAGES[error] ? (
                <Notice text={ERROR_MESSAGES[error]} tone="error" />
              ) : null
            }
            footer={
              <>
                {isSignup ? "¿Ya tenés cuenta? " : "¿No tenés cuenta? "}
                <a
                  href={`/cuenta${isSignup ? "" : "?modo=registro"}${
                    next
                      ? `${isSignup ? "?" : "&"}next=${encodeURIComponent(next)}`
                      : ""
                  }`}
                  className="text-primary-container underline"
                >
                  {isSignup ? "Iniciá sesión" : "Registrate"}
                </a>
              </>
            }
          >
            {isSignup ? <SignupForm next={next} /> : <LoginForm next={next} />}
          </AuthScreen>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
