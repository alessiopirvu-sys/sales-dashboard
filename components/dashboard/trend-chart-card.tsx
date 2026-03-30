"use client";

import { useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import { TrendPoint } from "@/lib/types";

type ChannelKey = "revenueFr" | "revenueReferenze" | "revenueOffice";

const channels: { key: ChannelKey; label: string; color: string; activeClass: string }[] = [
  { key: "revenueFr", label: "FR", color: "#3d7bff", activeClass: "bg-[#3d7bff] text-white" },
  { key: "revenueReferenze", label: "Referenze", color: "#e6b800", activeClass: "bg-[#e6b800] text-black" },
  { key: "revenueOffice", label: "Ufficio", color: "#6C5CE7", activeClass: "bg-[#6C5CE7] text-white" }
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
    <Card className="h-full overflow-hidden rounded-[2.35rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-[1.15rem] sm:text-[1.4rem]">Trend fatturato</CardTitle>
        <div className="flex items-center gap-2">
          {channels.map((ch) => {
            const isActive = activeChannels.has(ch.key);
            return (
              <button
                key={ch.key}
                type="button"
                onClick={() => toggleChannel(ch.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:px-4 sm:py-2 sm:text-sm ${
                  isActive
                    ? ch.activeClass
                    : "border border-white/80 bg-white/75 text-slate-500 hover:bg-white hover:text-slate-700"
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="relative h-[280px] p-3 pt-0 sm:h-[320px] sm:p-4 sm:pt-0 md:h-[364px] md:p-6 md:pt-0">
        <div className="grid-fade pointer-events-none absolute inset-6 rounded-[1.8rem] opacity-30" />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend}>
            <XAxis
              dataKey="label"
              axisLine={false}
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
                borderRadius: "22px",
                border: "1px solid #edf2fb",
                boxShadow: "0 24px 60px -28px rgba(15,23,42,0.16)"
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
                stroke="#3d7bff"
                strokeWidth={4}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
            {activeChannels.has("revenueReferenze") && (
              <Line
                type="monotone"
                dataKey="revenueReferenze"
                stroke="#e6b800"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5 }}
              />
            )}
            {activeChannels.has("revenueOffice") && (
              <Line
                type="monotone"
                dataKey="revenueOffice"
                stroke="#6C5CE7"
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
