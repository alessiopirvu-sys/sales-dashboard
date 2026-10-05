/**
 * Test di fumo del livello DB (lib/db) contro un Postgres reale.
 * Uso: DATABASE_URL=postgresql://... npx tsx scripts/db/smoke-test.ts
 * Le scritture usano righe temporanee che vengono rimosse al termine.
 */
import { createAdminDb, createUserDb } from "../../lib/db/client";
import { getPool } from "../../lib/db/pool";

let failures = 0;

function check(name: string, condition: unknown, detail?: unknown) {
  if (condition) {
    process.stdout.write(`ok   ${name}\n`);
  } else {
    failures += 1;
    process.stdout.write(`FAIL ${name}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}\n`);
  }
}

async function main() {
  const admin = createAdminDb();

  const profiles = await admin.from("profiles").select("id,role,is_active,email");
  check("admin: select profiles", !profiles.error && (profiles.data?.length ?? 0) > 0, profiles.error);

  const adminProfile = profiles.data?.find((p) => p.role === "admin" && p.is_active);
  const sellerProfile = profiles.data?.find((p) => p.role === "seller" && p.is_active);
  check("trovato un admin e un seller attivi", adminProfile && sellerProfile);

  const sellers = await admin.from("sellers").select("id,name,profile_id,is_active").order("created_at", { ascending: false });
  check("admin: order + select sellers", !sellers.error && sellers.data!.length > 0, sellers.error);

  const byIn = await admin.from("sellers").select("id").in("id", sellers.data!.slice(0, 2).map((s) => s.id));
  check("in()", byIn.data?.length === 2, byIn);

  const none = await admin.from("sellers").select("id").in("id", []);
  check("in([]) -> vuoto", !none.error && none.data?.length === 0, none.error);

  const nullEq = await admin.from("sellers").select("id").eq("profile_id", null);
  check("eq(null) -> IS NULL", !nullEq.error, nullEq.error);

  const ilike = await admin.from("profiles").select("id").ilike("email", String(adminProfile?.email).toUpperCase()).maybeSingle();
  check("ilike + maybeSingle", !ilike.error && ilike.data?.id === adminProfile?.id, ilike.error);

  const missing = await admin.from("sellers").select("id").eq("id", "00000000-0000-0000-0000-000000000000").maybeSingle();
  check("maybeSingle senza righe -> data null", !missing.error && missing.data === null, missing);

  const singleMissing = await admin.from("sellers").select("id").eq("id", "00000000-0000-0000-0000-000000000000").single();
  check("single senza righe -> PGRST116", singleMissing.error?.code === "PGRST116", singleMissing.error);

  const kpis = await admin
    .from("seller_daily_kpis")
    .select("seller_id,report_date,fr_revenue,fr_calls,validation_errors")
    .gte("report_date", "2020-01-01")
    .lte("report_date", "2099-01-01")
    .order("report_date", { ascending: true })
    .limit(3);
  check("kpi: date come stringhe", typeof kpis.data?.[0]?.report_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(kpis.data[0].report_date), kpis.data?.[0]);
  check("kpi: numeric come number", typeof kpis.data?.[0]?.fr_revenue === "number", kpis.data?.[0]);
  check("kpi: jsonb come array", Array.isArray(kpis.data?.[0]?.validation_errors), kpis.data?.[0]);

  const sellerRow = await admin.from("sellers").select("created_at").limit(1).maybeSingle();
  check("timestamptz come ISO string", typeof sellerRow.data?.created_at === "string" && sellerRow.data.created_at.includes("T"), sellerRow.data);

  // --- RLS: l'utente vede solo cio' che le policy consentono
  const asAdmin = createUserDb(async () => ({ sub: adminProfile!.id }));
  const asSeller = createUserDb(async () => ({ sub: sellerProfile!.id }));
  const asNobody = createUserDb(async () => null);

  const adminSellers = await asAdmin.from("sellers").select("id");
  check("RLS admin: vede tutti i sellers", adminSellers.data?.length === sellers.data!.length, adminSellers);

  const sellerSellers = await asSeller.from("sellers").select("id,profile_id");
  check(
    "RLS seller: vede solo il proprio record",
    !sellerSellers.error && sellerSellers.data!.length === 1 && sellerSellers.data![0].profile_id === sellerProfile!.id,
    sellerSellers
  );

  const sellerProfiles = await asSeller.from("profiles").select("id");
  check("RLS seller: vede solo il proprio profilo", sellerProfiles.data?.length === 1, sellerProfiles);

  const nobody = await asNobody.from("sellers").select("id");
  check("senza sessione: nessun dato", !nobody.error ? nobody.data!.length === 0 : true, nobody);

  const sellerWrite = await asSeller.from("sellers").update({ name: "hack" }).eq("id", sellerSellers.data![0].id).select("id");
  check("RLS seller: non puo' modificare sellers", (sellerWrite.data?.length ?? 0) === 0, sellerWrite);

  // --- RPC
  const overview = await asAdmin.rpc("get_team_sales_overview");
  check("rpc get_team_sales_overview (jsonb)", !overview.error && overview.data && typeof overview.data === "object", overview.error);

  const myTeams = await asSeller.rpc("get_my_team_sales_team_ids", { p_seller_id: sellerSellers.data![0].id });
  check("rpc get_my_team_sales_team_ids (uuid[])", !myTeams.error && Array.isArray(myTeams.data), myTeams);

  const touch = await asSeller.rpc("touch_current_last_login");
  check("rpc touch_current_last_login", !touch.error, touch.error);

  // --- scritture (righe temporanee)
  const teamName = `__smoke_${Date.now()}`;
  const created = await asAdmin.from("team_sales_teams").insert({ name: teamName }).select("id,name").single();
  check("insert + select + single", !created.error && created.data?.name === teamName, created.error);

  const dup = await asAdmin.from("team_sales_teams").insert({ name: teamName }).select("id,name").single();
  check("insert duplicato -> codice 23505", dup.error?.code === "23505", dup.error);

  const renamed = await asAdmin.from("team_sales_teams").update({ name: `${teamName}_b` }).eq("id", created.data!.id).select("id,name").single();
  check("update + select + single", renamed.data?.name === `${teamName}_b`, renamed.error);

  const month = await asAdmin.rpc("get_team_sales_month", { p_team_id: created.data!.id });
  check("rpc get_team_sales_month", !month.error, month.error);

  const conv = await asAdmin
    .from("assistant_conversations")
    .insert([{ profile_id: adminProfile!.id, title: "smoke", messages: [{ role: "user", content: "ciao" }] }])
    .select("id,title,messages")
    .single();
  check("insert con jsonb array", !conv.error && Array.isArray(conv.data?.messages) && conv.data.messages[0].content === "ciao", conv.error);

  const convUpdate = await asAdmin
    .from("assistant_conversations")
    .update({ messages: [{ role: "user", content: "x" }, { role: "assistant", content: "y" }] })
    .eq("id", conv.data!.id)
    .select("id,messages")
    .single();
  check("update jsonb array", convUpdate.data?.messages?.length === 2, convUpdate.error);

  const del1 = await asAdmin.from("assistant_conversations").delete().eq("id", conv.data!.id);
  check("delete conversazione", !del1.error, del1.error);

  const up = await admin.from("team_sales_teams").upsert({ id: created.data!.id, name: `${teamName}_c` }, { onConflict: "id" }).select("name").single();
  check("upsert onConflict id", up.data?.name === `${teamName}_c`, up.error);

  const del2 = await admin.from("team_sales_teams").delete().eq("id", created.data!.id);
  check("delete team", !del2.error, del2.error);

  const gone = await admin.from("team_sales_teams").select("id").eq("id", created.data!.id).maybeSingle();
  check("team eliminato", gone.data === null, gone);

  const bad = await admin.from("sellers").select("id; drop table sellers");
  check("identificatori non validi rifiutati", Boolean(bad.error), bad);
}

main()
  .then(async () => {
    await getPool().end();
    process.stdout.write(failures === 0 ? "\nTutti i test passati.\n" : `\n${failures} test falliti.\n`);
    process.exit(failures === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error(error);
    await getPool().end().catch(() => undefined);
    process.exit(1);
  });
