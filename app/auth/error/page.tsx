import { AuthStatusCard } from "@/components/auth/AuthStatusCard";
import { getAuthErrorContent } from "@/lib/auth/navigation";

export default function AuthErrorPage({
  searchParams
}: {
  searchParams: {
    code?: string;
  };
}) {
  const content = getAuthErrorContent(searchParams.code);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7fa] px-4 py-10">
      <AuthStatusCard title={content.title} description={content.description} />
    </main>
  );
}
