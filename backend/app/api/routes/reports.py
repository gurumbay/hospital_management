from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/occupancy/pdf")
def export_occupancy_report_pdf(
    db: Session = Depends(get_db),
):
    """Export ward occupancy report as PDF.
    
    Returns:
        PDF file download
    """
    try:
        report_service = ReportService(db)
        pdf_buffer = report_service.generate_occupancy_report()
        
        # Get bytes from buffer
        pdf_bytes = pdf_buffer.getvalue()
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=occupancy_report.pdf"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate occupancy report: {str(e)}"
        )


@router.get("/diagnosis-stats/pdf")
def export_diagnosis_stats_report_pdf(
    db: Session = Depends(get_db),
):
    """Export diagnosis statistics report as PDF.
    
    Returns:
        PDF file download
    """
    try:
        report_service = ReportService(db)
        pdf_buffer = report_service.generate_diagnosis_stats_report()
        
        # Get bytes from buffer
        pdf_bytes = pdf_buffer.getvalue()
        
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=diagnosis_stats_report.pdf"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate diagnosis statistics report: {str(e)}"
        )
