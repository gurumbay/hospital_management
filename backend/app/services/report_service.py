"""Report generation service for PDF exports."""

from io import BytesIO
from datetime import datetime
from typing import List, Tuple
import logging
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy.orm import Session

from app.repositories.ward_repository import WardRepository
from app.repositories.patient_repository import PatientRepository
from app.repositories.diagnosis_repository import DiagnosisRepository

logger = logging.getLogger(__name__)

# Try to locate and register a TTF font that supports Cyrillic (common candidates)
_REGISTERED_FONT_NAME = None
_CANDIDATE_FONTS = [
    # Common Linux
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    # Windows
    'C:/Windows/Fonts/arial.ttf',
    'C:/Windows/Fonts/ARIAL.TTF',
    'C:/Windows/Fonts/tahoma.ttf',
    # fallback locations
    '/usr/local/share/fonts/DejaVuSans.ttf',
]

for font_path in _CANDIDATE_FONTS:
    try:
        if os.path.exists(font_path):
            font_name = os.path.splitext(os.path.basename(font_path))[0]
            pdfmetrics.registerFont(TTFont(font_name, font_path))
            _REGISTERED_FONT_NAME = font_name
            logger.info(f"Registered TTF font '{font_name}' from {font_path}")
            break
    except Exception:
        logger.exception(f"Failed to register font at {font_path}")

if not _REGISTERED_FONT_NAME:
    # Last resort: try to register a bare 'DejaVuSans' if available in environment
    try:
        pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
        _REGISTERED_FONT_NAME = 'DejaVuSans'
        logger.info("Registered DejaVuSans from working directory")
    except Exception:
        logger.warning('No TTF font registered; PDFs may not render Cyrillic correctly')


