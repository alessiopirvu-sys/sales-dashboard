import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthStatusCardProps = {
  title: string;
  description: string;
};

export function AuthStatusCard({ title, description }: AuthStatusCardProps) {
  return (
    <Card className="w-full max-w-md rounded-[2rem] border-slate-200">
      <CardHeader>
        <CardTitle className="font-display text-2xl font-semibold tracking-[-0.04em]">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
