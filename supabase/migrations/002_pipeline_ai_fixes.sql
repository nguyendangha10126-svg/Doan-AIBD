-- ====================================================================
-- MIGRATION: 002_pipeline_ai_fixes.sql
-- PROJECT: DrawToStory - AI Pipeline Enhancements (Idempotent)
-- ====================================================================

-- 1. Add faithfulness_score and generation_stage to stories
alter table public.stories 
  add column if not exists faithfulness_score integer not null default 100 check (faithfulness_score between 0 and 100);

alter table public.stories 
  add column if not exists generation_stage text not null default 'done';

-- 2. Add grounded_objects to story_pages
alter table public.story_pages 
  add column if not exists grounded_objects jsonb not null default '[]'::jsonb;

-- 3. Add strict_drawing_check to app_settings
insert into public.app_settings (key, value)
values ('strict_drawing_check', 'true')
on conflict (key) do nothing;

