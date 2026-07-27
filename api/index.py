import sys
import os

# تعريف المسار للمجلد الرئيسي عشان يشوف app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app