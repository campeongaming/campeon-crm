import sqlite3

conn = sqlite3.connect('casino_crm.db')
cursor = conn.cursor()
cursor.execute(
    "ALTER TABLE bonus_templates ADD COLUMN segments JSON DEFAULT '[]'")
conn.commit()
print('✓ Successfully added segments column!')
conn.close()
