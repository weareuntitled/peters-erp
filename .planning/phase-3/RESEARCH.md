# GSWIN ERP - Phase 3: Business Logic

## Research

### Document Duplication (AN→RE)
Based on the project requirements, we need to implement document duplication functionality with `vorgaenger_id` tracking.

**Key Considerations:**
- When duplicating a document (e.g., from AN to RE), we need to track the original document
- The `vorgaenger_id` field should reference the original document
- All other document fields should be copied except for document-specific fields (like document number, date)
- Position data should be duplicated as well
- The new document should be in a "new" state with appropriate status

**Implementation Strategy:**
- Create a duplicate function in the document service
- Handle relationships properly (positions, payments, etc.)
- Ensure proper validation of the duplication process
- Implement transactional operations to maintain data integrity

### Auto-recalculation of Totals
Document totals need to be automatically recalculated based on position data.

**Key Considerations:**
- Totals should be calculated when positions are added, modified, or removed
- Each position should contribute to the overall document total
- The calculation should account for quantity, unit price, and tax rates
- Need to handle both document-level and position-level calculations

**Implementation Strategy:**
- Implement total calculation functions
- Create hooks or triggers to automatically recalculate when positions change
- Ensure calculations are accurate and handle edge cases
- Consider performance implications for large documents

### Nummernkreise Auto-increment
Document numbering should follow nummernkreise (numbering ranges) with auto-increment.

**Key Considerations:**
- Each document type should have its own numbering range
- Auto-increment should be atomic to prevent duplicates
- Need to handle concurrent access properly
- Should support different numbering patterns (e.g., year-based, sequential)

**Implementation Strategy:**
- Create a numbering service with atomic operations
- Implement proper locking mechanisms
- Support different numbering schemes
- Ensure integration with document creation process

## Plan

### Task 1: Document Duplication Implementation
- Create duplicate function for documents
- Implement `vorgaenger_id` tracking
- Handle position data duplication
- Add validation and error handling

### Task 2: Auto-recalculation Logic
- Implement total calculation functions
- Add hooks for position changes
- Ensure accurate calculation of taxes and totals
- Handle edge cases and validation

### Task 3: Nummernkreise Implementation
- Create numbering service with atomic operations
- Implement proper locking for concurrent access
- Support different numbering schemes
- Integrate with document creation flow

### Task 4: Testing and Validation
- Create comprehensive tests for business logic
- Test edge cases and error conditions
- Validate data integrity during operations
- Ensure performance is acceptable

### Task 5: API Integration
- Update document creation endpoints to use nummernkreise
- Add duplication endpoints
- Ensure all business logic is exposed through API
- Add proper error responses

## Implementation Details

### 1. Document Duplication Service

The document duplication service will handle creating new documents from existing ones:

```python
def duplicate_document(original_document_id: int, session: Session) -> Document:
    # Get original document
    original = session.get(Document, original_document_id)
    
    # Create new document with copied fields
    new_document = Document(
        typ=original.typ,
        kunde_id=original.kunde_id,
        datum=datetime.utcnow(),
        # ... copy other fields except document-specific ones
        vorgaenger_id=original_document_id  # Track original
    )
    
    # Add to session and commit
    session.add(new_document)
    session.commit()
    session.refresh(new_document)
    
    # Duplicate positions
    duplicate_positions(original.id, new_document.id, session)
    
    return new_document
```

### 2. Auto-recalculation Service

The total calculation service will handle automatic recalculation:

```python
def recalculate_document_totals(document_id: int, session: Session) -> Document:
    # Get document
    document = session.get(Document, document_id)
    
    # Calculate total from positions
    total = 0
    positions = session.exec(select(Position).where(Position.dokument_id == document_id)).all()
    
    for position in positions:
        position_total = position.menge * position.preis
        total += position_total * (1 + position.mwst / 100)
    
    # Update document total
    document.betrag = total
    session.add(document)
    session.commit()
    session.refresh(document)
    
    return document
```

### 3. Nummernkreise Service

The numbering service will handle document numbering:

```python
def get_next_document_number(document_type: str, session: Session) -> str:
    # Get current number from nummernkreise table
    # This should be atomic to prevent duplicates
    pass
```

## Summary

Phase 3 will implement the core business logic for document duplication, auto-recalculation, and document numbering. This phase builds upon the foundation established in Phase 1 and 2 and will add the essential business functionality that makes this ERP system useful for German handwerker businesses.