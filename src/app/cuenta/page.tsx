import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { logout } from "./actions";
import { MisSolicitudes } from "./MisSolicitudes";
import { AvatarUpload } from "./AvatarUpload";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; modo?: string }>;
}) {
  const { next, modo } = await searchParams;
  const isSignup = modo === "registro";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let applications: {
    id: string;
    trip_id: string;
    status: string;
    created_at: string;
    type: "primerizo" | "recurrente";
    trip: { title: string; location: string | null; start_date: string; end_date: string } | null;
  }[] = [];

  let profile: { full_name: string | null; avatar_url: string | null } | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = data;

    const [{ data: firstTime }, { data: returning }] = await Promise.all([
      supabase
        .from("my_applications_first_time")
        .select("id, trip_id, status, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("my_applications_returning")
        .select("id, trip_id, status, created_at")
        .order("created_at", { ascending: false }),
    ]);

    const raw = [
      ...(firstTime ?? []).map((a) => ({ ...a, type: "primerizo" as const })),
      ...(returning ?? []).map((a) => ({ ...a, type: "recurrente" as const })),
    ].filter(
      (a): a is typeof a & { id: string; trip_id: string; status: string; created_at: string } =>
        a.id !== null && a.trip_id !== null && a.status !== null && a.created_at !== null
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
      <main className="pt-16 min-h-screen flex items-center justify-center">
        {user ? (
          <div className="px-5 w-full max-w-3xl flex flex-col items-center gap-4 py-12">
            <AvatarUpload
              avatarUrl={profile?.avatar_url ?? null}
              fallbackLabel={(profile?.full_name?.trim()?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            />
            <div className="text-center">
              <h1 className="font-display text-[28px] md:text-[36px] font-medium text-primary">
                {profile?.full_name?.trim() || "Mi Cuenta"}
              </h1>
              <p className="text-on-surface-variant text-sm mt-1">{user.email}</p>
            </div>

            <MisSolicitudes applications={applications} />

            <form action={logout}>
              <button
                type="submit"
                className="mt-2 text-sm text-on-surface-variant hover:text-primary transition-colors underline"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center px-5 flex flex-col items-center gap-6">
            <div>
              <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary mb-2">
                Mi Cuenta
              </h1>
              <p className="text-on-surface-variant max-w-md">
                {isSignup
                  ? "Creá tu cuenta para postularte a un viaje."
                  : "Iniciá sesión para acceder a tu cuenta."}
              </p>
            </div>
            {isSignup ? <SignupForm next={next} /> : <LoginForm next={next} />}
            <a
              href={`/cuenta${isSignup ? "" : "?modo=registro"}${
                next ? `${isSignup ? "?" : "&"}next=${encodeURIComponent(next)}` : ""
              }`}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors underline"
            >
              {isSignup ? "¿Ya tenés cuenta? Iniciá sesión" : "¿No tenés cuenta? Registrate"}
            </a>
          </div>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
