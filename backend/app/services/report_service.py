from __future__ import annotations

from io import BytesIO
from datetime import datetime
from typing import Iterable, List
import logging
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy.orm import Session

from app.repositories.ward_repository import WardRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.diagnosis_repository import DiagnosisRepository

logger = logging.getLogger(__name__)

# Deterministic bundled font path (project assets)
_FONT_DIR = Path(__file__).resolve().parents[1] / "assets" / "fonts"

_FONT_PRIORITY_LIST = [
    _FONT_DIR / "NotoSans-Regular.ttf",
    
    # Системные шрифты
    Path("/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"),
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"),
]


def _register_font_if_exists(path: Path) -> str | None:
    """Register TTF at `path` and return the registered font name, or None."""
    try:
        if path.exists():
            name = path.stem
            if name not in pdfmetrics.getRegisteredFontNames():
                pdfmetrics.registerFont(TTFont(name, str(path)))
            logger.info("Registered font %s from %s", name, path)
            return name
    except Exception:
        logger.exception("Failed to register font at %s", path)
    return None


def ensure_font_registered() -> str:
    """Ensure a Cyrillic-capable font is registered and return its name.

    Checks the bundled path first, then common system locations. Falls back to
    the default stylesheet font name if nothing found.
    """
    for p in _FONT_PRIORITY_LIST:
        name = _register_font_if_exists(p)
        if name:
            return name

    # Nothing found; return a reasonable default
    try:
        return getSampleStyleSheet()["Normal"].fontName
    except Exception:
        return "Helvetica"


def _to_str_row(row: Iterable[object]) -> List[str]:
    """Convert row values to strings, using '-' for None."""
    return [str(x) if x is not None else "-" for x in row]


class ReportService:
    """Service for generating PDF reports.

    Instantiate with a SQLAlchemy `Session`. Methods return a `BytesIO`
    buffer that contains the PDF.
    """

    def __init__(self, db: Session):
        self.db = db
        self.ward_repo = WardRepository(db)
        self.patient_repo = PatientRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
        self.font_name = ensure_font_registered()
        print(f"Registered fonts: {pdfmetrics.getRegisteredFontNames()}")


    def _build_pdf(self, title: str, sections: List[tuple[str, List[List[str]]]]) -> BytesIO:
        """Build a PDF with given title and sections.

        `sections` is a list of tuples (heading, table_rows).
        """
        buf = BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=letter,
            rightMargin=0.5 * inch,
            leftMargin=0.5 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "Title",
            parent=styles["Heading1"],
            fontName=self.font_name,
            fontSize=20,
            textColor=colors.HexColor("#1976d2"),
            alignment=1,
        )
        heading_style = ParagraphStyle(
            "Heading",
            parent=styles["Heading2"],
            fontName=self.font_name,
            fontSize=12,
            textColor=colors.HexColor("#424242"),
        )

        story: List[object] = [Paragraph(title, title_style), Paragraph(f"Generated: {datetime.now():%Y-%m-%d %H:%M:%S}", styles["Normal"]), Spacer(1, 0.2 * inch)]

        for heading, table_rows in sections:
            story.append(Paragraph(heading, heading_style))
            # ensure rows are stringified
            rows = [_to_str_row(r) for r in table_rows]
            # simple column width heuristic
            col_count = max((len(r) for r in rows), default=1)
            col_widths = [doc.width / col_count] * col_count
            tbl = Table(rows, colWidths=col_widths)
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1976d2")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, -1), self.font_name),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
            ]))
            story.append(tbl)
            story.append(Spacer(1, 0.2 * inch))

        try:
            doc.build(story)
            buf.seek(0)
            logger.info("PDF %s generated, size=%d bytes", title, len(buf.getvalue()))
            return buf
        except Exception:
            logger.exception("Failed to build PDF %s", title)
            raise

    def generate_occupancy_report(self) -> BytesIO:
        wards = self.ward_repo.get_multi(skip=0, limit=1000)
        total_capacity = sum(w.max_capacity for w in wards)
        total_occupancy = sum(w.current_occupancy or 0 for w in wards)
        total_percent = (total_occupancy / total_capacity * 100) if total_capacity else 0

        summary = [
            ["Metric", "Value"],
            ["Total Wards", str(len(wards))],
            ["Total Capacity", str(total_capacity)],
            ["Total Occupancy", str(total_occupancy)],
            ["Overall Occupancy %", f"{total_percent:.1f}%"],
        ]

        ward_rows = [["Ward Name", "Capacity", "Occupancy", "Available", "Occupancy %"]]
        for w in sorted(wards, key=lambda x: x.name or ""):
            occ = w.current_occupancy or 0
            cap = w.max_capacity
            pct = (occ / cap * 100) if cap else 0
            ward_rows.append([w.name or "-", str(cap), str(occ), str(cap - occ), f"{pct:.1f}%"])

        return self._build_pdf("Ward Occupancy Report", [("Summary", summary), ("Ward Details", ward_rows)])

    def generate_diagnosis_stats_report(self) -> BytesIO:
        diagnoses = self.diagnosis_repo.get_multi(skip=0, limit=1000)
        patients = self.patient_repo.get_multi(skip=0, limit=10000)

        counts: dict[int | None, int] = {}
        for p in patients:
            counts[p.diagnosis_id] = counts.get(p.diagnosis_id, 0) + 1

        total = len(patients)

        summary = [
            ["Metric", "Value"],
            ["Total Diagnoses", str(len(diagnoses))],
            ["Total Patients", str(total)],
            ["Average per Diagnosis", f"{(total / len(diagnoses)):.1f}" if diagnoses else "0"],
        ]

        stats_rows = [["Diagnosis", "Patient Count", "Percentage"]]
        sorted_diags = sorted(diagnoses, key=lambda d: counts.get(d.id, 0), reverse=True)
        for d in sorted_diags:
            cnt = counts.get(d.id, 0)
            pct = (cnt / total * 100) if total else 0
            stats_rows.append([d.name or "-", str(cnt), f"{pct:.1f}%"])

        return self._build_pdf("Diagnosis Statistics Report", [("Summary", summary), ("Diagnosis Distribution", stats_rows)])