import type { Location } from "@/types";
import EmptyState from "@/components/common/EmptyState";

interface LocationMapProps {
  location?: Location;
  className?: string;
}

const TARGET_ZOOM = 19;

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildEmbedUrl(location: Location): string | null {
  const latitude = toNumber(location.latitude);
  const longitude = toNumber(location.longitude);
  if (latitude === null || longitude === null) return null;

  return `https://maps.google.com/maps?q=${latitude},${longitude}&z=${TARGET_ZOOM}&output=embed`;
}

export default function LocationMap({ location, className }: LocationMapProps) {
  if (!location) {
    return <EmptyState title="Sin ubicación" description="Esta competición no tiene una ubicación registrada." />;
  }

  const address = [location.address, location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");

  const embedUrl = buildEmbedUrl(location);

  if (!embedUrl) {
    return <EmptyState title="Mapa no disponible" description="No hay coordenadas para mostrar el mapa de esta competición." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <iframe
        title={`Mapa de ${location.name}`}
        src={embedUrl}
        className={`h-72 w-full border-0 ${className ?? ""}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      {address && (
        <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">{address}</p>
      )}
    </div>
  );
}