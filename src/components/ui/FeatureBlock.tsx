import Image from "next/image";

/**
 * P3 — Par asimetrico texto/imagen. La imagen va recortada (ovalo o rounded) a
 * un lado y el bloque de texto al otro, alternando el lado en cada aparicion.
 * Es la primitiva con la que se compone /nosotros y con la que se va a componer
 * /preparacion (ver docs/RECORRIDO.md).
 */
export function FeatureBlock({
  image,
  imageAlt,
  imageSide = "left",
  shape = "rounded",
  children,
  id,
}: {
  image: string;
  imageAlt: string;
  imageSide?: "left" | "right";
  shape?: "oval" | "rounded";
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="mx-auto w-full max-w-narrative px-margin-mobile md:px-margin-desktop py-16 md:py-24"
    >
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <div
          className={`relative aspect-[3/4] w-full max-w-md justify-self-center md:max-w-none ${
            imageSide === "right" ? "md:order-2" : ""
          } ${shape === "oval" ? "rounded-[48%/42%]" : "rounded-2xl"} overflow-hidden`}
        >
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
          {/* Tinte azul, para que la foto pertenezca al fondo cosmico */}
          <div className="absolute inset-0 bg-[#05102a]/20" />
        </div>

        <div className={imageSide === "right" ? "md:order-1" : ""}>
          {children}
        </div>
      </div>
    </section>
  );
}
