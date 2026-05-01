from typing import Optional
from pydantic import BaseModel

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 100

class SortParams(BaseModel):
    sort: Optional[str] = None

class FilterParams(BaseModel):
    # Will be extended with dynamic filters
    pass