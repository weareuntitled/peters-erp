# GSWIN ERP - Phase 2: CRUD API

## Research

### API Design Patterns
Based on our previous work, we have a solid foundation. For Phase 2, we need to enhance the API with:
1. **Pagination** - Support for skip/limit parameters
2. **Filtering** - Query parameters for filtering by field values
3. **Sorting** - Support for sorting by field names
4. **Validation** - Pydantic validation for all inputs
5. **Error Handling** - Consistent error responses

### Technical Approach
- Use SQLModel's built-in query capabilities for filtering and sorting
- Implement query parameters in FastAPI routes
- Add comprehensive validation using Pydantic models
- Ensure all responses follow consistent structure
- Add proper HTTP status codes

### Performance Considerations
- For large datasets, pagination is essential
- Filtering should use database indexes where possible
- Sorting on large datasets may need optimization
- Consider using database views for complex queries

### TanStack Table Compatibility
TanStack Table expects:
- `data` field with array of records
- `count` field with total record count
- Support for server-side pagination
- Consistent field names

## Plan

### Task 1: Enhanced API Endpoints
Update all router endpoints to support:
- Pagination with `skip` and `limit` parameters
- Filtering with query parameters
- Sorting with `sort` parameter
- Proper error handling and validation

### Task 2: Validation and Error Handling
- Add comprehensive Pydantic validation for all inputs
- Implement consistent error response format
- Add proper HTTP status codes

### Task 3: API Documentation
- Enhance OpenAPI documentation with examples
- Add query parameter descriptions
- Document all error responses

### Task 4: Testing
- Create sample data for testing
- Test all pagination/filtering scenarios
- Verify TanStack Table compatibility

### Task 5: Performance Optimization
- Optimize database queries
- Add indexes where needed
- Implement caching where appropriate

## Implementation

### 1. Enhanced Router Structure

Each router will now support:
```python
# Example for kunden router
@router.get("/", response_model=List[KundeRead])
async def read_kunden(
    skip: int = 0, 
    limit: int = 100,
    sort: str = "name",
    filter_field: str = None,
    session: Session = Depends(get_session)
):
    # Implementation with pagination, filtering, and sorting
```

### 2. Query Parameter Support

Add support for:
- `skip`: Number of records to skip (for pagination)
- `limit`: Maximum number of records to return (for pagination)
- `sort`: Field name to sort by (e.g., "name", "-name" for descending)
- `filter_{field}`: Filter by specific field (e.g., `filter_name=Mustermann`)

### 3. Validation and Error Handling

All endpoints will:
- Validate input parameters
- Return appropriate HTTP status codes
- Provide clear error messages
- Handle database errors gracefully

### 4. TanStack Table Compatibility

API responses will include:
- `data`: Array of records
- `count`: Total number of records (for pagination)
- Consistent field names matching frontend expectations

### 5. API Documentation

Enhanced OpenAPI documentation with:
- Parameter descriptions
- Example responses
- Error code explanations