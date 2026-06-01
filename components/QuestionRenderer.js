export default function QuestionRenderer({ question, currentAnswer, setCurrentAnswer }) {

  // Для шкал Ликерта (likert_5, likert_7)
    if (question.type.startsWith('likert_')) {
      // Достаем лейблы, если они есть
      const labels = question.ui_options_reference?.labels || {};

      return (
        <div className="flex flex-col gap-2">
          {Object.entries(question.weights).map(([value, weight]) => (
            <label key={value} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name={question.question_id}
                value={weight}
                checked={currentAnswer?.weight === weight}
                onChange={() => setCurrentAnswer({ value: value, weight: weight })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-700">
                {/* Если есть текстовая расшифровка — показываем её, иначе просто цифру */}
                {labels[value] ? <span className="font-medium">{labels[value]}</span> : `Оценка: ${value}`}
              </span>
            </label>
          ))}
        </div>
      );
    }

  // Для кастомных опций и single choice
  if (question.type === 'custom_options' || question.type === 'single_choice') {
    return (
      <div className="flex flex-col gap-3">
        {question.options.map((opt, idx) => (
          <label key={idx} className="flex items-start gap-2 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name={question.question_id}
              checked={currentAnswer?.text === opt.label}
              onChange={() => setCurrentAnswer({ text: opt.label, weight: opt.weight || null })}
              className="mt-1"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Для множественного выбора (multiple_choice)
  if (question.type === 'multiple_choice') {
    const handleCheck = (label) => {
      let prevAnswers = currentAnswer?.selection || [];
      if (prevAnswers.includes(label)) {
        prevAnswers = prevAnswers.filter(a => a !== label);
      } else {
        if (question.max_choices && prevAnswers.length >= question.max_choices) return; // Ограничение выбора
        prevAnswers.push(label);
      }
      setCurrentAnswer({ selection: prevAnswers });
    };

    return (
      <div className="flex flex-col gap-2">
        {question.options.map((opt, idx) => (
          <label key={idx} className="flex items-center gap-2 p-2 border rounded cursor-pointer">
            <input
              type="checkbox"
              checked={currentAnswer?.selection?.includes(opt.label) || false}
              onChange={() => handleCheck(opt.label)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  // Для свободного текста (free_text)
  if (question.type === 'free_text') {
    return (
      <textarea
        className="w-full border p-3 rounded h-32"
        placeholder={question.ui_hint || "Ваш ответ..."}
        value={currentAnswer?.text || ''}
        onChange={(e) => setCurrentAnswer({ text: e.target.value })}
      />
    );
  }

  return <div>Неизвестный тип вопроса</div>;
}