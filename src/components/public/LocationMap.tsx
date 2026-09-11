import type { Location } from "@/types";
import EmptyState from "@/components/common/EmptyState";

interface LocationMapProps {
  location?: Location;
  className?: string;
}

function buildEmbedUrl(location: Location): string {
  const zoom = 14;
  const markerParams = `mlat=${location.latitude}&mlon=${location.longitude}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    `${Number(location.longitude) - 0.02},${Number(location.latitude) - 0.0125},${Number(location.longitude) + 0.02},${Number(location.latitude) + 0.0125}`,
  )}&layer=mapnik&${markerParams}&zoom=${zoom}`;
}

export default function LocationMap({ location, className }: LocationMapProps) {
  const hasCoords =
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number";

  if (!location) {
    return <EmptyState title="Sin ubicación" description="Esta competición no tiene una ubicación registrada." />;
  }

  const address = [location.address, location.city, location.state, location.country]
    .filter(Boolean)
    .join(", ");

  if (!hasCoords) {
    return <EmptyState title="Mapa no disponible" description="No hay coordenadas para mostrar el mapa de esta competición." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <iframe
        title={`Mapa de ${location.name}`}
        src={buildEmbedUrl(location)}
        className={`h-72 w-full border-0 ${className ?? ""}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {address && (
        <p className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">{address}</p>
      )}
    </div>
  );
}