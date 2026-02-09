const { createClient } = require("@supabase/supabase-js");

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables");
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

module.exports = getSupabase;
