import type { Faq } from "./faqs";

/**
 * Las preguntas frecuentes de la home. Texto LITERAL de la entrega del 28/09
 * (`docs/entregas/2026-09-28-faqs-home/`), que trae también la versión en
 * inglés para cuando llegue i18n.
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
