import { supabaseAdmin } from '../services/supabaseClient.js';
import { logger } from '../config/logger.js';

const ensureProfileRow = async (user) => {
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? user.user_metadata?.email ?? null,
      username: user.user_metadata?.username ?? null,
      plan: 'free',
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted;
};

export const getProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await ensureProfileRow(req.user);
    return res.json({ profile });
  } catch (error) {
    logger.error('getProfile failed', error);
    return res.status(500).json({ error: 'Unable to fetch profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { full_name, avatar_url, username } = req.body;

    if (username) {
      const { data: existing, error: usernameError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', req.userId)
        .maybeSingle();

      if (usernameError && usernameError.code !== 'PGRST116') {
        logger.error('updateProfile username check error', usernameError);
        return res.status(400).json({ error: 'Unable to validate username' });
      }

      if (existing) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        avatar_url,
        username,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.userId)
      .select()
      .single();

    if (error) {
      logger.error('updateProfile error', error);
      return res.status(400).json({ error: 'Could not update profile' });
    }

    return res.json({ profile: data });
  } catch (error) {
    logger.error('updateProfile failed', error);
    return res.status(500).json({ error: 'Unable to update profile' });
  }
};

export const getPlanStatus = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', req.userId)
      .single();

    if (error) {
      logger.error('getPlanStatus error', error);
      return res.status(400).json({ error: 'Unable to load plan status' });
    }

    return res.json({ plan: data.plan, plan_expires_at: data.plan_expires_at });
  } catch (error) {
    logger.error('getPlanStatus failed', error);
    return res.status(500).json({ error: 'Unable to load plan status' });
  }
};
