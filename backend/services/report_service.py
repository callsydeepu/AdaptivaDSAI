import os
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from services.dataset_service import DatasetService
from services.profiling_service import ProfilingService
from services.statistics_service import StatisticsService
from services.eda_service import EDAService
from services.problem_detection_service import ProblemDetectionService
from services.model_recommendation_service import ModelRecommendationService


class ReportService:

    @staticmethod
    def generate_report(dataset_id: str):
        # 1. Load Inputs
        dataset = DatasetService.get_dataset_by_id(dataset_id)
        if dataset is None:
            return None

        eval_path = os.path.join("evaluation_results", f"{dataset_id}.json")
        if not os.path.exists(eval_path):
            raise FileNotFoundError("Evaluation results not found")

        with open(eval_path, "r") as f:
            evaluation = json.load(f)

        profiling = ProfilingService.profile_dataset(dataset_id)
        statistics = StatisticsService.get_statistics(dataset_id)
        eda = EDAService.analyze_dataset(dataset_id)
        problem = ProblemDetectionService.detect_problem(dataset_id)
        recommendation = ModelRecommendationService.recommend_models(dataset_id)

        # 2. Build PDF Layout
        os.makedirs("reports", exist_ok=True)
        report_path = f"reports/{dataset_id}_report.pdf"

        doc = SimpleDocTemplate(
            report_path,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch
        )

        styles = getSampleStyleSheet()

        # Custom paragraph styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#1E3A8A"),
            alignment=1,  # Center
            spaceAfter=25
        )
        h1_style = ParagraphStyle(
            "SectionH1",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#1E3A8A"),
            spaceBefore=14,
            spaceAfter=8,
            keepWithNext=True
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#2563EB"),
            spaceBefore=10,
            spaceAfter=6,
            keepWithNext=True
        )
        body_style = ParagraphStyle(
            "BodyTextCustom",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#374151"),
            spaceAfter=6
        )
        bold_body_style = ParagraphStyle(
            "BoldBodyText",
            parent=body_style,
            fontName="Helvetica-Bold"
        )
        header_text_style = ParagraphStyle(
            "TableHeaderText",
            parent=body_style,
            fontName="Helvetica-Bold",
            textColor=colors.white
        )

        story = []

        # Document Header
        story.append(Paragraph("Adaptive Data Science Assistant (ADSA)", title_style))
        story.append(Paragraph(f"Analysis and Machine Learning Report", ParagraphStyle("SubTitle", parent=title_style, fontSize=14, leading=18, textColor=colors.HexColor("#4B5563"))))
        story.append(Spacer(1, 15))

        # --- Section 1: Dataset Summary ---
        story.append(Paragraph("1. Dataset Summary", h1_style))
        summary_data = [
            [Paragraph("Attribute", bold_body_style), Paragraph("Value", bold_body_style)],
            [Paragraph("Dataset ID", body_style), Paragraph(str(dataset_id), body_style)],
            [Paragraph("Dataset Name", body_style), Paragraph(str(dataset.get("filename", "N/A")), body_style)],
            [Paragraph("Total Rows", body_style), Paragraph(str(dataset.get("rows", "N/A")), body_style)],
            [Paragraph("Total Columns", body_style), Paragraph(str(dataset.get("columns", "N/A")), body_style)],
            [Paragraph("Uploaded At", body_style), Paragraph(str(dataset.get("uploaded_at", "N/A")), body_style)],
        ]
        summary_table = Table(summary_data, colWidths=[2.2 * inch, 4.3 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#E5E7EB")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))

        # --- Section 2: Profiling Summary ---
        if profiling:
            story.append(Paragraph("2. Profiling Summary", h1_style))
            profiling_data = [
                [Paragraph("Metric", bold_body_style), Paragraph("Result", bold_body_style)],
                [Paragraph("Missing Values Count", body_style), Paragraph(str(profiling.get("missing_values", 0)), body_style)],
                [Paragraph("Duplicate Rows Count", body_style), Paragraph(str(profiling.get("duplicate_rows", 0)), body_style)],
                [Paragraph("Numeric Columns", body_style), Paragraph(str(profiling.get("numeric_columns", 0)), body_style)],
                [Paragraph("Categorical Columns", body_style), Paragraph(str(profiling.get("categorical_columns", 0)), body_style)],
            ]
            profiling_table = Table(profiling_data, colWidths=[3.0 * inch, 3.5 * inch])
            profiling_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#E5E7EB")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(profiling_table)
            story.append(Spacer(1, 15))

        # --- Section 3: Statistics Summary ---
        if statistics:
            story.append(Paragraph("3. Statistical Analysis Summary", h1_style))
            stats_rows = [
                [
                    Paragraph("Numeric Feature", header_text_style),
                    Paragraph("Mean", header_text_style),
                    Paragraph("Median", header_text_style),
                    Paragraph("Std Dev", header_text_style),
                    Paragraph("Min", header_text_style),
                    Paragraph("Max", header_text_style)
                ]
            ]
            for col, metrics in statistics.items():
                stats_rows.append([
                    Paragraph(col, body_style),
                    Paragraph(f"{metrics.get('mean', 0.0):.3f}", body_style),
                    Paragraph(f"{metrics.get('median', 0.0):.3f}", body_style),
                    Paragraph(f"{metrics.get('std', 0.0):.3f}", body_style),
                    Paragraph(f"{metrics.get('min', 0.0):.3f}", body_style),
                    Paragraph(f"{metrics.get('max', 0.0):.3f}", body_style),
                ])
            stats_table = Table(stats_rows, colWidths=[1.8 * inch, 0.94 * inch, 0.94 * inch, 0.94 * inch, 0.94 * inch, 0.94 * inch])
            stats_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(stats_table)
            story.append(Spacer(1, 15))

        story.append(PageBreak())  # Force Page Break for next sections

        # --- Section 4: EDA Summary ---
        if eda:
            story.append(Paragraph("4. Exploratory Data Analysis (EDA) Summary", h1_style))
            # Outliers Table
            story.append(Paragraph("Outlier Counts by Numeric Columns", h2_style))
            outliers_data = [
                [Paragraph("Feature", bold_body_style), Paragraph("Detected Outliers", bold_body_style)]
            ]
            for col, count in eda.get("outliers", {}).items():
                outliers_data.append([Paragraph(col, body_style), Paragraph(str(count), body_style)])
            outliers_table = Table(outliers_data, colWidths=[3.25 * inch, 3.25 * inch])
            outliers_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#E5E7EB")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(outliers_table)
            story.append(Spacer(1, 10))

            # Correlation Highlights
            story.append(Paragraph("Correlation Highlights (Absolute value >= 0.5)", h2_style))
            corr_matrix = eda.get("correlation_matrix", {})
            highlights = []
            seen = set()
            for col1, row_vals in corr_matrix.items():
                for col2, val in row_vals.items():
                    if col1 != col2 and (col1, col2) not in seen and (col2, col1) not in seen:
                        seen.add((col1, col2))
                        if abs(val) >= 0.5:
                            highlights.append((col1, col2, val))
            highlights = sorted(highlights, key=lambda x: abs(x[2]), reverse=True)

            if highlights:
                corr_rows = [
                    [Paragraph("Feature 1", bold_body_style), Paragraph("Feature 2", bold_body_style), Paragraph("Correlation", bold_body_style)]
                ]
                for c1, c2, val in highlights:
                    corr_rows.append([
                        Paragraph(c1, body_style),
                        Paragraph(c2, body_style),
                        Paragraph(f"{val:.3f}", body_style)
                    ])
                corr_table = Table(corr_rows, colWidths=[2.5 * inch, 2.5 * inch, 1.5 * inch])
                corr_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (2, 0), colors.HexColor("#E5E7EB")),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                    ('PADDING', (0, 0), (-1, -1), 4),
                ]))
                story.append(corr_table)
            else:
                story.append(Paragraph("No strong correlations (>= 0.5) were identified among numeric features.", body_style))
            story.append(Spacer(1, 15))

        # --- Section 5: Problem Detection ---
        if problem:
            story.append(Paragraph("5. Problem Detection Summary", h1_style))
            problem_data = [
                [Paragraph("Configuration Detail", bold_body_style), Paragraph("System Value", bold_body_style)],
                [Paragraph("Target Column (Last Column)", body_style), Paragraph(str(problem.get("target_column", "N/A")), body_style)],
                [Paragraph("ML Problem Type", body_style), Paragraph(str(problem.get("problem_type", "N/A")), body_style)],
            ]
            if problem.get("classification_type"):
                problem_data.append([
                    Paragraph("Classification Scope", body_style),
                    Paragraph(f"{problem.get('classification_type')} ({problem.get('num_classes')} classes)", body_style)
                ])
            problem_table = Table(problem_data, colWidths=[3.0 * inch, 3.5 * inch])
            problem_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#E5E7EB")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('PADDING', (0, 0), (-1, -1), 5),
            ]))
            story.append(problem_table)
            story.append(Spacer(1, 15))

        story.append(PageBreak())

        # --- Section 6: Model Recommendation ---
        if recommendation:
            story.append(Paragraph("6. Model Recommendations", h1_style))
            rec_rows = [
                [
                    Paragraph("Rank", header_text_style),
                    Paragraph("Algorithm Name", header_text_style),
                    Paragraph("Reason & Justification", header_text_style)
                ]
            ]
            for rec in recommendation.get("recommended_models", []):
                rec_rows.append([
                    Paragraph(str(rec.get("priority", 1)), body_style),
                    Paragraph(str(rec.get("model", "")), body_style),
                    Paragraph(str(rec.get("reason", "")), body_style)
                ])
            rec_table = Table(rec_rows, colWidths=[0.6 * inch, 2.2 * inch, 3.7 * inch])
            rec_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(rec_table)
            story.append(Spacer(1, 15))

        # --- Section 7 & 8: Training & Evaluation Results ---
        story.append(Paragraph("7. Model Training & Evaluation Performance", h1_style))

        # Comparison Table
        problem_type = evaluation.get("problem_type")
        story.append(Paragraph(f"Model Comparison Summary ({problem_type})", h2_style))
        if problem_type == "Classification":
            compare_rows = [
                [
                    Paragraph("Model Name", header_text_style),
                    Paragraph("Accuracy", header_text_style),
                    Paragraph("Weighted F1 Score", header_text_style)
                ]
            ]
            for comp in evaluation.get("model_comparison", []):
                compare_rows.append([
                    Paragraph(comp.get("model"), body_style),
                    Paragraph(f"{comp.get('accuracy', 0.0):.4f}", body_style),
                    Paragraph(f"{comp.get('f1_score', 0.0):.4f}", body_style),
                ])
            compare_table = Table(compare_rows, colWidths=[3.0 * inch, 1.75 * inch, 1.75 * inch])
        else:
            compare_rows = [
                [
                    Paragraph("Model Name", header_text_style),
                    Paragraph("R² Score", header_text_style),
                    Paragraph("MAE", header_text_style),
                    Paragraph("RMSE", header_text_style)
                ]
            ]
            for comp in evaluation.get("model_comparison", []):
                compare_rows.append([
                    Paragraph(comp.get("model"), body_style),
                    Paragraph(f"{comp.get('r2_score', 0.0):.4f}", body_style),
                    Paragraph(f"{comp.get('mae', 0.0):.4f}", body_style),
                    Paragraph(f"{comp.get('rmse', 0.0):.4f}", body_style),
                ])
            compare_table = Table(compare_rows, colWidths=[2.5 * inch, 1.4 * inch, 1.3 * inch, 1.3 * inch])

        compare_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(compare_table)
        story.append(Spacer(1, 10))

        # Highlight Best Model
        story.append(Paragraph(f"<b>Best Performing Model:</b> {evaluation.get('best_model')}", bold_body_style))
        story.append(Spacer(1, 10))

        # Feature Importance Table
        feat_imp = evaluation.get("feature_importance", {})
        if feat_imp:
            story.append(Paragraph(f"Feature Importance ({evaluation.get('best_model')})", h2_style))
            feat_rows = [
                [Paragraph("Feature", bold_body_style), Paragraph("Relative Importance Value", bold_body_style)]
            ]
            for feature, value in feat_imp.items():
                feat_rows.append([Paragraph(feature, body_style), Paragraph(f"{value:.4f}", body_style)])
            feat_table = Table(feat_rows, colWidths=[3.25 * inch, 3.25 * inch])
            feat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (1, 0), colors.HexColor("#E5E7EB")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(feat_table)
            story.append(Spacer(1, 15))

        # Weaknesses list
        weaknesses_list = []
        detailed_results = evaluation.get("detailed_results", {})
        for m_name, details in detailed_results.items():
            for weakness in details.get("weaknesses", []):
                weaknesses_list.append(f"<b>{m_name}</b>: {weakness}")

        if weaknesses_list:
            story.append(Paragraph("Identified Model Weaknesses", h2_style))
            for weakness in weaknesses_list:
                story.append(Paragraph(f"• {weakness}", body_style))

        # Compile Document
        doc.build(story)

        # 3. Save Metadata
        METADATA_FILE = "data/report_metadata.json"
        existing_meta = []
        if os.path.exists(METADATA_FILE):
            try:
                with open(METADATA_FILE, "r") as f:
                    existing_meta = json.load(f)
            except Exception:
                existing_meta = []

        meta_entry = {
            "dataset_id": dataset_id,
            "report_path": report_path,
            "generated_at": datetime.now().isoformat()
        }

        # Replace old entry if present
        existing_meta = [item for item in existing_meta if item.get("dataset_id") != dataset_id]
        existing_meta.append(meta_entry)

        with open(METADATA_FILE, "w") as f:
            json.dump(existing_meta, f, indent=4)

        return meta_entry
