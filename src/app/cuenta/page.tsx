import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";
import { logout } from "./actions";

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Header />
      <main className="pt-16 min-h-screen flex items-center justify-center">
        {user ? (
          <div className="text-center px-5 flex flex-col items-center gap-4">
            <h1 className="font-display text-[32px] md:text-[40px] font-medium text-primary mb-2">
              Mi Cuenta
            </h1>
            <p className="text-on-surface-variant max-w-md">
              Sesión iniciada como {user.email}. El panel de usuario todavía
              está en construcción.
            </p>
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
                Iniciá sesión para acceder a tu cuenta.
              </p>
            </div>
            <LoginForm next={next} />
          </div>
        )}
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
