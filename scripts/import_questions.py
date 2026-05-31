import json
import os
from supabase import create_client, Client

# Рекомендуется задавать ключи через переменные окружения, 
# но для разового локального скрипта можно вписать их напрямую (не коммитьте это в GitHub!)
SUPABASE_URL = os.environ.get("SUPABASE_URL", "ВАШ_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "ВАШ_SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def import_questions():
    # Читаем JSON файл
    try:
        with open('schema_questions_.json', 'r', encoding='utf-8') as file:
            schema_data = json.load(file)
    except FileNotFoundError:
        print("Ошибка: Файл schema_questions_.json не найден.")
        return

    questions_to_insert = []

    # Парсим структуру
    for key, section in schema_data.items():
        methodology = section.get('methodology', key)
        questions = section.get('questions', [])
        
        for q in questions:
            questions_to_insert.append({
                "id": q.get('question_id'),
                "methodology": methodology,
                "question_type": q.get('type'),
                "data": q
            })

    if not questions_to_insert:
        print("Нет данных для импорта.")
        return

    # Отправляем в Supabase
    try:
        # upsert обновит запись, если вопрос с таким id уже существует
        response = supabase.table('questions').upsert(questions_to_insert).execute()
        print(f"Успешно импортировано вопросов: {len(questions_to_insert)}")
    except Exception as e:
        print(f"Ошибка при импорте в Supabase: {e}")

if __name__ == "__main__":
    import_questions()