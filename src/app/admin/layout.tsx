import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/cuenta");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/cuenta");

  // Contador de la campanita. Va en el layout para que se vea desde cualquier
  // seccion del panel; `head: true` trae solo el count, no las filas.
  const { count: unread } = await supabase
    .from("admin_notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <div className="min-h-screen bg-void-black">
      <AdminNav unread={unread ?? 0} />
      <main className="px-5 md:px-8 max-w-6xl mx-auto py-10">{children}</main>
    </div>
  );
}
