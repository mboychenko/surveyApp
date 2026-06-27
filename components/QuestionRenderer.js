import { rendererDict } from '../scripts/translations';

export default function QuestionRenderer({ question: dbRow, currentAnswer, setCurrentAnswer, lang = 'ru' }) {

  // 1. Вытаскиваем тип ответа из новой колонки
  const answerType = dbRow.answer_type;

  // 2. Переназначаем question на внутренний объект data.
  const question = dbRow.data || {};

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

  // Вспомогательная функция для безопасного получения текста в зависимости от языка
  const getLangText = (field) => {
    if (!field) return '';
    if (typeof field === 'object') {
      return field[lang] || field['ru'] || '';
    }
    return field; // Фолбек, если это уже строка
  };

  // Для шкал Ликерта (likert_5, likert_6, likert_7)
  if (answerType.startsWith('likert_')) {
    const labels = question.ui_options_reference?.labels || {};

    return (
      <div className="flex flex-col gap-3 w-full">
        {Object.entries(question.weights).map(([value, weight]) => {
          const isActive = currentAnswer?.weight === weight;

          // Извлекаем текст лейбла для текущей оценки
          const labelObj = labels[value];
          const labelText = labelObj ? getLangText(labelObj) : `${rendererDict.evaluation[lang]}: ${value}`;

          return (
            <label key={value} className={`${baseCardClass} ${isActive ? activeCardClass : inactiveCardClass}`}>
              <input
                type="radio"
                name={question.question_id}
                className="hidden"
                checked={isActive}
                onChange={() => {
                  const rawAnswer = {
                    raw_value: value,
                    weight: weight
                  };
                  if (question.parameter_id != null) {
                    rawAnswer.parameter_id = question.parameter_id;
                  }
                  if (question.facet_id != null) {
                    rawAnswer.facet_id = question.facet_id;
                  }
                  setCurrentAnswer(rawAnswer);
                }}
              />
              {renderRadioIndicator(isActive)}
              <span className={`text-base md:text-lg ${isActive ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {labelText}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // single choice & custom_options
  if (answerType === 'custom_options' || answerType === 'single_choice') {
    return (
      <div className="flex flex-col gap-3 w-full">
        {question.options.map((opt, idx) => {
          // Стабильный ключ для сохранения в БД (всегда en)
          const stableKey = typeof opt.label === 'object' ? (opt.label['en'] || '') : opt.label;
          // Текст для отображения пользователю на выбранном языке
          const displayLabel = getLangText(opt.label);

          const isActive = answerType === 'single_choice'
            ? currentAnswer?.text === stableKey
            : currentAnswer?.weight === opt.weight;

          return (
            <label key={idx} className={`${baseCardClass} ${isActive ? activeCardClass : inactiveCardClass}`}>
              <input
                type="radio"
                name={question.question_id}
                className="hidden"
                checked={isActive}
                onChange={() => {
                  const rawAnswer = {};
                  if (answerType === 'single_choice') {
                    rawAnswer.text = stableKey; // Сохраняем стабильный ru-текст
                  } else {
                    rawAnswer.weight = opt.weight;
                    if (question.parameter_id != null) {
                      rawAnswer.parameter_id = question.parameter_id;
                    }
                  }

                  if (question.category_tag != null) {
                    rawAnswer.category_tag = question.category_tag;
                  }

                  setCurrentAnswer(rawAnswer);
                }}
              />
              {renderRadioIndicator(isActive)}
              <span className={`text-base md:text-lg leading-snug ${isActive ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {displayLabel}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // Для множественного выбора (multiple_choice)
  if (answerType === 'multiple_choice') {
    const handleCheck = (opt) => {
      const stableKey = typeof opt.label === 'object' ? (opt.label['en'] || '') : opt.label;
      let prevAnswers = currentAnswer?.selection || [];

      if (prevAnswers.includes(stableKey)) {
        prevAnswers = prevAnswers.filter(a => a !== stableKey);
      } else {
        if (question.max_choices && prevAnswers.length >= question.max_choices) return;
        prevAnswers = [...prevAnswers, stableKey];
      }

      const rawAnswer = { selection: prevAnswers };
      if (question.category_tag != null) {
        rawAnswer.category_tag = question.category_tag;
      }
      setCurrentAnswer(rawAnswer);
    };

    return (
      <div className="flex flex-col gap-3 w-full">
        {(question.min_choices || question.max_choices) && (
          <p className="text-sm text-gray-500 mb-2 text-center">
            {question.max_choices
              ? rendererDict.selectUpTo[lang](question.max_choices)
              : rendererDict.selectMultiple[lang]}
          </p>
        )}

        {question.options.map((opt, idx) => {
          const stableKey = typeof opt.label === 'object' ? (opt.label['en'] || '') : opt.label;
          const displayLabel = getLangText(opt.label);
          const isChecked = currentAnswer?.selection?.includes(stableKey) || false;

          return (
            <label key={idx} className={`${baseCardClass} ${isChecked ? activeCardClass : inactiveCardClass}`}>
              <input
                type="checkbox"
                className="hidden"
                checked={isChecked}
                onChange={() => handleCheck(opt)}
              />
              <div className={`w-6 h-6 rounded border-2 flex flex-shrink-0 items-center justify-center transition-colors ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                {isChecked && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-base md:text-lg leading-snug ${isChecked ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                {displayLabel}
              </span>
            </label>
          );
        })}
      </div>
    );
  }

  // Для свободного текста (free_text)
  if (answerType === 'free_text') {
    const uiHintText = getLangText(question.ui_hint);
    const placeholderText = rendererDict.placeholder[lang];

    return (
      <div className="w-full flex flex-col gap-2">
        <textarea
          className="w-full border-2 border-gray-200 p-5 rounded-2xl min-h-[160px] text-lg text-gray-800 bg-gray-50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none"
          placeholder={placeholderText}
          value={currentAnswer?.text || ''}
          onChange={(e) => {
            const rawAnswer = { text: e.target.value };
            if (question.category_tag != null) {
              rawAnswer.category_tag = question.category_tag;
            }
            setCurrentAnswer(rawAnswer);
          }}
        />
        {uiHintText && (
          <p className="text-sm text-gray-500 mt-2 px-2 italic">
            💡 {uiHintText}
          </p>
        )}
      </div>
    );
  }

  return <div className="text-red-500 p-4 border border-red-200 rounded">{rendererDict.unknownType[lang]}</div>;
}