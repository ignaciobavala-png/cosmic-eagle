import type { Faq } from "./faqs";

/**
 * Las preguntas frecuentes de la home. Texto LITERAL de la entrega del 28/09
 * (`docs/entregas/2026-09-28-faqs-home/`), que trae también la versión en
 * inglés (`HOME_FAQS_EN`, al pie).
 *
 * Van fijas en el código y NO en la tabla `faqs`: no son editables (decisión
 * de Ignacio, 28/09), y son otro juego que las de /faqs —aquellas son de
 * logística, éstas presentan el trabajo—. Si algún día pasan al panel, es una
 * ubicación `home` nueva en el enum `faq_placement` (en su propia migración).
 *
 * Los párrafos de cada respuesta van separados por línea en blanco, que es la
 * regla con la que `FaqList` los parte.
 */
export const HOME_FAQS: Faq[] = [
  {
    id: "que-es",
    question: "¿Qué es Cosmic Eagle Journey?",
    answer:
      "Cosmic Eagle Journey crea experiencias inmersivas de transformación personal y evolución consciente.\n\nNuestro trabajo reúne años de experiencia, distintas prácticas y tradiciones, y una exploración profunda de la conciencia humana y del potencial que existe dentro de cada uno de nosotros.",
  },
  {
    id: "que-lo-hace-diferente",
    question: "¿Qué hace diferente a este trabajo?",
    answer:
      "Nuestro enfoque va más allá de una sola práctica o metodología.\n\nTrabajamos con el ser humano como un sistema multidimensional — cuerpo, mente, emociones, energía y alma — creando experiencias diseñadas para que las personas accedan a capas más profundas de sí mismas y avancen en su proceso evolutivo.",
  },
  {
    id: "evolucion-humana",
    question: "¿A qué se refieren con evolución humana?",
    answer:
      "Para nosotros, evolucionar no se trata de convertirse en otra persona. Se trata de ir liberando progresivamente aquello que nos limita y ganar mayor acceso a nuestra propia conciencia, a nuestros recursos internos y a nuestro potencial.\n\nEs un proceso de volvernos más conscientes de quiénes somos, de cómo vivimos y de en qué somos capaces de convertirnos.",
  },
  {
    id: "para-quien-es",
    question: "¿Para quién es este trabajo?",
    answer:
      "Nuestras experiencias son para personas que se sienten listas para explorarse con mayor profundidad, soltar lo que ya no les sirve y expandirse hacia nuevas posibilidades.\n\nNo necesitas experiencia previa, pero la curiosidad, la apertura y la responsabilidad personal son esenciales.",
  },
  {
    id: "para-quien-no-es",
    question: "¿Para quién no es este trabajo?",
    answer:
      "Este trabajo no es para todos.\n\nPuede no ser adecuado para quienes buscan una solución rápida, una experiencia puramente recreativa, o que otra persona les entregue todas las respuestas.\n\nNuestras experiencias requieren apertura, responsabilidad personal y una disposición genuina a involucrarse con el propio proceso. Ciertas condiciones de salud física o mental también pueden hacer que la participación no sea apropiada. Por eso, todas las personas completan un proceso de evaluación antes de sumarse a una experiencia.",
  },
  {
    id: "camino-espiritual",
    question: "¿Necesito tener un camino espiritual previo?",
    answer:
      "No.\n\nLas personas llegan desde contextos, culturas y sistemas de creencias muy distintos. No necesitas creer en nada en particular.\n\nTe invitamos a acercarte a la experiencia con la mente abierta y permitir que sea tu propia vivencia la que informe tu comprensión.",
  },
  {
    id: "es-terapia",
    question: "¿Esto es terapia?",
    answer:
      "No. Cosmic Eagle Journey no sustituye la atención médica, la psicoterapia ni el tratamiento psiquiátrico.\n\nNuestro trabajo se centra en la conciencia, la exploración personal y la evolución humana y, cuando corresponde, puede convivir con otras formas de apoyo profesional.",
  },
  {
    id: "es-seguro",
    question: "¿Es seguro este trabajo?",
    answer:
      "El cuidado, la responsabilidad y el respeto por el proceso individual de cada persona son fundamentales en todo lo que hacemos.\n\nAntes de participar, cada persona pasa por un proceso de preparación y evaluación que nos permite comprender sus circunstancias particulares y determinar si la experiencia es apropiada para ella.",
  },
  {
    id: "que-esperar",
    question: "¿Qué puedo esperar vivir?",
    answer:
      "Cada viaje es distinto.\n\nLas personas pueden encontrarse con dimensiones emocionales, psicológicas, energéticas o espirituales de sí mismas. Más que prometer un resultado determinado, creamos las condiciones para que cada persona explore lo que resulta significativo y relevante para su propio proceso.",
  },
  {
    id: "saber-mas",
    question: "¿Cómo puedo saber más?",
    answer:
      "La mayoría de las personas llega a Cosmic Eagle Journey por recomendación personal o a través de alguien que ya conoce nuestro trabajo.\n\nAlgunos aspectos de lo que hacemos requieren contexto y por eso se comparten dentro de nuestro espacio privado.\n\nSi has sido invitado a explorar más, puedes entrar para conocer más sobre nuestro enfoque, nuestras experiencias, el proceso de preparación y los próximos viajes.",
  },
];

