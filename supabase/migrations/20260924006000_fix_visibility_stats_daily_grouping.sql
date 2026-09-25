-- Fix the daily aggregation: group on the computed calendar day before
-- formatting it as JSON. PostgreSQL cannot select to_char(created_at) while
-- grouping only by created_at::date.
CREATE OR REPLACE FUNCTION public.get_visibility_stats(p_since timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  source_rows jsonb;
  page_rows jsonb;
  click_rows jsonb;
  daily_rows jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.views DESC), '[]'::jsonb)
  INTO source_rows
  FROM (
    SELECT source AS name,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(DISTINCT visitor_id) FILTER (WHERE event_name = 'page_view')::int AS visitors
    FROM analytics_events
    WHERE created_at >= p_since
    GROUP BY source
  ) grouped;

  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.views DESC), '[]'::jsonb)
  INTO page_rows
  FROM (
    SELECT page_path AS name,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(*) FILTER (WHERE event_name = 'click')::int AS clicks
    FROM analytics_events
    WHERE created_at >= p_since
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 20
  ) grouped;

  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.clicks DESC), '[]'::jsonb)
  INTO click_rows
  FROM (
    SELECT target_path AS name, count(*)::int AS clicks
    FROM analytics_events
    WHERE created_at >= p_since AND event_name = 'click' AND target_path IS NOT NULL
    GROUP BY target_path
    ORDER BY clicks DESC
    LIMIT 20
  ) grouped;

  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.date), '[]'::jsonb)
  INTO daily_rows
  FROM (
    SELECT day::text AS date,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(*) FILTER (WHERE event_name = 'click')::int AS clicks
    FROM (
      SELECT (created_at AT TIME ZONE 'Europe/Paris')::date AS day, event_name
      FROM analytics_events
      WHERE created_at >= p_since
    ) daily_events
    GROUP BY day
  ) grouped;

  SELECT jsonb_build_object(
    'page_views', count(*) FILTER (WHERE event_name = 'page_view'),
    'clicks', count(*) FILTER (WHERE event_name = 'click'),
    'visitors', count(DISTINCT visitor_id) FILTER (WHERE event_name = 'page_view'),
    'sessions', count(DISTINCT session_id) FILTER (WHERE event_name = 'page_view'),
    'sources', source_rows,
    'pages', page_rows,
    'click_targets', click_rows,
    'daily', daily_rows
  ) INTO result
  FROM analytics_events
  WHERE created_at >= p_since;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_visibility_stats(timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_visibility_stats(timestamptz) TO anon, authenticated;
