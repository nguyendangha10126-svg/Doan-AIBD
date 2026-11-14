import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Phương thức không hợp lệ' } }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // 1. Verify Caller Bearer Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Thiếu Authorization header' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent last active Admin from accidentally deleting the only Admin account if desired,
    // or clean up non-cascading admin audit references first so FK never blocks deletion
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (callerProfile?.role === 'admin') {
      const { count: adminCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if ((adminCount ?? 0) <= 1) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'LAST_ADMIN',
              message: 'Không thể xóa tài khoản Quản trị viên duy nhất của hệ thống.',
            },
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase.from('moderation_reviews').delete().eq('admin_id', user.id);
      await supabase.from('admin_audit_logs').delete().eq('admin_id', user.id);
    }

    // 2. Collect & Remove All Drawing Files in Storage Bucket for User's Children
    const { data: children } = await supabase
      .from('children')
      .select('id')
      .eq('parent_id', user.id);

    const childIds = ((children as Array<{ id: string }> | null) || []).map((c) => c.id);
    const storagePathsToDelete = new Set<string>();

    for (const childId of childIds) {
      const { data: folderFiles } = await supabase.storage.from('drawings').list(childId, {
        limit: 500,
      });
      if (folderFiles) {
        for (const f of folderFiles) {
          if (f.name) {
            storagePathsToDelete.add(`${childId}/${f.name}`);
          }
        }
      }
    }

    if (childIds.length > 0) {
      const { data: drawingRows } = await supabase
        .from('drawings')
        .select('image_path')
        .in('child_id', childIds);

      if (drawingRows) {
        for (const row of drawingRows as Array<{ image_path?: string }>) {
          const pathVal = row.image_path || '';
          const marker = '/object/public/drawings/';
          const markerIdx = pathVal.indexOf(marker);
          if (markerIdx !== -1) {
            storagePathsToDelete.add(pathVal.slice(markerIdx + marker.length));
          } else if (pathVal && !pathVal.startsWith('http') && !pathVal.startsWith('data:')) {
            storagePathsToDelete.add(pathVal);
          }
        }
      }
    }

    if (storagePathsToDelete.size > 0) {
      await supabase.storage.from('drawings').remove(Array.from(storagePathsToDelete));
    }

    // 3. Delete Profile (cascades children -> drawings -> stories -> story_pages -> user_badges -> reading_events)
    await supabase.from('profiles').delete().eq('id', user.id);

    // 4. Permanently Delete Auth User from GoTrue (`auth.users`)
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteUserError) {
      throw new Error('Không thể xóa tài khoản xác thực: ' + deleteUserError.message);
    }

    return new Response(
      JSON.stringify({
        data: {
          deleted: true,
          removedFilesCount: storagePathsToDelete.size,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({
        error: {
          code: 'DELETE_ACCOUNT_FAILED',
          message: error.message || 'Đã xảy ra lỗi khi xóa vĩnh viễn tài khoản',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
