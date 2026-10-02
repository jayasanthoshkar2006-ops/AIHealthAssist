import os
import io
from datetime import date
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class PDFReportGenerator:
    """
    Generates downloadable PDF Personal Wellness Reports combining user logs,
    workout trends, nutrition summaries, sleep analyses, and AI recommendations.
    """

    @staticmethod
    def generate_report(user_name: str, report_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=colors.HexColor('#0284c7')
        )
        subtitle_style = ParagraphStyle(
            'ReportSubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748b')
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['BodyText'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'DisclaimerStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#94a3b8')
        )

        story = []

        # Header Title
        story.append(Paragraph(f"AI Personal Wellness & Lifestyle Report", title_style))
        story.append(Paragraph(f"Prepared for: <b>{user_name}</b> | Date: {date.today().strftime('%B %d, %Y')}", subtitle_style))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#e2e8f0'), spaceAfter=15))

        # Executive Summary
        story.append(Paragraph("1. Executive Summary & AI Observations", section_heading))
        obs = report_data.get("ai_observations", "Your overall consistency across physical workout sessions and sleep discipline shows steady progress.")
        story.append(Paragraph(f"<b>AI Observation:</b> {obs}", body_style))
        story.append(Spacer(1, 10))

        # Workout Summary
        story.append(Paragraph("2. Workout & Physical Performance Summary", section_heading))
        workouts_completed = report_data.get("workouts_completed", 8)
        avg_form = report_data.get("avg_form_score", 91.5)
        story.append(Paragraph(f"• Total Workouts Completed: <b>{workouts_completed}</b>", body_style))
        story.append(Paragraph(f"• Average Form Score: <b>{avg_form}%</b>", body_style))
        story.append(Spacer(1, 10))

        # Nutrition Summary
        story.append(Paragraph("3. Nutrition & Dietary Consistency", section_heading))
        avg_calories = report_data.get("avg_daily_calories", 2150)
        avg_protein = report_data.get("avg_daily_protein", 78)
        story.append(Paragraph(f"• Estimated Average Daily Intake: <b>{avg_calories} kcal</b>", body_style))
        story.append(Paragraph(f"• Average Daily Protein: <b>{avg_protein} g</b>", body_style))
        story.append(Spacer(1, 10))

        # Sleep & Wellness Summary
        story.append(Paragraph("4. Sleep & Sleep Pattern Analysis", section_heading))
        avg_sleep = report_data.get("avg_sleep_duration", 7.4)
        sleep_consistency = report_data.get("sleep_consistency", "88%")
        story.append(Paragraph(f"• Average Sleep Duration: <b>{avg_sleep} hrs</b>", body_style))
        story.append(Paragraph(f"• Sleep Timing Consistency: <b>{sleep_consistency}</b>", body_style))
        story.append(Spacer(1, 15))

        # Table of Goals & Habits
        story.append(Paragraph("5. Goal Progress & Streak Achievements", section_heading))
        table_data = [
            ["Metric / Category", "Current Status", "Target / Milestone"],
            ["Workout Consistency", f"{workouts_completed} sessions", "12 sessions / month"],
            ["Form Quality Score", f"{avg_form}%", "> 85% Form Accuracy"],
            ["Sleep Routine", f"{avg_sleep} hrs/night", "7.5 hrs target"]
        ]
        t = Table(table_data, colWidths=[200, 150, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#0f172a')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # Recommended Focus
        story.append(Paragraph("6. Next Suggested Focus", section_heading))
        focus = report_data.get("next_suggested_focus", "Focus on maintaining hydration during afternoon work hours and increasing post-workout protein intake.")
        story.append(Paragraph(f"• {focus}", body_style))
        story.append(Spacer(1, 25))

        # Disclaimer
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceAfter=10))
        story.append(Paragraph("<b>Medical Disclaimer:</b> This report is generated by an AI Personal Health & Wellness Assistant for lifestyle organization, tracking, and educational purposes. It is not a clinical assessment, medical diagnosis, or prescription.", disclaimer_style))

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
