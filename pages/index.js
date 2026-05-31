import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QuestionRenderer from '../components/QuestionRenderer';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SurveyApp() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  // 1. Идентификация пользователя
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Ищем пользователя или создаем нового
    let { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
    
    if (!existingUser) {
      const { data: newUser } = await supabase.from('users').insert([{ email }]).select().single();
      existingUser = newUser;
    }
    
    setUser(existingUser);
    loadProgress(existingUser.id);
  };

  // 2. Загрузка вопросов и прогресса
  const loadProgress = async (userId) => {
    // Получаем все вопросы
    const { data: allQuestions } = await supabase.from('questions').select('*').order('id');
    
    // Получаем уже данные ответы
    const { data: answered } = await supabase.from('answers').select('question_id').eq('user_id', userId);
    const answeredIds = answered.map(a => a.question_id);

    setQuestions(allQuestions);
    
    // Находим первый неотвеченный вопрос
    const nextUnansweredIndex = allQuestions.findIndex(q => !answeredIds.includes(q.id));
    setCurrentQuestionIndex(nextUnansweredIndex !== -1 ? nextUnansweredIndex : allQuestions.length);
  };

  // 3. Сохранение ответа и переход к следующему
  const handleNext = async () => {
    if (currentAnswer === null) return; // Валидация

    const question = questions[currentQuestionIndex];

    await supabase.from('answers').upsert({
      user_id: user.id,
      question_id: question.id,
      methodology_id: question.methodology,
      answer_data: currentAnswer
    }, { onConflict: 'user_id, question_id' });

    setCurrentAnswer(null); // Сбрасываем стейт ответа
    setCurrentQuestionIndex(prev => prev + 1);
  };

  // --- РЕНДЕР ---
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2>Введите email для начала</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="your@email.com" 
            className="border p-2"
          />
          <button type="submit" className="bg-blue-500 text-white p-2">Войти</button>
        </form>
      </div>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    return <div className="text-center mt-20"><h2>Опрос завершен. Спасибо!</h2></div>;
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-2xl mx-auto mt-10 p-5">
      <p className="text-gray-500 text-sm mb-4">Вопрос {currentQuestionIndex + 1} из {questions.length}</p>
      <h3 className="text-xl font-bold mb-6">{currentQ.data.text}</h3>

      {/* Динамический рендер вариантов ответов */}
      <QuestionRenderer 
        question={currentQ.data} 
        currentAnswer={currentAnswer} 
        setCurrentAnswer={setCurrentAnswer} 
      />

      <button 
        onClick={handleNext} 
        disabled={currentAnswer === null}
        className="mt-8 bg-green-500 text-white px-6 py-2 rounded disabled:opacity-50"
      >
        Ответить и продолжить
      </button>
    </div>
  );
}