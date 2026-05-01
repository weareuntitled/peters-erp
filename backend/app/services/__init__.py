try:
    from .pdf_service import PDFService
    from .pdf_data import assemble_pdf_data
except (ImportError, OSError):
    PDFService = None
    assemble_pdf_data = None

try:
    from .formatting import format_currency, format_date, format_document_number, get_document_title
except (ImportError, OSError):
    pass

try:
    from .document_service import DocumentService, document_service
except (ImportError, OSError):
    DocumentService = None
    document_service = None

try:
    from .numbering_service import NumberingService, numbering_service
except (ImportError, OSError):
    NumberingService = None
    numbering_service = None