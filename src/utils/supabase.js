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

export async function getCachedBriefing(date, userEmail = 'ata@planner.app') {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_briefings')
        .select('content')
        .eq('user_email', userEmail)
        .eq('date', date)
        .maybeSingle();
      
      if (!error && data) {
        return data.content;
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to localStorage:', e);
    }
  }

  // Fallback to localStorage
  const cache = getLocalCache();
  return cache[date] || null;
}

export async function saveCachedBriefing(date, content, userEmail = 'ata@planner.app') {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('daily_briefings')
        .upsert({ user_email: userEmail, date, content }, { onConflict: 'user_email,date' });
      
      if (!error) {
        return;
      }
      console.warn('Supabase upsert returned error:', error);
    } catch (e) {
      console.warn('Supabase upsert failed, falling back to localStorage:', e);
    }
  }

  // Fallback to localStorage
  const cache = getLocalCache();
  cache[date] = content;
  saveLocalCache(cache);
}
