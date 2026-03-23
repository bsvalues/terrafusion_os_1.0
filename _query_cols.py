import pyodbc
conn = pyodbc.connect('DRIVER={SQL Server};SERVER=tcp:127.0.0.1,1433;UID=sa;PWD=TF_Pacs2026!;DATABASE=pacs_oltp;', timeout=30)
cur = conn.cursor()

for table in ['owner', 'property', 'land_detail', 'property_val', 'situs']:
    cur.execute("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{}' ORDER BY ORDINAL_POSITION".format(table))
    cols = [r[0] for r in cur.fetchall()]
    print('--- {} ({} cols) ---'.format(table, len(cols)))
    print(', '.join(cols))
    print()
conn.close()
