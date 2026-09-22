import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`}>
      <span className="brand__icon">
        <Image src="/assets/gpv-icon.png" alt="Símbolo GPV" width={50} height={50} priority />
      </span>
      {!compact && (
        <span className="brand__text">
          <strong>RANKING BR</strong>
          <small>GPV ASSOCIADOS</small>
        </span>
      )}
    </div>
  );
}