/**
 * La versión en inglés, literal de la misma entrega (viene en el mismo .docx,
 * después de la castellana). Mismos `id` y mismo orden que `HOME_FAQS`.
 */
export const HOME_FAQS_EN: Faq[] = [
  {
    id: "que-es",
    question: "What is Cosmic Eagle Journey?",
    answer:
      "Cosmic Eagle Journey creates immersive experiences for personal transformation and conscious evolution.\n\nOur work brings together years of experience, different practices and traditions, and a deep exploration of human consciousness and the potential that exists within each of us.",
  },
  {
    id: "que-lo-hace-diferente",
    question: "What makes this work different?",
    answer:
      "Our approach goes beyond a single practice or methodology.\n\nWe work with the human being as a multidimensional system — body, mind, emotions, energy and soul — creating experiences designed to help people access deeper layers of themselves and move forward in their evolutionary process.",
  },
  {
    id: "evolucion-humana",
    question: "What do you mean by human evolution?",
    answer:
      "For us, evolution is not about becoming someone else. It is about progressively releasing what limits us and gaining greater access to our own consciousness, inner resources and potential.\n\nIt is a process of becoming more aware of who we are, how we live and what we are capable of becoming.",
  },
  {
    id: "para-quien-es",
    question: "Who is this work for?",
    answer:
      "Our experiences are for people who feel ready to explore themselves more deeply, release what no longer serves them and expand into new possibilities.\n\nYou don't need previous experience, but curiosity, openness and personal responsibility are essential.",
  },
  {
    id: "para-quien-no-es",
    question: "Who is this work not for?",
    answer:
      "This work is not for everyone.\n\nIt may not be appropriate for people looking for a quick fix, a purely recreational experience, or someone else to provide all the answers.\n\nOur experiences require openness, personal responsibility and a genuine willingness to engage with your own process. Certain physical or mental health conditions may also make participation unsuitable. For this reason, everyone completes a screening process before joining an experience.",
  },
  {
    id: "camino-espiritual",
    question: "Do I need to have a spiritual background?",
    answer:
      "No.\n\nPeople arrive from many different backgrounds, cultures and belief systems. You don't need to believe in anything in particular.\n\nWe invite you to approach the experience with an open mind and allow your own experience to inform your understanding.",
  },
  {
    id: "es-terapia",
    question: "Is this therapy?",
    answer:
      "No. Cosmic Eagle Journey is not a substitute for medical care, psychotherapy or psychiatric treatment.\n\nOur work is focused on consciousness, personal exploration and human evolution and, when appropriate, can exist alongside other forms of professional support.",
  },
  {
    id: "es-seguro",
    question: "Is the work safe?",
    answer:
      "Care, responsibility and respect for each person's individual process are fundamental to everything we do.\n\nBefore participating, each person goes through a preparation and screening process so we can understand their individual circumstances and determine whether an experience is appropriate for them.",
  },
  {
    id: "que-esperar",
    question: "What can I expect to experience?",
    answer:
      "Every journey is different.\n\nPeople may encounter emotional, psychological, energetic or spiritual dimensions of themselves. Rather than promising a particular outcome, we create the conditions for each person to explore what is meaningful and relevant to their own process.",
  },
  {
    id: "saber-mas",
    question: "How can I learn more?",
    answer:
      "Most people arrive at Cosmic Eagle Journey through personal referrals or through someone already familiar with our work.\n\nSome aspects of what we do require context and are therefore shared within our private space.\n\nIf you have been invited to explore further, you can enter to discover more about our approach, experiences, preparation process and upcoming journeys.",
  },
];

export function getHomeFaqs(locale: string): Faq[] {
  return locale === "en" ? HOME_FAQS_EN : HOME_FAQS;
}
