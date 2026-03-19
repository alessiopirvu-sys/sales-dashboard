"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import { TrendPoint } from "@/lib/types";

type TrendChartCardProps = {
  trend: TrendPoint[];
};

export function TrendChartCard({ trend }: TrendChartCardProps) {
  return (
    <Card className="h-full overflow-hidden rounded-[2.35rem]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-[1.15rem] sm:text-[1.4rem]">Trend</CardTitle>
        <div className="surface-pill rounded-full border border-white/80 px-3 py-1.5 text-xs font-medium text-primary sm:px-4 sm:py-2 sm:text-sm">
          Live
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
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9aa8bf", fontSize: 12 }}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
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
              formatter={(value, key) =>
                key === "revenue"
                  ? [formatCurrency(Number(value)), "Fatturato"]
                  : [formatCompactNumber(Number(value)), "Chiamate"]
              }
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="calls"
              stroke="#a6cbff"
              strokeWidth={3.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#3d7bff"
              strokeWidth={4.5}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
