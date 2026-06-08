import type { Keyword } from "@/lib/types";
import { ICONS } from "./icons";

export function KeywordRow({ keywords }: { keywords: Keyword[] }) {
  return (
    <div className="r-keywords">
      {keywords.map((kw) => {
        const Icon = ICONS[kw.icon];
        return (
          <span className="r-keyword" key={kw.label}>
            <Icon aria-hidden strokeWidth={1.5} />
            {kw.label}
          </span>
        );
      })}
    </div>
  );
}
