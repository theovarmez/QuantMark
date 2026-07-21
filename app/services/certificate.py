import hashlib
import io
import uuid
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.config import settings


def _compute_document_hash(pdf_bytes: bytes) -> str:
    return hashlib.sha256(pdf_bytes).hexdigest()


async def generate_certificate(
    report_id: uuid.UUID,
    serial_code: str,
    company_name: str,
    description: str,
    evidence_hash: str,
) -> tuple[bytes, str]:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4)
    styles = getSampleStyleSheet()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    elements = []
    elements.append(Paragraph("QuantMark — Certificado de Detección", styles["Title"]))
    elements.append(Spacer(1, 0.5 * cm))

    data = [
        ["Report ID", str(report_id)],
        ["Serial Code", serial_code],
        ["Empresa Propietaria", company_name],
        ["Fecha del Reporte", now],
        ["Descripción", description],
        ["Hash de Evidencia", evidence_hash],
    ]

    table = Table(data, colWidths=[4 * cm, 12 * cm])
    table.setStyle(
        TableStyle([
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, "#cccccc"),
        ])
    )

    elements.append(table)
    elements.append(Spacer(1, 1 * cm))

    disclaimer = (
        "Este certificado es generado automáticamente por QuantMark. "
        "El hash SHA-256 del documento garantiza su integridad. "
        "Cualquier modificación posterior invalidará el hash."
    )
    elements.append(Paragraph(disclaimer, styles["Italic"]))

    doc.build(elements)
    pdf_bytes = buf.getvalue()
    doc_hash = _compute_document_hash(pdf_bytes)
    return pdf_bytes, doc_hash
