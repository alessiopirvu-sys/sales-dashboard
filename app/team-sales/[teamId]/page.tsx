import { redirect } from "next/navigation";

export default function TeamSalesTeamRoute({ params }: { params: { teamId: string } }) {
  redirect(`/team-sales/${params.teamId}/dashboard`);
}
