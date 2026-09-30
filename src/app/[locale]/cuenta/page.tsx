import { redirect } from "@/i18n/redirect";
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
import { funnelSurface } from "@/components/forms/styles";
import { getTranslations, setRequestLocale } from "next-intl/server";

// Avisos que llegan por querystring desde /auth/confirm y desde updatePassword.
// Guardan la clave del mensaje, no el texto: el idioma lo pone `t`.
const ERROR_KEYS: Record<string, string> = {
  "enlace-vencido": "errors.expired",
  "enlace-invalido": "errors.invalid",
};

const AVISO_KEYS: Record<string, string> = {
  "clave-cambiada": "errors.passwordChanged",
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
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    next?: string;
    modo?: string;
    vista?: string;
    error?: string;
    aviso?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Cuenta");
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
    amount_paid: number;
    is_first_time: boolean;
    health_form_submitted: boolean;
    consent_submitted: boolean;
    created_at: string;
    trip: {
      title: string;
      location: string | null;
      start_date: string;
      end_date: string;
      price: number;
      deposit_amount: number | null;
    } | null;
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
    if (data?.is_admin && vista !== "viajero") return await redirect(next || "/admin");

    // La vista es lo único que el postulante puede leer de sus solicitudes: la
    // tabla base no le devuelve ninguna fila, ni las propias.
    const { data: mine } = await supabase
      .from("my_applications")
      .select(
        "id, trip_id, status, payment_status, amount_paid, is_first_time, health_form_submitted, consent_submitted, created_at"
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
              amount_paid: a.amount_paid ?? 0,
              is_first_time: a.is_first_time ?? false,
              health_form_submitted: a.health_form_submitted ?? false,
              consent_submitted: a.consent_submitted ?? false,
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
            .select("id, title, location, start_date, end_date, price, deposit_amount")
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
      {/* Con sesión la página pinta el azul del embudo; sin sesión el fondo lo
          pone `AuthScreen`, que trae su propio degradé. */}
      <main className={`pt-[var(--navbar-h)] ${user ? funnelSurface : ""}`}>
        {user ? (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-5 py-16">
            <AvatarUpload
              avatarUrl={profile?.avatar_url ?? null}
              fallbackLabel={(profile?.full_name?.trim()?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            />
            <div className="text-center">
              <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.25rem)] font-bold text-white">
                {profile?.full_name?.trim() || t("myAccount")}
              </h1>
              <p className="mt-1 text-sm text-white/65">{user.email}</p>
            </div>

            {aviso && AVISO_KEYS[aviso] && (
              <Notice text={t(AVISO_KEYS[aviso])} tone="ok" />
            )}

            <MisSolicitudes
              applications={applications}
              locale={locale === "en" ? "en" : "es"}
            />

            <form action={logout}>
              <button
                type="submit"
                className="mt-2 text-sm text-white/60 underline transition-colors hover:text-primary-container"
              >
                {t("logout")}
              </button>
            </form>
          </div>
        ) : (
          <AuthScreen
            image={content("cuenta.acceso.image")}
            // Sin rotulo arriba del titulo (pedido de Julia del 08/09) y sin
            // subtitulo (pedido de la organizacion, 25/09: duplicaba la
            // accion). Las otras dos pantallas de acceso (recuperar y
            // nueva-clave) conservan el suyo porque ahi es instruccion, no
            // una etiqueta.
            title={isSignup ? t("titleSignup") : t("titleLogin")}
            notice={
              error && ERROR_KEYS[error] ? (
                <Notice text={t(ERROR_KEYS[error])} tone="error" />
              ) : null
            }
            footer={t.rich(isSignup ? "footer.haveAccount" : "footer.noAccount", {
              link: (chunks) => (
                <a
                  href={`/cuenta${isSignup ? "" : "?modo=registro"}${
                    next
                      ? `${isSignup ? "?" : "&"}next=${encodeURIComponent(next)}`
                      : ""
                  }`}
                  className="text-primary-container underline"
                >
                  {chunks}
                </a>
              ),
            })}
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
