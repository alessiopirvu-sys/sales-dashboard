import { CalendarClock, CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercentage } from "@/lib/formatters";

type ProgressCardProps = {
  showUpRate: number;
  closingRate: number;
  appointmentsDone: number;
  dealsClosed: number;
};

export function ProgressCard({
  showUpRate,
  closingRate,
  appointmentsDone,
  dealsClosed
}: ProgressCardProps) {
  return (
    <Card className="rounded-[2.2rem]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[1.1rem] sm:text-[1.28rem]">Team progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="space-y-3 rounded-[1.7rem] bg-slate-50/90 p-4 sm:p-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              Show-up
            </span>
            <span className="font-semibold text-slate-900">{formatPercentage(showUpRate)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(showUpRate, 100)}%` }} />
          </div>
        </div>

        <div className="space-y-3 rounded-[1.7rem] bg-[linear-gradient(180deg,#eef5ff,#f8fbff)] p-4 sm:p-5">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Closing su svolti
            </span>
            <span className="font-semibold text-slate-900">{formatPercentage(closingRate)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#8ab5ff,#3875f6)]"
              style={{ width: `${Math.min(closingRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] bg-slate-50 px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Svolti</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{appointmentsDone}</p>
          </div>
          <div className="rounded-[1.5rem] bg-slate-50 px-3 py-3 sm:px-4 sm:py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Chiusi</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{dealsClosed}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
