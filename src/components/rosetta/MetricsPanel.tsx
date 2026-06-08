import type { Metric } from "@/lib/types";

export function MetricsPanel({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="r-metrics">
      {metrics.map((m) => (
        <div className="r-metric" key={m.label} title={m.source}>
          <div className="v">{m.value}</div>
          <div className="l">{m.label}</div>
        </div>
      ))}
    </div>
  );
}
