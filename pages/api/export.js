//import { createClient } from '@supabase/supabase-js';

//const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  return res
    .status(410) // HTTP 410 Gone = «Устарело / недоступно»
    .json({
      error: 'Deprecated API',
      message: 'This endpoint has been deprecated and is no longer available.',
      suggested_action: 'Contact support for migration to the new export service.',
    });
}