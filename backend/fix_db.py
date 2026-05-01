"""Add html_content column to vorlagen table."""
import sys
sys.path.insert(0, '/app')

from sqlmodel import create_engine
from sqlalchemy import text

DATABASE_URL = 'sqlite:///./data/gswin_modern.db'
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE vorlagen ADD COLUMN html_content TEXT"))
    conn.commit()
    print("Column added!")
