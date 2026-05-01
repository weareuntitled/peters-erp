# GSWIN ERP - Phase 3: Business Logic

## Goal
Implement core business logic for the GSWIN ERP system including:
1. Document duplication (AN→RE) with `vorgaenger_id` tracking
2. Auto-recalculation of totals from positions
3. Nummernkreise auto-increment on document creation

## Status
- [x] Phase 1 complete (Infrastructure & Auth)
- [x] Phase 2 complete (CRUD API)
- [ ] Phase 3 in progress

## Key Requirements
1. Document duplication functionality for creating new documents from existing ones
2. Automatic recalculation of document totals when positions change
3. Proper numbering system (nummernkreise) for document numbering
4. Maintain data integrity during all business logic operations

## Implementation Approach
- Create business logic functions in the backend
- Implement proper error handling and validation
- Ensure all operations maintain data consistency
- Add appropriate logging for debugging and monitoring

## Tasks
1. Implement document duplication logic with `vorgaenger_id` tracking
2. Add auto-recalculation of document totals from position data
3. Implement nummernkreise auto-increment functionality
4. Add proper testing for business logic operations
5. Integrate with existing API endpoints

## Notes
- Document duplication should preserve all relevant data except for document-specific fields
- Auto-recalculation should be triggered on position creation, update, or deletion
- Nummernkreise should be managed at the document level with proper locking
- All business logic should be transactional to maintain data integrity