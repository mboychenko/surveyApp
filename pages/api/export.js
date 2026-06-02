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
    .select('methodology_id, question_id, answer_type, answer_data')
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });

  // --- Трансформация данных ---
  const groupedData = answers.reduce((acc, currentAnswer) => {
    const { methodology_id, question_id, answer_type, answer_data } = currentAnswer;

    // Если секции с такой методологией еще нет, создаем ее
    if (!acc[methodology_id]) {
      acc[methodology_id] = {
        methodology_id: methodology_id,
        questions: []
      };
    }

    // Собираем вопрос, "размазывая" answer_data на текущий уровень
    const flattenedQuestion = {
      question_id: question_id,
      answer_type: answer_type,
      ...(answer_data || {}) // Извлекаем все ключи (weight, raw_value, text и т.д.)
    };

    // Пушим готовый вопрос в соответствующую методологию
    acc[methodology_id].questions.push(flattenedQuestion);

    return acc;
  }, {});

  // Преобразуем объект группировки обратно в массив
  const finalJsonOutput = Object.values(groupedData);

  // Возвращаем в формате JSON
  res.setHeader('Content-Disposition', `attachment; filename=export_${email}.json`);
  res.status(200).json(finalJsonOutput);
}