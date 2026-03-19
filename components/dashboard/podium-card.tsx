import { Medal, Trophy } from "lucide-react";

import {
  getRankingMetricConfig,
  RankingMetricKey
} from "@/components/dashboard/ranking-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingRow } from "@/lib/types";

const badges = ["🥇", "🥈", "🥉"];
const badgeTones = [
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-slate-100 text-slate-700 border-slate-200",
  "bg-orange-50 text-orange-700 border-orange-200"
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

type PodiumCardProps = {
  ranking: RankingRow[];
  activeMetric: RankingMetricKey;
};

export function PodiumCard({ ranking, activeMetric }: PodiumCardProps) {
  const metric = getRankingMetricConfig(activeMetric);

  return (
    <Card className="h-full rounded-[2.2rem] border border-white/85 bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[1.1rem] sm:text-[1.25rem]">Top performers</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Trophy className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-auto md:h-[364px]">
        {ranking.length > 0 ? (
          <div className="subtle-scrollbar flex flex-col gap-3 md:h-full md:overflow-y-auto md:pr-1">
            {ranking.map((row, index) => {
              const isTopThree = index < 3;

              return (
                <div
                  key={row.seller}
                  className="flex items-center justify-between rounded-[1.4rem] border border-slate-100 bg-white px-3.5 py-3 shadow-[0_18px_34px_-32px_rgba(46,87,173,0.28)] sm:rounded-[1.55rem] sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isTopThree ? badgeTones[index] : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isTopThree ? badges[index] : index + 1}
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#dceaff,#ffffff)] text-sm font-semibold text-primary">
                      {initials(row.seller)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.seller}</p>
                      <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{metric.tableLabel}</p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {metric.format(metric.getValue(row))}
                    </p>
                    {isTopThree ? (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                        <Medal className="h-3 w-3 text-primary" />
                        {index + 1}° posto
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">{metric.tableLabel}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1.6rem] border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
            Nessun venditore disponibile nel range selezionato.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
