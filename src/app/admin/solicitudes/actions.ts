"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export type ApplicationTable = "applications_first_time" | "applications_returning";

const SLUG_BY_TABLE: Record<ApplicationTable, string> = {
  applications_first_time: "primerizo",
  applications_returning: "recurrente",
};

export async function reviewApplication(
  table: ApplicationTable,
  id: string,
  status: Enums<"application_status">
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: application } = await supabase
    .from(table)
    .select("user_id")
    .eq("id", id)
    .single();

  if (application?.user_id === user?.id) {
    throw new Error("No podés revisar tu propia solicitud.");
  }

  const { error } = await supabase
    .from(table)
    .update({
      status,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
  }

  revalidatePath("/admin/solicitudes");
  revalidatePath(`/admin/solicitudes/${SLUG_BY_TABLE[table]}/${id}`);
}
