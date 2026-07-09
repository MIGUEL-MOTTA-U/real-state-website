import { User } from "lucide-react";
import { initialsOf } from "../services/profile";

interface AgentAvatarProps {
  /** URL real de la foto (user.avatar_url); sin ella se muestran iniciales. */
  src?: string;
  name: string;
  /** Dimensiones y forma (ej. "w-8 h-8 rounded-full"). */
  className?: string;
  /** Tamaño tipográfico de las iniciales. */
  textClass?: string;
}

/**
 * Foto del agente obtenida del backend. Sin foto ni nombre no se usa ninguna
 * imagen de relleno: se muestran las iniciales (o un ícono) sobre el dorado
 * de la marca.
 */
export function AgentAvatar({ src, name, className = "", textClass = "text-sm" }: AgentAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Agente"}
        loading="lazy"
        decoding="async"
        className={`object-cover ${className}`}
      />
    );
  }
  const initials = initialsOf(name);
  return (
    <div
      aria-label={name || "Agente"}
      className={`bg-[#C9A84C] text-[#0B1F3A] flex items-center justify-center font-bold ${textClass} ${className}`}
    >
      {initials || <User size={14} />}
    </div>
  );
}
