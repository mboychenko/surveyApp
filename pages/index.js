import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import QuestionRenderer from '../components/QuestionRenderer';
import { uiDict } from '../scripts/translations';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function SurveyApp() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);

  // Стейт для активного языка ('ru' или 'es')
  const [lang, setLang] = useState('ru');

  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeredIds, setAnsweredIds] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const { data: user, error } = await supabase
        .rpc('upsert_user_by_email', { input_email: email })
        .single();

      if (error) throw error;

      setUser(user);
      await loadProgress(user.id);
    } catch (error) {
      console.error('Ошибка входа:', error);
      setIsLoading(false);
    }
  };

  const loadProgress = async (userId) => {
    try {
      const { data: allQuestions } = await supabase.from('questions').select('*').order('id');
      const { data: answered } = await supabase.rpc('get_answers_by_user', { p_user_id: userId });

      const fetchedAnsweredIds = answered ? answered.map(a => a.question_id) : [];
      setAnsweredIds(fetchedAnsweredIds);

      setQuestions(allQuestions || []);
      const nextUnansweredIndex = (allQuestions || []).findIndex(q => !fetchedAnsweredIds.includes(q.id));
      setCurrentQuestionIndex(nextUnansweredIndex !== -1 ? nextUnansweredIndex : (allQuestions || []).length);
    } catch (error) {
      console.error('Ошибка загрузки прогресса:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
      if (currentAnswer === null || isSubmitting) return;

      setIsSubmitting(true);
      const question = questions[currentQuestionIndex];

      const exactMethodologyId = question.methodology || 'methodology_not_found';
      const exactAnswerType = question.answer_type || 'unknown_type';

      const { error } = await supabase.rpc('upsert_answer', {
        p_user_id: user.id,
        p_question_id: question.id,
        p_answer_type: exactAnswerType,
        p_methodology_id: exactMethodologyId,
        p_answer_data: currentAnswer
      });

      if (error) {
         console.error('Ошибка при сохранении ответа:', error);
         alert(uiDict.saveError[lang]);
         setIsSubmitting(false);
         return;
      }

      const newAnsweredIds = [...answeredIds, question.id];
      setAnsweredIds(newAnsweredIds);
      setCurrentAnswer(null);

      setCurrentQuestionIndex(prev => {
         let nextIdx = prev + 1;
         while (nextIdx < questions.length && newAnsweredIds.includes(questions[nextIdx].id)) {
             nextIdx++;
         }
         return nextIdx;
      });

      setIsSubmitting(false);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentAnswer(null);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // --- РЕНДЕР ---

  // 1. Экран авторизации
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {uiDict.loginTitle[lang]}
          </h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={e => setEmail(e.target.value)}
              placeholder={uiDict.emailPlaceholder[lang]}
              className="border-2 border-gray-200 p-4 rounded-xl w-full text-lg focus:border-blue-500 outline-none transition-colors"
            />
            <button type="submit" className="bg-blue-600 text-white font-medium p-4 rounded-xl text-lg hover:bg-blue-700 transition-colors">
              {uiDict.startSurvey[lang]}
            </button>
          </form>

          {/* Переключатель языка на экране логина */}
          <div className="flex justify-center gap-4 mt-6 text-sm font-semibold">
            <button onClick={() => setLang('ru')} className={`pb-1 border-b-2 ${lang === 'ru' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>RU</button>
            <button onClick={() => setLang('es')} className={`pb-1 border-b-2 ${lang === 'es' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>ES</button>
            <button onClick={() => setLang('en')} className={`pb-1 border-b-2 ${lang === 'en' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>EN</button>
            <button onClick={() => setLang('zh')} className={`pb-1 border-b-2 ${lang === 'zh' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>ZH</button>
            <button onClick={() => setLang('hi')} className={`pb-1 border-b-2 ${lang === 'hi' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>HI</button>
          </div>

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
           <p className="text-gray-500 text-lg">
             {uiDict.loading[lang]}
           </p>
         </div>
      </div>
    );
  }

  // 3. Экран завершения
  if (currentQuestionIndex >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
         <div className="text-center bg-white p-10 rounded-2xl shadow-sm">
           <h2 className="text-3xl font-bold text-gray-800 mb-2">
             {uiDict.surveyDone[lang]}
           </h2>
           <p className="text-gray-500 text-lg">
             {uiDict.thanks[lang]}
           </p>
         </div>
      </div>
    );
  }

  // 4. Основной экран опроса
  const currentQ = questions[currentQuestionIndex];
  const progressPercent = Math.round((currentQuestionIndex / questions.length) * 100);

  // Безопасное извлечение текста вопроса
  const questionText = typeof currentQ.data?.text === 'object'
    ? (currentQ.data.text[lang] || currentQ.data.text['ru'])
    : currentQ.data?.text;

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">

      {/* Шапка с прогресс-баром и выбором языка */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-20 px-4 py-3 border-b border-gray-100">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentQuestionIndex === 0 || isSubmitting}
              className={`text-sm font-medium ${currentQuestionIndex === 0 || isSubmitting ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600'}`}
            >
              {uiDict.backBtn[lang]}
            </button>

            {/* Переключатель языка "на лету" */}
            <div className="flex gap-3 text-xs font-bold bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setLang('ru')} className={`px-2 py-1 rounded-md transition-colors ${lang === 'ru' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>RU</button>
              <button onClick={() => setLang('es')} className={`px-2 py-1 rounded-md transition-colors ${lang === 'es' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>ES</button>
              <button onClick={() => setLang('en')} className={`px-2 py-1 rounded-md transition-colors ${lang === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>EN</button>
              <button onClick={() => setLang('zh')} className={`px-2 py-1 rounded-md transition-colors ${lang === 'zh' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>ZH</button>
              <button onClick={() => setLang('hi')} className={`px-2 py-1 rounded-md transition-colors ${lang === 'hi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>HI</button>
            </div>

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

      {/* Основной контент */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 pt-28 pb-32">
        <div className="flex flex-col items-center text-center mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
            {questionText}
          </h3>
        </div>

        <QuestionRenderer
          question={currentQ}
          currentAnswer={currentAnswer}
          setCurrentAnswer={setCurrentAnswer}
          lang={lang}
        />
      </main>

      {/* Подвал с кнопкой "Далее" */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-gray-100 p-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleNext}
            disabled={currentAnswer === null || isSubmitting}
            className="w-full bg-blue-600 text-white font-semibold text-lg py-4 px-6 rounded-2xl disabled:opacity-40 disabled:bg-gray-400 transition-all active:scale-[0.98]"
          >
            {isSubmitting
              ? uiDict.savingBtn[lang]
              : uiDict.nextBtn[lang]
              }
          </button>
        </div>
      </footer>

    </div>
  );
}