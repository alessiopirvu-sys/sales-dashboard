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
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[1.1rem] sm:text-[1.25rem]">Top performers</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Trophy className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-auto md:h-[364px]">
        {ranking.length > 0 ? (
          <div className="subtle-scrollbar flex flex-col gap-2.5 md:h-full md:overflow-y-auto md:pr-0.5">
            {ranking.map((row, index) => {
              const isTopThree = index < 3;

              return (
                <div
                  key={row.seller}
                  className="grid min-h-[78px] grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 sm:min-h-[80px] sm:px-3.5"
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isTopThree ? badgeTones[index] : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isTopThree ? badges[index] : index + 1}
                  </div>

                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-900 sm:h-10 sm:w-10">
                      {initials(row.seller)}
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="truncate whitespace-nowrap text-[13px] font-semibold leading-5 text-slate-900 sm:text-sm">
                        {row.seller}
                      </p>
                      <p className="truncate whitespace-nowrap text-[11px] leading-4 text-slate-500">
                        {metric.tableLabel}
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 shrink-0 text-right">
                    <p className="whitespace-nowrap text-[13px] font-semibold leading-5 text-slate-900 sm:text-sm">
                      {metric.format(metric.getValue(row))}
                    </p>
                    {isTopThree ? (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] leading-4 text-slate-600">
                        <Medal className="h-3 w-3 shrink-0 text-primary" />
                        {index + 1}° posto
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-nowrap text-[11px] leading-4 text-slate-500">
                        {index + 1}° posto
                      </p>
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
