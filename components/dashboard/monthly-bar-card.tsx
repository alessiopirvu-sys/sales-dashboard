"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/formatters";
import { TrendPoint } from "@/lib/types";

type MonthlyBarCardProps = {
  trend: TrendPoint[];
};

export function MonthlyBarCard({ trend }: MonthlyBarCardProps) {
  const data = trend.slice(-6);

  return (
    <Card className="rounded-[2.2rem]">
      <CardHeader className="pb-4">
        <CardTitle className="text-[1.25rem]">Monthly</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "20px",
                border: "1px solid #edf2fb",
                boxShadow: "0 20px 50px -28px rgba(15,23,42,0.18)"
              }}
            />
            <Bar dataKey="calls" fill="#cfe2ff" radius={[14, 14, 14, 14]} />
            <Bar dataKey="revenue" fill="#4d84ff" radius={[14, 14, 14, 14]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
