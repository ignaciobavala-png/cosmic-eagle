/**
 * Países para el selector de teléfono del filtro corto (pedido de Sofía,
 * reunión del 20/09: bandera + código de país, y el campo pasa a obligatorio).
 *
 * Se comparte entre el cliente (el `<select>` de `PhoneInput`) y el server
 * action que arma el `phone` final: los dos necesitan el mismo mapa ISO2 →
 * código de discado, así que vive en `lib` y no adentro de `fields.tsx`.
 *
 * La bandera sale del código ISO2 con los caracteres "regional indicator"
 * de Unicode (`countryFlag`) en vez de copiar emojis a mano: un país que falte
 * se agrega con una línea y no se puede escribir mal la bandera.
 *
 * Lista acotada a donde de hecho llegan viajeros de Cosmic Eagle
 * (Latinoamérica completa + los destinos con más consultas de afuera), no las
 * ~200 del mundo: agregar un país nuevo es una línea en `PHONE_COUNTRIES`.
 */
export type PhoneCountry = {
  iso2: string;
  name: string;
  dial: string;
};

export function countryFlag(iso2: string): string {
  return [...iso2.toUpperCase()]
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso2: "AR", name: "Argentina", dial: "54" },
  { iso2: "CL", name: "Chile", dial: "56" },
  { iso2: "UY", name: "Uruguay", dial: "598" },
  { iso2: "PY", name: "Paraguay", dial: "595" },
  { iso2: "BO", name: "Bolivia", dial: "591" },
  { iso2: "BR", name: "Brasil", dial: "55" },
  { iso2: "PE", name: "Perú", dial: "51" },
  { iso2: "EC", name: "Ecuador", dial: "593" },
  { iso2: "CO", name: "Colombia", dial: "57" },
  { iso2: "VE", name: "Venezuela", dial: "58" },
  { iso2: "PA", name: "Panamá", dial: "507" },
  { iso2: "CR", name: "Costa Rica", dial: "506" },
  { iso2: "MX", name: "México", dial: "52" },
  { iso2: "GT", name: "Guatemala", dial: "502" },
  { iso2: "US", name: "Estados Unidos", dial: "1" },
  { iso2: "CA", name: "Canadá", dial: "1" },
  { iso2: "ES", name: "España", dial: "34" },
  { iso2: "PT", name: "Portugal", dial: "351" },
  { iso2: "FR", name: "Francia", dial: "33" },
  { iso2: "IT", name: "Italia", dial: "39" },
  { iso2: "DE", name: "Alemania", dial: "49" },
  { iso2: "GB", name: "Reino Unido", dial: "44" },
  { iso2: "AU", name: "Australia", dial: "61" },
];

export const DEFAULT_PHONE_COUNTRY = "AR";

export function dialCodeFor(iso2: string): string | null {
  return PHONE_COUNTRIES.find((c) => c.iso2 === iso2)?.dial ?? null;
}
