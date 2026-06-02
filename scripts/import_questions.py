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

    for key, section in schema_data.items():
        methodology = section.get('methodology', key)
        questions = section.get('questions', [])

        ui_options = section.get('ui_options_reference', None)

        for q in questions:
            q_data = dict(q)

            if ui_options:
                q_data['ui_options_reference'] = ui_options

            questions_to_insert.append({
                "id": q.get('question_id'),
                "methodology": methodology,
                "answer_type": q.get('type'),
                "data": q_data # Теперь тут лежит вопрос ВМЕСТЕ с лейблами
            })

    if not questions_to_insert:
        print("Нет данных для импорта.")
        return

    try:
        response = supabase.table('questions').upsert(questions_to_insert).execute()
        print(f"Успешно импортировано вопросов: {len(questions_to_insert)}")
    except Exception as e:
        print(f"Ошибка при импорте: {e}")

if __name__ == "__main__":
    import_questions()