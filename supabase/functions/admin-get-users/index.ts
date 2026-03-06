import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 요청한 사람이 관리자인지 검증
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 호출자의 세션 토큰으로 admin 권한 확인
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: roleData } = await userClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    // service role로 모든 사용자 목록 조회
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));

    // 비밀번호 변경 요청
    if (body.action === "set_password" && body.user_id && body.password) {
      const { error } = await adminClient.auth.admin.updateUserById(body.user_id, { password: body.password });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders });
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // 사용자 목록 조회 (최대 1000명)
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    // 이메일과 user_id만 반환
    const result = users.map((u) => ({ user_id: u.id, email: u.email ?? "" }));
    return new Response(JSON.stringify({ users: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders });
  }
});
