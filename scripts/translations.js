export const uiDict = {
  loginTitle: { ru: 'Вход в систему', es: 'Iniciar sesión', en: 'Log in', zh: '登录', hi: 'लॉग इन करें' },
  emailPlaceholder: { ru: 'Введите ваш email', es: 'Introduzca su email', en: 'Enter your email', zh: '输入您的电子邮件', hi: 'अपना ईमेल दर्ज करें' },
  startSurvey: { ru: 'Начать опрос', es: 'Comenzar encuesta', en: 'Start survey', zh: '开始调查', hi: 'सर्वेक्षण शुरू करें' },
  loading: { ru: 'Загрузка данных...', es: 'Cargando datos...', en: 'Loading data...', zh: '加载数据...', hi: 'डेटा लोड हो रहा है...' },
  surveyDone: { ru: 'Опрос завершен!', es: '¡Encuesta completada!', en: 'Survey completed!', zh: '调查完成！', hi: 'सर्वेक्षण पूरा हुआ!' },
  thanks: { ru: 'Спасибо за ваши ответы.', es: 'Gracias por sus respuestas.', en: 'Thank you for your answers.', zh: '感谢您的回答。', hi: 'आपके उत्तरों के लिए धन्यवाद।' },
  backBtn: { ru: '← Назад', es: '← Volver', en: '← Back', zh: '← 返回', hi: '← वापस' },
  nextBtn: { ru: 'Далее', es: 'Siguiente', en: 'Next', zh: '下一步', hi: 'अगला' },
  savingBtn: { ru: 'Сохранение...', es: 'Guardando...', en: 'Saving...', zh: '保存中...', hi: 'सहेजा जा रहा है...' },
  saveError: { ru: 'Не удалось сохранить ответ. Попробуйте еще раз.', es: 'No se pudo guardar. Inténtelo de nuevo.', en: 'Failed to save. Please try again.', zh: '保存失败。请重试。', hi: 'सहेजने में विफल। कृपया पुनः प्रयास करें।' }
};

export const rendererDict = {
  evaluation: {
    ru: 'Оценка',
    es: 'Evaluación',
    en: 'Evaluation',
    zh: '评分',
    hi: 'मूल्यांकन'
  },
  selectMultiple: {
    ru: 'Выберите несколько вариантов',
    es: 'Seleccione varias opciones',
    en: 'Select multiple options',
    zh: '请选择多个选项',
    hi: 'कई विकल्प चुनें'
  },
  // Используем функции для подстановки переменной max_choices
  selectUpTo: {
    ru: (max) => `Можно выбрать до ${max} вариантов`,
    es: (max) => `Puede elegir hasta ${max} opciones`,
    en: (max) => `You can select up to ${max} options`,
    zh: (max) => `最多可选择 ${max} 个选项`,
    hi: (max) => `आप ${max} विकल्पों तक का चयन कर सकते हैं`
  },
  placeholder: {
    ru: 'Напишите ваш ответ здесь...',
    es: 'Escriba su respuesta aquí...',
    en: 'Type your answer here...',
    zh: '在此输入您的答案...',
    hi: 'अपना उत्तर यहाँ लिखें...'
  },
  unknownType: {
    ru: 'Неизвестный тип вопроса',
    es: 'Tipo de pregunta desconocido',
    en: 'Unknown question type',
    zh: '未知的问题类型',
    hi: 'अज्ञात प्रश्न प्रकार'
  }
};