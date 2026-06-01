import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Находим пользователя
  const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Достаем все его ответы
  const { data: answers, error } = await supabase
    .from('answers')
    .select('user_id, methodology_id, question_id, answer_type, answer_data')
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });

  // Возвращаем в формате JSON (браузер предложит сохранить как файл, если делать запрос напрямую)
  res.setHeader('Content-Disposition', `attachment; filename=export_${email}.json`);
  res.status(200).json(answers);
}