class ReportService:
    """Service for generating PDF reports."""
    
    def __init__(self, db: Session):
        self.db = db
        self.ward_repo = WardRepository(db)
        self.patient_repo = PatientRepository(db)
        self.diagnosis_repo = DiagnosisRepository(db)
    
    def generate_occupancy_report(self) -> BytesIO:
        """Generate ward occupancy report as PDF.
        
        Returns:
            BytesIO object containing the PDF file
        """
        try:
            # Fetch data
            wards = self.ward_repo.get_multi(skip=0, limit=1000)
            logger.info(f"Generating occupancy report for {len(wards)} wards")
            
            # Create PDF
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(
                pdf_buffer,
                pagesize=letter,
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch,
            )
            
            # Styles
            styles = getSampleStyleSheet()
            # Use registered TTF font if available (ensures Cyrillic support)
            font_for_pdf = _REGISTERED_FONT_NAME or styles['Normal'].fontName

            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontName=font_for_pdf,
                fontSize=24,
                textColor=colors.HexColor('#1976d2'),
                spaceAfter=30,
                alignment=1,  # Center
            )
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontName=font_for_pdf,
                fontSize=14,
                textColor=colors.HexColor('#424242'),
                spaceAfter=12,
            )
            
            # Build story
            story = []
            
            # Title
            story.append(Paragraph("Ward Occupancy Report", title_style))
            story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
            
            # Calculate totals
            total_capacity = sum(w.max_capacity for w in wards)
            total_occupancy = sum(w.current_occupancy or 0 for w in wards)
            total_percent = (total_occupancy / total_capacity * 100) if total_capacity > 0 else 0
            
            # Summary section
            story.append(Paragraph("Summary", heading_style))
            summary_data = [
                ['Metric', 'Value'],
                ['Total Wards', str(len(wards))],
                ['Total Capacity', str(total_capacity)],
                ['Total Occupancy', str(total_occupancy)],
                ['Overall Occupancy %', f'{total_percent:.1f}%'],
            ]
            summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), font_for_pdf),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, 1), (-1, -1), font_for_pdf),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Ward details section
            story.append(Paragraph("Ward Details", heading_style))
            ward_data = [['Ward Name', 'Capacity', 'Occupancy', 'Available', 'Occupancy %']]
            
            for ward in sorted(wards, key=lambda w: w.name or ''):
                occupancy_pct = (ward.current_occupancy or 0) / ward.max_capacity * 100 if ward.max_capacity > 0 else 0
                ward_data.append([
                    ward.name or '-',
                    str(ward.max_capacity),
                    str(ward.current_occupancy or 0),
                    str(ward.max_capacity - (ward.current_occupancy or 0)),
                    f'{occupancy_pct:.1f}%',
                ])
            
            ward_table = Table(ward_data, colWidths=[1.8*inch, 1*inch, 1*inch, 1*inch, 1.2*inch])
            ward_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), font_for_pdf),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), font_for_pdf),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            story.append(ward_table)
            
            # Build PDF
            logger.info("Building PDF document")
            doc.build(story)
            pdf_buffer.seek(0)
            
            logger.info(f"PDF generated successfully, size: {len(pdf_buffer.getvalue())} bytes")
            return pdf_buffer
        except Exception as e:
            logger.error(f"Error generating occupancy report: {str(e)}", exc_info=True)
            raise
    
    def generate_diagnosis_stats_report(self) -> BytesIO:
        """Generate diagnosis statistics report as PDF.
        
        Returns:
            BytesIO object containing the PDF file
        """
        try:
            # Fetch data
            diagnoses = self.diagnosis_repo.get_multi(skip=0, limit=1000)
            patients = self.patient_repo.get_multi(skip=0, limit=10000)
            logger.info(f"Generating diagnosis stats report for {len(diagnoses)} diagnoses and {len(patients)} patients")
            
            # Calculate statistics
            diagnosis_counts = {}
            for patient in patients:
                diag_id = patient.diagnosis_id
                diagnosis_counts[diag_id] = diagnosis_counts.get(diag_id, 0) + 1
            
            total_patients = len(patients)
            
            # Create PDF
            pdf_buffer = BytesIO()
            doc = SimpleDocTemplate(
                pdf_buffer,
                pagesize=letter,
                rightMargin=0.5*inch,
                leftMargin=0.5*inch,
                topMargin=0.75*inch,
                bottomMargin=0.75*inch,
            )
            
            # Styles
            styles = getSampleStyleSheet()
            # Use registered TTF font if available (ensures Cyrillic support)
            font_for_pdf = _REGISTERED_FONT_NAME or styles['Normal'].fontName

            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontName=font_for_pdf,
                fontSize=24,
                textColor=colors.HexColor('#1976d2'),
                spaceAfter=30,
                alignment=1,  # Center
            )
            heading_style = ParagraphStyle(
                'CustomHeading',
                parent=styles['Heading2'],
                fontName=font_for_pdf,
                fontSize=14,
                textColor=colors.HexColor('#424242'),
                spaceAfter=12,
            )
            
            # Build story
            story = []
            
            # Title
            story.append(Paragraph("Diagnosis Statistics Report", title_style))
            story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Spacer(1, 0.3*inch))
            
            # Summary section
            story.append(Paragraph("Summary", heading_style))
            summary_data = [
                ['Metric', 'Value'],
                ['Total Diagnoses', str(len(diagnoses))],
                ['Total Patients', str(total_patients)],
                ['Average per Diagnosis', f'{total_patients / len(diagnoses):.1f}' if diagnoses else '0'],
            ]
            summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), font_for_pdf),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTNAME', (0, 1), (-1, -1), font_for_pdf),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            story.append(summary_table)
            story.append(Spacer(1, 0.3*inch))
            
            # Diagnosis statistics section
            story.append(Paragraph("Diagnosis Distribution", heading_style))
            stats_data = [['Diagnosis', 'Patient Count', 'Percentage']]
            
            # Sort by patient count descending
            sorted_diagnoses = sorted(
                diagnoses,
                key=lambda d: diagnosis_counts.get(d.id, 0),
                reverse=True
            )
            
            for diagnosis in sorted_diagnoses:
                count = diagnosis_counts.get(diagnosis.id, 0)
                percentage = (count / total_patients * 100) if total_patients > 0 else 0
                stats_data.append([
                    diagnosis.name or '-',
                    str(count),
                    f'{percentage:.1f}%',
                ])
            
            stats_table = Table(stats_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), font_for_pdf),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), font_for_pdf),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ]))
            story.append(stats_table)
            
            # Build PDF
            logger.info("Building PDF document for diagnosis stats")
            doc.build(story)
            pdf_buffer.seek(0)
            
            logger.info(f"Diagnosis stats PDF generated successfully, size: {len(pdf_buffer.getvalue())} bytes")
            return pdf_buffer
        except Exception as e:
            logger.error(f"Error generating diagnosis stats report: {str(e)}", exc_info=True)
            raise
