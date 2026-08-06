import { redirect } from "next/navigation";

/**
 * El listado unico de "Viajes" se partio en /admin/retiros y /admin/ceremonias.
 * Esta ruta queda solo para que los enlaces viejos no mueran.
 */
export default function AdminViajesPage() {
  redirect("/admin/retiros");
}
