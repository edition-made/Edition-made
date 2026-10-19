-- Évolution quotidienne ventilée par provenance (google, ai, social, direct, other)
-- et détail des sources (ex. chatgpt.com, perplexity.ai) pour l'admin Visibilité.
CREATE OR REPLACE FUNCTION public.get_visibility_stats(p_since timestamptz)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  source_rows jsonb;
  detail_rows jsonb;
  page_rows jsonb;
  click_rows jsonb;
  daily_rows jsonb;
  hour_rows jsonb;
  weekday_rows jsonb;
  hourly_rows jsonb;
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
  INTO detail_rows
  FROM (
    SELECT source, source_detail AS name,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(DISTINCT visitor_id) FILTER (WHERE event_name = 'page_view')::int AS visitors
    FROM analytics_events
    WHERE created_at >= p_since
    GROUP BY source, source_detail
    HAVING count(*) FILTER (WHERE event_name = 'page_view') > 0
    ORDER BY views DESC
    LIMIT 30
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
      count(*) FILTER (WHERE event_name = 'click')::int AS clicks,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'google')::int AS google,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'ai')::int AS ai,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'social')::int AS social,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'direct')::int AS direct,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'other')::int AS other
    FROM (
      SELECT (created_at AT TIME ZONE 'Europe/Paris')::date AS day, event_name, source
      FROM analytics_events
      WHERE created_at >= p_since
    ) daily_events
    GROUP BY day
  ) grouped;

  -- Répartition par heure de la journée (heure de Paris), toutes dates confondues.
  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.hour), '[]'::jsonb)
  INTO hour_rows
  FROM (
    SELECT extract(hour FROM created_at AT TIME ZONE 'Europe/Paris')::int AS hour,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(*) FILTER (WHERE event_name = 'click')::int AS clicks
    FROM analytics_events
    WHERE created_at >= p_since
    GROUP BY 1
  ) grouped;

  -- Répartition par jour de la semaine (1 = lundi ... 7 = dimanche).
  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.weekday), '[]'::jsonb)
  INTO weekday_rows
  FROM (
    SELECT extract(isodow FROM created_at AT TIME ZONE 'Europe/Paris')::int AS weekday,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(*) FILTER (WHERE event_name = 'click')::int AS clicks
    FROM analytics_events
    WHERE created_at >= p_since
    GROUP BY 1
  ) grouped;

  -- Évolution heure par heure, limitée aux 8 derniers jours pour rester légère.
  SELECT COALESCE(jsonb_agg(to_jsonb(grouped) ORDER BY grouped.slot), '[]'::jsonb)
  INTO hourly_rows
  FROM (
    SELECT to_char(date_trunc('hour', created_at AT TIME ZONE 'Europe/Paris'), 'YYYY-MM-DD"T"HH24') AS slot,
      count(*) FILTER (WHERE event_name = 'page_view')::int AS views,
      count(*) FILTER (WHERE event_name = 'click')::int AS clicks,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'google')::int AS google,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'ai')::int AS ai,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'social')::int AS social,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'direct')::int AS direct,
      count(*) FILTER (WHERE event_name = 'page_view' AND source = 'other')::int AS other
    FROM analytics_events
    WHERE created_at >= greatest(p_since, now() - interval '8 days')
    GROUP BY 1
  ) grouped;

  SELECT jsonb_build_object(
    'hours', hour_rows,
    'weekdays', weekday_rows,
    'hourly', hourly_rows,
    'page_views', count(*) FILTER (WHERE event_name = 'page_view'),
    'clicks', count(*) FILTER (WHERE event_name = 'click'),
    'visitors', count(DISTINCT visitor_id) FILTER (WHERE event_name = 'page_view'),
    'sessions', count(DISTINCT session_id) FILTER (WHERE event_name = 'page_view'),
    'sources', source_rows,
    'source_details', detail_rows,
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
