# Test script to verify the GSWIN ERP backend structure

import os
import sys

def check_backend_structure():
    """Verify that all required files exist for Phase 2 implementation"""
    
    # Define expected files
    expected_files = [
        "backend/app/main.py",
        "backend/app/database.py",
        "backend/app/auth/router.py",
        "backend/app/auth/models.py",
        "backend/app/models/query_params.py",
        "backend/app/models/responses.py",
        "backend/app/models/kunden.py",
        "backend/app/models/artikel.py",
        "backend/app/models/dokumente.py",
        "backend/app/models/zahlungen.py",
        "backend/app/routers/kunden.py",
        "backend/app/routers/artikel.py",
        "backend/app/routers/dokumente.py",
        "backend/app/routers/zahlungen.py",
        "backend/requirements.txt",
        ".planning/phase-2/CONTEXT.md",
        ".planning/phase-2/RESEARCH.md",
        ".planning/phase-2/PLAN.md",
        ".planning/phase-2/IMPLEMENTATION.md",
        ".planning/phase-2/MODELS.md",
        ".planning/phase-2/SUMMARY.md"
    ]
    
    missing_files = []
    for file_path in expected_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("Missing files:")
        for f in missing_files:
            print(f"  - {f}")
        return False
    else:
        print("All required files are present for Phase 2 implementation!")
        return True

if __name__ == "__main__":
    success = check_backend_structure()
    sys.exit(0 if success else 1)