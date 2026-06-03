import { supabase } from '../lib/supabase';

// Graceful local cache fallback functions
function getLocalCache() {
  try {
    const raw = localStorage.getItem('planner_supabase_mock_cache');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCache(cache) {
  try {
    localStorage.setItem('planner_supabase_mock_cache', JSON.stringify(cache));
  } catch (_) {}
}

// Caching helpers removed

