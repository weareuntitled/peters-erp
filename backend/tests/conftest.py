"""Pytest fixtures for GSWIN tests."""

import pytest
from sqlmodel import Session, SQLModel, create_engine
from app.database import get_session


@pytest.fixture
def session():
    """Create a test session using the test database."""
    engine = create_engine("sqlite:///data/gswin_modern.db")
    with Session(engine) as sess:
        yield sess


@pytest.fixture
def test_session():
    """Create a fresh session for each test."""
    engine = create_engine("sqlite:///data/gswin_modern.db")
    with Session(engine) as sess:
        yield sess
        sess.rollback()