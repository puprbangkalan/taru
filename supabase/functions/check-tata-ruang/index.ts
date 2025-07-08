// supabase/functions/check-tata-ruang/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { userPolygonGeoJSON } = await req.json();

        if (!userPolygonGeoJSON) {
            return new Response('Missing userPolygonGeoJSON in request body', {
                status: 400,
            });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Convert GeoJSON to WKT for PostGIS ST_GeomFromGeoJSON
        const userPolygonWKT = `ST_GeomFromGeoJSON('${JSON.stringify(userPolygonGeoJSON)}')`;

        const { data, error } = await supabase.rpc('intersect_zonasi', {
            user_polygon_wkt: userPolygonWKT,
        });

        if (error) {
            console.error('Error calling RPC:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (e) {
        console.error('Edge Function error:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
