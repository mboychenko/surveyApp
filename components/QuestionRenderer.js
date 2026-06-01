export default function QuestionRenderer({ question, currentAnswer, setCurrentAnswer }) {

  // Общие стили для карточек ответов
  const baseCardClass = "flex items-center gap-4 p-4 min-h-[64px] border-2 rounded-2xl cursor-pointer transition-all w-full text-left bg-white";
  const activeCardClass = "border-blue-600 bg-blue-50/50 shadow-sm";
  const inactiveCardClass = "border-gray-200 hover:border-gray-300 hover:bg-gray-50";

  // Кастомный UI для радио-кнопки (кружок)
  const renderRadioIndicator = (isActive) => (
    <div className={`w-6 h-6 rounded-full border-2 flex flex-shrink-0 items-center justify-center transition-colors ${isActive ? 'border-blue-600' : 'border-gray-300'}`}>
      {isActive && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
    </div>
  );

  // Для шкал Ликерта (likert_5, likert_6, likert_7)
  if (question.type.startsWith('likert_')) {
    const labels = question.ui_options_reference?.labels || {};

    return (
      <div className="flex flex-col gap-3 w-full">
        {Object.entries(question.weights).map(([value, weight]) => {
          const isActive = currentAnswer?.weight === weight;
          return (
            <label key={value} className={`${baseCardClass} ${isActive ? activeCardClass : inactiveCardClass}`}>
              <input
                type="radio"
                name={question.question_id}
                className="hidden" // Скрываем стандартный инпут
                checked={isActive}
                onChange={() => setCurrentAnswer({ value: value, weight: weight })}
              />
              {renderRadioIndicator(isActive)}
              <span className={`text-base md:text-lg ${isActive ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {labels[value] ? labels[value] : `Оценка: ${value}`}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // Для кастомных опций и single choice
  if (question.type === 'custom_options' || question.type === 'single_choice') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {question.options.map((opt, idx) => {
          const isActive = currentAnswer?.text === opt.label;
          return (
            <label key={idx} className={`${baseCardClass} ${isActive ? activeCardClass : inactiveCardClass}`}>
              <input
                type="radio"
                name={question.question_id}
                className="hidden"
                checked={isActive}
                onChange={() => setCurrentAnswer({ text: opt.label, weight: opt.weight || null })}
              />
              {renderRadioIndicator(isActive)}
              <span className={`text-base md:text-lg leading-snug ${isActive ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // Для множественного выбора (multiple_choice)
  if (question.type === 'multiple_choice') {
    const handleCheck = (label) => {
      let prevAnswers = currentAnswer?.selection || [];
      if (prevAnswers.includes(label)) {
        prevAnswers = prevAnswers.filter(a => a !== label); // Убираем галочку
      } else {
        if (question.max_choices && prevAnswers.length >= question.max_choices) return; // Ограничение
        prevAnswers = [...prevAnswers, label];
      }
      setCurrentAnswer({ selection: prevAnswers });
    };

    return (
      <div className="flex flex-col gap-3 w-full">
        {/* Подсказка для пользователя (например, "Выберите от 1 до 3 вариантов") */}
        {(question.min_choices || question.max_choices) && (
          <p className="text-sm text-gray-500 mb-2 text-center">
            {question.max_choices ? `Можно выбрать до ${question.max_choices} вариантов` : 'Выберите несколько вариантов'}
          </p>
        )}

        {question.options.map((opt, idx) => {
          const isChecked = currentAnswer?.selection?.includes(opt.label) || false;
          return (
            <label key={idx} className={`${baseCardClass} ${isChecked ? activeCardClass : inactiveCardClass}`}>
              <input
                type="checkbox"
                className="hidden"
                checked={isChecked}
                onChange={() => handleCheck(opt.label)}
              />
              {/* Кастомный UI для чекбокса (квадрат) */}
              <div className={`w-6 h-6 rounded border-2 flex flex-shrink-0 items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {isChecked && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-base md:text-lg leading-snug ${isChecked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {opt.label}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // Для свободного текста (free_text)
  if (question.type === 'free_text') {
    return (
      <div className="w-full flex flex-col gap-2">
        <textarea
          className="w-full border-2 border-gray-200 p-5 rounded-2xl min-h-[160px] text-lg text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
          placeholder="Напишите ваш ответ здесь..."
          value={currentAnswer?.text || ''}
          onChange={(e) => setCurrentAnswer({ text: e.target.value })}
        />
        {question.ui_hint && ( // Если в JSON есть ui_hint
          <p className="text-sm text-gray-500 mt-2 px-2 italic">
            💡 {question.ui_hint}
          </p>
        )}
      </div>
    );
  }

  return <div className="text-red-500 p-4 border border-red-200 rounded">Неизвестный тип вопроса</div>;
}