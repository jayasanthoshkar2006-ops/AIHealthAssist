import io
import json
from datetime import date, datetime
from typing import Any, Dict
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    KeepTogether, PageBreak
)


class PDFReportGenerator:
    """Generate a multi-section personal health and wellness record export."""

    @staticmethod
    def _text(value: Any) -> str:
        if value is None or value == "":
            return "Not recorded"
        if isinstance(value, list):
            value = ", ".join(str(item) for item in value) if value else "None recorded"
        elif isinstance(value, dict):
            value = json.dumps(value, ensure_ascii=False, default=str)
        elif isinstance(value, (date, datetime)):
            value = value.strftime("%Y-%m-%d %H:%M") if isinstance(value, datetime) else value.isoformat()
        return escape(str(value)).replace("\n", "<br/>")

    @classmethod
    def _section(cls, story, title, rows, styles):
        story.append(Paragraph(escape(title), styles["SectionHeading"]))
        if not rows:
            story.append(Paragraph("No records available.", styles["Body"]))
            story.append(Spacer(1, 6))
            return
        table_data = [[Paragraph("<b>Field</b>", styles["Cell"]), Paragraph("<b>Recorded information</b>", styles["Cell"])]]
        for label, value in rows:
            table_data.append([Paragraph(cls._text(label), styles["Cell"]), Paragraph(cls._text(value), styles["Cell"])])
        table = Table(table_data, colWidths=[1.75 * inch, 4.9 * inch], repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2f8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#12304a")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d5dee7")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(table)
        story.append(Spacer(1, 8))

    @classmethod
    def _schedule_table(cls, story, title, headers, rows, widths, styles):
        story.append(Paragraph(escape(title), styles["SectionHeading"]))
        if not rows:
            story.append(Paragraph("No records available.", styles["Body"]))
            story.append(Spacer(1, 6))
            return
        data = [[Paragraph("<b>" + cls._text(h) + "</b>", styles["SmallCell"]) for h in headers]]
        for row in rows:
            data.append([Paragraph(cls._text(v), styles["SmallCell"]) for v in row])
        table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2f8")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#12304a")),
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d5dee7")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(table)
        story.append(Spacer(1, 7))

    @classmethod
    def _daily_plans(cls, story, plans_data, styles):
        story.append(Paragraph("14. Schedule & Daily Plans", styles["SectionHeading"]))
        schedules = plans_data.get("schedules", []) if isinstance(plans_data, dict) else []
        daily_plans = plans_data.get("daily_plans", []) if isinstance(plans_data, dict) else []

        schedule_rows = []
        for item in schedules:
            schedule_rows.append([
                item.get("date", "Not recorded"), item.get("wake_time", "Not recorded"),
                item.get("sleep_time", "Not recorded"), item.get("work_start", "Not recorded"),
                item.get("work_end", "Not recorded"),
            ])
        cls._schedule_table(
            story, "Saved daily schedule settings",
            ["Date", "Wake time", "Sleep time", "Work starts", "Work ends"],
            schedule_rows, [1.25*inch, 1.05*inch, 1.05*inch, 1.05*inch, 1.05*inch], styles
        )

        if not daily_plans:
            story.append(Paragraph("No daily plans available.", styles["Body"]))
            return

        for plan in daily_plans:
            plan_date = plan.get("date", "Date not recorded")
            story.append(Paragraph("Daily plan — " + cls._text(plan_date), styles["SubHeading"]))
            timeline = plan.get("timeline") or []
            if isinstance(timeline, str):
                try:
                    timeline = json.loads(timeline)
                except (ValueError, TypeError):
                    timeline = []
            rows = []
            if isinstance(timeline, list):
                for event in timeline:
                    if not isinstance(event, dict):
                        continue
                    rows.append([
                        event.get("time", "Not recorded"),
                        event.get("activity", "Activity not recorded"),
                        event.get("category", "Not recorded"),
                        (str(event.get("duration_minutes")) + " min") if event.get("duration_minutes") is not None else "Not recorded",
                    ])
            cls._schedule_table(
                story, "Planned activities (not proof of completion)",
                ["Time", "Activity", "Category", "Duration"],
                rows, [0.72*inch, 3.15*inch, 1.05*inch, 0.78*inch], styles
            )
            recommendations = plan.get("recommendations") or []
            if isinstance(recommendations, str):
                try:
                    recommendations = json.loads(recommendations)
                except (ValueError, TypeError):
                    recommendations = [recommendations]
            story.append(Paragraph("<b>Recommendations</b>", styles["Body"]))
            if recommendations:
                for recommendation in recommendations:
                    story.append(Paragraph("• " + cls._text(recommendation), styles["Body"]))
            else:
                story.append(Paragraph("No recommendations recorded.", styles["Body"]))
            story.append(Spacer(1, 3))
            story.append(Paragraph("<b>AI insights</b>", styles["Body"]))
            story.append(Paragraph(cls._text(plan.get("ai_insights")), styles["Body"]))
            story.append(Spacer(1, 8))

    @classmethod
    def generate_report(cls, user_name: str, report_data: Dict[str, Any]) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=letter, rightMargin=0.65 * inch, leftMargin=0.65 * inch,
            topMargin=0.62 * inch, bottomMargin=0.62 * inch,
            title="Personal Health and Wellness Report", author="HealthAssist AI",
        )
        base = getSampleStyleSheet()
        styles = {
            "Title": ParagraphStyle("HealthReportTitle", parent=base["Title"], fontName="Helvetica-Bold",
                fontSize=21, leading=25, alignment=TA_CENTER, textColor=colors.HexColor("#075985"), spaceAfter=8),
            "Subtitle": ParagraphStyle("HealthReportSubtitle", parent=base["Normal"], fontSize=9,
                leading=13, alignment=TA_CENTER, textColor=colors.HexColor("#526579")),
            "SectionHeading": ParagraphStyle("HealthReportSection", parent=base["Heading2"], fontName="Helvetica-Bold",
                fontSize=12, leading=15, textColor=colors.HexColor("#075985"), spaceBefore=12, spaceAfter=5),
            "SubHeading": ParagraphStyle("HealthReportSubHeading", parent=base["Heading3"], fontName="Helvetica-Bold",
                fontSize=10, leading=13, textColor=colors.HexColor("#164e63"), spaceBefore=7, spaceAfter=4),
            "Body": ParagraphStyle("HealthReportBody", parent=base["BodyText"], fontSize=9, leading=13,
                textColor=colors.HexColor("#263746")),
            "Cell": ParagraphStyle("HealthReportCell", parent=base["BodyText"], fontSize=8, leading=10,
                textColor=colors.HexColor("#263746"), wordWrap="CJK"),
            "SmallCell": ParagraphStyle("HealthReportSmallCell", parent=base["BodyText"], fontSize=7.5, leading=9.5,
                textColor=colors.HexColor("#263746"), wordWrap="CJK"),
            "Disclaimer": ParagraphStyle("HealthReportDisclaimer", parent=base["Normal"], fontSize=8,
                leading=11, textColor=colors.HexColor("#526579")),
        }
        story = [
            Spacer(1, 5),
            Paragraph("PERSONAL HEALTH & WELLNESS REPORT", styles["Title"]),
            Paragraph("Prepared for: <b>" + cls._text(user_name) + "</b> &nbsp; | &nbsp; Generated: " + date.today().strftime("%B %d, %Y"), styles["Subtitle"]),
            Paragraph("Confidential personal record — share only with people you trust.", styles["Subtitle"]),
            Spacer(1, 12),
            HRFlowable(width="100%", thickness=1.2, color=colors.HexColor("#0e7490"), spaceAfter=8),
        ]
        profile = report_data.get("profile", {})
        bmi = report_data.get("bmi")
        profile_rows = [
            ("Account email", report_data.get("email")), ("Age", profile.get("age")),
            ("Gender", profile.get("gender")), ("Height (cm)", profile.get("height")),
            ("Weight (kg)", profile.get("weight")),
            ("BMI (calculated from recorded height/weight)", bmi if bmi is not None else "Not available — height/weight missing or invalid"),
            ("Profession", profile.get("profession")), ("Fitness level", profile.get("fitness_level")),
            ("Food preference", profile.get("food_preference")), ("Reported allergies", profile.get("allergies")),
            ("Usual sleep target (hours)", profile.get("normal_sleep_hours")),
            ("Stress rating (self-reported)", profile.get("stress_rating")), ("Profile last updated", profile.get("updated_at")),
        ]
        cls._section(story, "1. Patient Profile & Personal Context", profile_rows, styles)
        overview = report_data.get("overview", {})
        cls._section(story, "2. Record Overview", [
            ("Health records", overview.get("health_records", 0)), ("Workout sessions", overview.get("workouts", 0)),
            ("Nutrition logs", overview.get("nutrition_logs", 0)), ("Sleep logs", overview.get("sleep_records", 0)),
            ("Journal entries", overview.get("journal_entries", 0)), ("Medication entries", overview.get("medications", 0)),
            ("Appointments", overview.get("appointments", 0)), ("Goals", overview.get("goals", 0)),
        ], styles)
        cls._section(story, "3. Medical Records, Vitals & Uploaded/Entered Results", report_data.get("health_records", []), styles)
        cls._section(story, "4. Workout & Exercise History", report_data.get("workouts", []), styles)
        cls._section(story, "5. Personal Bests & Exercise Records", report_data.get("exercise_records", []), styles)
        cls._section(story, "6. Nutrition & Food Logs", report_data.get("nutrition_logs", []), styles)
        cls._section(story, "7. Sleep History", report_data.get("sleep_records", []), styles)
        cls._section(story, "8. Medications & Reminders", report_data.get("medications", []), styles)
        cls._section(story, "9. Appointments & Visit Notes", report_data.get("appointments", []), styles)
        cls._section(story, "10. Wellness Journal & Self-Reported Mood", report_data.get("journal_entries", []), styles)
        cls._section(story, "11. Habits & Daily Activity", report_data.get("habits", []), styles)
        cls._section(story, "12. Goals & Progress", report_data.get("goals", []), styles)
        cls._section(story, "13. Sleep/Workout/Habit Streaks & Achievements", report_data.get("streaks_achievements", []), styles)
        cls._daily_plans(story, report_data.get("plans", {}), styles)
        cls._section(story, "15. Lifestyle & Environment Preferences", report_data.get("preferences", []), styles)
        story.append(Paragraph("AI-generated summary", styles["SectionHeading"]))
        story.append(Paragraph(cls._text(report_data.get("ai_observations") or
            "This report organizes records available in the application. No diagnosis or clinical interpretation has been generated."), styles["Body"]))
        story.append(Spacer(1, 12))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceAfter=8))
        story.append(Paragraph(
            "<b>Medical disclaimer:</b> This report compiles information recorded in HealthAssist AI and may contain incomplete or user-entered data. "
            "It is not a medical diagnosis, clinical assessment, prescription, or emergency service. Values and summaries are not independently verified. "
            "Please ask a qualified healthcare professional to interpret medical measurements and test results. In an emergency, contact local emergency services.",
            styles["Disclaimer"]))
        story.append(Spacer(1, 5))
        story.append(Paragraph("Data source: authenticated user's HealthAssist AI cloud records at report generation time. Missing values are shown as not recorded.", styles["Disclaimer"]))
        doc.build(story)
        result = buffer.getvalue()
        buffer.close()
        return result
