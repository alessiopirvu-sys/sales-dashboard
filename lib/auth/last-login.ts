import { AppError } from "@/lib/auth/errors";

type RpcCapableClient = {
  rpc: (name: string) => PromiseLike<{ error: { message: string } | null }>;
};

export async function touchCurrentLastLogin(supabase: RpcCapableClient) {
  const { error } = await supabase.rpc("touch_current_last_login");

  if (error) {
    throw new AppError("INTERNAL_ERROR", "Aggiornamento ultimo accesso non riuscito.");
  }
}
