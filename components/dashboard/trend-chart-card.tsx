"use client";

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendPoint } from "@/lib/types";

type ChannelKey = "revenueFr" | "revenueReferenze" | "revenueOffice";

const channels: { key: ChannelKey; label: string; color: string; activeClass: string }[] = [
  { key: "revenueFr", label: "FR", color: "#3B5BFF", activeClass: "bg-[#3B5BFF] text-white" },
  { key: "revenueReferenze", label: "Referenze", color: "#F59E0B", activeClass: "bg-[#F59E0B] text-white" },
  { key: "revenueOffice", label: "Ufficio", color: "#7C3AED", activeClass: "bg-[#7C3AED] text-white" }
];

type TrendChartCardProps = {
  trend: TrendPoint[];
};

export function TrendChartCard({ trend }: TrendChartCardProps) {
  const [activeChannels, setActiveChannels] = useState<Set<ChannelKey>>(
    new Set(["revenueFr", "revenueReferenze", "revenueOffice"])
  );

  const toggleChannel = (key: ChannelKey) => {
    setActiveChannels((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="text-[1.15rem] sm:text-[1.3rem]">Trend fatturato</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Andamento per canale nel periodo selezionato</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {channels.map((ch) => {
            const isActive = activeChannels.has(ch.key);
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => toggleChannel(ch.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                  isActive
                    ? ch.activeClass
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="h-[280px] p-3 pt-0 sm:h-[320px] sm:p-4 sm:pt-0 md:h-[364px] md:p-6 md:pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <XAxis
              dataKey="label"
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
              tick={{ fill: "#7c8aa5", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9aa8bf", fontSize: 12 }}
              tickFormatter={(value) => `€${Math.round(Number(value) / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px -16px rgba(15,23,42,0.16)"
              }}
              formatter={(value: number, key: string) => {
                const label =
                  key === "revenueFr"
                    ? "Fatturato FR"
                    : key === "revenueReferenze"
                      ? "Fatturato Referenze"
                      : key === "revenueOffice"
                        ? "Fatturato Ufficio"
                        : key;
                return [formatCurrency(value), label];
              }}
            />
            {activeChannels.has("revenueFr") && (
              <Line
                type="monotone"
                dataKey="revenueFr"
                stroke="#3B5BFF"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
            {activeChannels.has("revenueReferenze") && (
              <Line
                type="monotone"
                dataKey="revenueReferenze"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
            {activeChannels.has("revenueOffice") && (
              <Line
                type="monotone"
                dataKey="revenueOffice"
                stroke="#7C3AED"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
