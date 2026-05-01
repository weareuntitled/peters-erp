import sys
sys.path.insert(0, '/app')
from app.services.pdf_service import pdf_service

flat = pdf_service.flatten_template('angebot.html')
print(f'flattened angebot.html: {len(flat) if flat else "FAIL"} chars')
if flat:
    print('First 200 chars:', flat[:200])

flat2 = pdf_service.flatten_template('rechnung.html')
print(f'flattened rechnung.html: {len(flat2) if flat2 else "FAIL"} chars')
