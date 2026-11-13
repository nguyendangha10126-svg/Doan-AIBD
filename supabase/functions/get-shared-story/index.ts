import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getSupabaseAdmin } from '../_shared/supabase-admin.ts';

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: { code: 'BAD_REQUEST', message: 'Thiếu share_token' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query story by share_token
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        id,
        title,
        summary,
        moral,
        status,
        is_shared,
        share_token,
        model,
        next_drawing_ideas,
        created_at,
        child:children (nickname, age, avatar_emoji),
        drawing:drawings (image_path)
      `)
      .eq('share_token', token)
      .single();

    if (storyError || !story) {
      return new Response(
        JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy câu chuyện hoặc liên kết không hợp lệ' } }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only approved and shared stories are readable publicly
    if (!story.is_shared || !['auto_approved', 'approved', 'parent_approved'].includes(story.status)) {
      return new Response(
        JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Câu chuyện này chưa được cấp phép chia sẻ công khai' } }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch story pages
    const { data: pages } = await supabase
      .from('story_pages')
      .select('page_number, text_content, emotion, focus_region')
      .eq('story_id', story.id)
      .order('page_number', { ascending: true });

    // Resolve image URL cleanly (supports both full public URLs and relative storage paths)
    let signedImageUrl: string | null = null;
    const drawingPath = (story.drawing as { image_path?: string } | null)?.image_path;
    if (drawingPath) {
      if (drawingPath.startsWith('http://') || drawingPath.startsWith('https://')) {
        signedImageUrl = drawingPath;
      } else {
        const { data: signedData } = await supabase.storage
          .from('drawings')
          .createSignedUrl(drawingPath, 3600);
        signedImageUrl = signedData?.signedUrl || null;
      }
    }

    return new Response(
      JSON.stringify({
        data: {
          ...story,
          pages: pages || [],
          signedImageUrl,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: error.message } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
