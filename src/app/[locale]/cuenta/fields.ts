/**
 * Estilos de los campos de la pantalla de acceso.
 *
 * Vivian aca hasta el 05/09, cuando el resto del embudo (filtro corto,
 * formulario de salud, "Como pagar" y el panel de viajero) adopto el mismo
 * lenguaje: se mudaron a `@/components/forms/styles`, que es de donde salen
 * ahora los dos lados. Este archivo queda como reexport para no tocar los
 * cuatro formularios de la carpeta.
 */
export {
  fieldWrap,
  fieldLabel,
  fieldInput,
  fieldInputPassword,
  fieldToggle,
  fieldHint,
  submitButton,
  formError,
} from "@/components/forms/styles";
