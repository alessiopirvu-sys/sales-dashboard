import { ArrowUpRight, PhoneCall, Presentation, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

type ConversionSummaryCardProps = {
  calls: number;
  appointmentsBooked: number;
  averageTicket: number;
  closingRate: number;
};

export function ConversionSummaryCard({
  calls,
  appointmentsBooked,
  averageTicket,
  closingRate
}: ConversionSummaryCardProps) {
  return (
    <Card className="flex h-full flex-col rounded-[2.2rem]">
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-[1.2rem]">Summary</CardTitle>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between space-y-3">
        <div className="rounded-[1.5rem] bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <PhoneCall className="h-4 w-4 text-primary" />
            Chiamate
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">{calls}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Presentation className="h-4 w-4 text-primary" />
            App presi
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">{appointmentsBooked}</p>
        </div>
        <div className="rounded-[1.5rem] bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wallet className="h-4 w-4 text-primary" />
            Ticket medio
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(averageTicket)}</p>
        </div>
        <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#eff5ff,#f8fbff)] p-4">
          <p className="text-sm text-slate-500">Closing rate</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            {formatPercentage(closingRate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
