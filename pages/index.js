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

  // Добавлено состояние загрузки
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      let { data: existingUser } = await supabase.from('users').select('*').eq('email', email).single();
      if (!existingUser) {
        const { data: newUser } = await supabase.from('users').insert([{ email }]).select().single();
        existingUser = newUser;
      }
      setUser(existingUser);


      await loadProgress(existingUser.id);
    } catch (error) {
      console.error('Ошибка входа:', error);
      setIsLoading(false);
    }
  };

  const loadProgress = async (userId) => {
    try {
      const { data: allQuestions } = await supabase.from('questions').select('*').order('id');
      const { data: answered } = await supabase.from('answers').select('question_id').eq('user_id', userId);

      const answeredIds = answered ? answered.map(a => a.question_id) : [];

      setQuestions(allQuestions || []);
      const nextUnansweredIndex = (allQuestions || []).findIndex(q => !answeredIds.includes(q.id));
      setCurrentQuestionIndex(nextUnansweredIndex !== -1 ? nextUnansweredIndex : (allQuestions || []).length);
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
      if (currentAnswer === null) return;

      const question = questions[currentQuestionIndex];

      const exactMethodologyId = question.methodology
                              || 'methodology_not_found';

      const exactAnswerType = question.answer_type
                             || 'unknown_type';

      await supabase.from('answers').upsert({
        user_id: user.id,
        question_id: question.id,
        answer_type: exactAnswerType,
        methodology_id: exactMethodologyId,
        answer_data: currentAnswer
      }, { onConflict: 'user_id, question_id' });

      setCurrentAnswer(null);
      setCurrentQuestionIndex(prev => prev + 1);
  };

  // Добавлен обработчик "Назад" для удобства
  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentAnswer(null); // Сбрасываем текущий выбор при возврате
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // --- РЕНДЕР ---

  // 1. Экран авторизации
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Вход в систему</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder="Введите ваш email"
              className="border-2 border-gray-200 p-4 rounded-xl w-full text-lg focus:border-blue-500 outline-none transition-colors"
            />
            <button type="submit" className="bg-blue-600 text-white font-medium p-4 rounded-xl text-lg hover:bg-blue-700 transition-colors">Начать опрос</button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Экран загрузки (Лоадер)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
         <div className="flex flex-col items-center justify-center bg-white p-10 rounded-2xl shadow-sm w-full max-w-md text-center">
           <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-gray-500 text-lg">Загрузка данных...</p>
         </div>
      </div>
    );
  }

  // 3. Экран завершения
  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
         <div className="text-center bg-white p-10 rounded-2xl shadow-sm">
           <h2 className="text-3xl font-bold text-gray-800 mb-2">Опрос завершен!</h2>
           <p className="text-gray-500 text-lg">Спасибо за ваши ответы.</p>
         </div>
      </div>
    );
  }

  // 4. Основной экран опроса
  const currentQ = questions[currentQuestionIndex];
  // Расчет прогресса
  const progressPercent = Math.round((currentQuestionIndex / questions.length) * 100);

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">

      {/* Шапка с прогресс-баром (фиксированная) */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-20 px-4 py-3 border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentQuestionIndex === 0}
              className={`text-sm font-medium ${currentQuestionIndex === 0 ? 'text-gray-300' : 'text-blue-600'}`}
            >
              ← Назад
            </button>
            <span className="text-sm font-bold text-gray-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Основной контент (центрирован) */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pt-28 pb-32">
        <div className="flex flex-col items-center text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
            {currentQ.data.text}
          </h3>
        </div>

        <QuestionRenderer
          question={currentQ}
          currentAnswer={currentAnswer}
          setCurrentAnswer={setCurrentAnswer}
        />
      </main>

      {/* Подвал с кнопкой "Далее" (фиксированный) */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-100 p-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleNext}
            disabled={currentAnswer === null}
            className="w-full bg-blue-600 text-white font-semibold text-lg py-4 px-6 rounded-2xl disabled:opacity-40 disabled:bg-gray-400 transition-all active:scale-[0.98]"
          >
            Далее
          </button>
        </div>
      </footer>

    </div>
  );
}