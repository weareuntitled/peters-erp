"""Tests for PDF styling and layout."""

import pytest
import re
from bs4 import BeautifulSoup

def read_css():
    """Helper to read the styles.css file."""
    with open("app/templates/pdf/styles.css", "r", encoding="utf-8") as f:
        return f.read()

def read_html():
    """Helper to read the base.html file."""
    with open("app/templates/pdf/base.html", "r", encoding="utf-8") as f:
        return f.read()

class TestPDFLayout:
    """Test the structure of the PDF template."""

    def test_logo_is_above_absenderzeile(self):
        """GREEN: logo-container and absenderzeile should be in the same header-row."""
        html = read_html()
        
        # Strip all whitespace to make regex matching easier
        stripped_html = re.sub(r'\s+', '', html)
        
        # Verify header-row exists and contains both
        header_row_idx = stripped_html.find('class="header-row"')
        logo_idx = stripped_html.find('class="logo-container"')
        absender_idx = stripped_html.find('class="absenderzeile"')
        dokument_idx = stripped_html.find('class="dokumentenkopf"')
        
        assert header_row_idx > 0
        assert logo_idx > header_row_idx
        assert absender_idx > header_row_idx
        # Verify they are both before the main dokumentenkopf block
        assert logo_idx < dokument_idx
        assert absender_idx < dokument_idx

    def test_payment_terms_styling_discreet(self):
        """RED: payment terms should not be prominent (no backgrounds, normal text)."""
        css = read_css()
        
        # Look for the payment terms block
        match = re.search(r'\.payment-terms\s*{([^}]+)}', css)
        assert match is not None
        rules = match.group(1)
        
        # Should not have background or large borders
        assert "background" not in rules
        assert "border-left" not in rules
        assert "padding:" not in rules or "padding: 0" in rules
        # Should be small font
        assert "font-size: 8pt" in rules or "font-size: var(--text-sm)" in rules

    def test_fusszeile_not_fixed(self):
        """RED: fusszeile should NOT be position: fixed."""
        css = read_css()
        
        match = re.search(r'\.fusszeile\s*{([^}]+)}', css)
        assert match is not None
        rules = match.group(1)
        
        assert "position: fixed" not in rules


class TestPDFStyles:
    """Test colors and visual styles."""

    def test_doc_title_color(self):
        """RED: doc-title should use Peters blue #0071bc."""
        css = read_css()
        
        match = re.search(r'\.doc-title\s*{([^}]+)}', css)
        assert match is not None
        rules = match.group(1)
        
        assert "color: #0071bc" in rules