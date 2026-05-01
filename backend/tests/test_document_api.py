"""Integration tests: document creation API (behavior via public interface)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_session
from sqlmodel import Session, create_engine

TEST_DB = "sqlite:///data/gswin_modern.db"
engine = create_engine(TEST_DB)


def _get_test_session():
    with Session(engine) as sess:
        yield sess


app.dependency_overrides[get_session] = _get_test_session


@pytest.fixture
def client():
    return TestClient(app)


_POS_NR = 100000


def _payload(typ="AN", override=None):
    global _POS_NR
    _POS_NR += 1
    p = {
        "typ": typ,
        "kunde_id": 1,
        "datum": "2026-04-30",
        "betrag_netto": 200.0,
        "betrag_brutto": 238.0,
        "positionen": [
            {
                "position_nr": _POS_NR,
                "bezeichnung": "Montagearbeiten",
                "menge": 2.0,
                "einheit": "Std",
                "einzelpreis": 100.0,
                "gesamtpreis": 200.0,
            }
        ],
    }
    if override:
        p.update(override)
    return p


# --- Tracer bullet: basic document creation with positions ---

def test_create_document_with_positions_succeeds(client):
    """User can create a document with positions through the public API."""
    response = client.post("/api/dokumente/", json=_payload())
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["typ"] == "AN"
    assert data["dokument_nr"] is not None
    assert data["id"] is not None


# --- Bug 2 regression: missing gesamtpreis ---

def test_create_document_accepts_position_without_gesamtpreis(client):
    """Missing gesamtpreis should default to 0.0, not 422."""
    p = _payload(typ="RE")
    del p["positionen"][0]["gesamtpreis"]
    response = client.post("/api/dokumente/", json=p)
    assert response.status_code == 200, response.text


# --- Bug 1 regression: trailing slash now in frontend ---

def test_post_dokumente_with_correct_slash_works(client):
    """POST /api/dokumente/ returns 200, not a CORS-blocked redirect."""
    response = client.post("/api/dokumente/", json=_payload(typ="RE"))
    assert response.status_code == 200, response.text


# --- Integration: multiple positions ---

def test_create_rechnung_with_multiple_positions(client):
    """User can create a Rechnung with several line items."""
    global _POS_NR
    pos1 = _POS_NR + 1
    pos2 = _POS_NR + 2
    _POS_NR = pos2
    p = {
        "typ": "RE",
        "kunde_id": 1,
        "datum": "2026-04-30",
        "betrag_netto": 550.0,
        "betrag_brutto": 654.50,
        "positionen": [
            {
                "position_nr": pos1,
                "bezeichnung": "Arbeitszeit",
                "menge": 5.0,
                "einheit": "Std",
                "einzelpreis": 80.0,
                "gesamtpreis": 400.0,
            },
            {
                "position_nr": pos2,
                "bezeichnung": "Material Blech",
                "menge": 3.0,
                "einheit": "m",
                "einzelpreis": 50.0,
                "gesamtpreis": 150.0,
            },
        ],
    }
    response = client.post("/api/dokumente/", json=p)
    assert response.status_code == 200, response.text
    assert response.json()["betrag_netto"] == 550.0


# --- Integration: retrievable after creation ---

def test_created_document_is_retrievable(client):
    """A new document can be fetched via GET."""
    post_resp = client.post("/api/dokumente/", json=_payload())
    assert post_resp.status_code == 200
    doc_id = post_resp.json()["id"]
    get_resp = client.get(f"/api/dokumente/{doc_id}")
    assert get_resp.status_code == 200


# --- Integration: PDF export ---

def test_generated_document_has_pdf_endpoint(client):
    """Created document exposes /pdf with application/pdf response."""
    try:
        from weasyprint import HTML as _wh
    except (ImportError, OSError):
        pytest.skip("WeasyPrint not available")
    post_resp = client.post("/api/dokumente/", json=_payload(typ="RE"))
    assert post_resp.status_code == 200
    doc_id = post_resp.json()["id"]
    pdf_resp = client.get(f"/api/dokumente/{doc_id}/pdf")
    assert pdf_resp.status_code == 200
    assert "application/pdf" in pdf_resp.headers.get("content-type", "")


# --- Edge: missing required field ---

def test_create_document_without_typ_rejected(client):
    """Omitting 'typ' returns 422."""
    p = _payload()
    del p["typ"]
    response = client.post("/api/dokumente/", json=p)
    assert response.status_code == 422
