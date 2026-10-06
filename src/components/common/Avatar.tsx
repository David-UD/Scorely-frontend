import { useEffect, useState } from "react";
import { resolveMediaUrl } from "@/utils/media";
import { initials } from "@/utils/initials";

type AvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
};

export default function Avatar({ src, name, className = "size-9" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveMediaUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 ${className}`}
    >
      {resolved && !failed ? (
        <img
          src={resolved}
          alt={`Foto de ${name}`}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold text-gray-500">
          {initials(name) || "—"}
        </span>
      )}
    </div>
  );
}