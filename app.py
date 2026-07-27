import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ⚠️ احط رابط الداتابيز بتاعك من Neon بين التنصيص هنا
DATABASE_URL = "postgresql://neondb_owner:npg_ZIjyb1fXe8PL@ep-crimson-tree-axur2mw8.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require"

def get_db_connection():
    # الاتصال بالداتابيز السحابية
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # إنشاء الجدول في السحاب لو مش موجود
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            due_date TEXT
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

# تجهيز الجدول أول ما السيرفر يقوم
init_db()

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks ORDER BY id ASC')
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def add_task():
    data = request.json
    title = data.get('title')
    priority = data.get('priority', 'medium')
    due_date = data.get('due_date', '')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO tasks (title, status, priority, due_date) VALUES (%s, %s, %s, %s) RETURNING id',
        (title, 'todo', priority, due_date)
    )
    new_id = cursor.fetchone()['id']
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'id': new_id,
        'title': title,
        'status': 'todo',
        'priority': priority,
        'due_date': due_date
    }), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE tasks SET status = %s WHERE id = %s', (data.get('status'), task_id))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)