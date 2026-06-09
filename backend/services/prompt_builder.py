class PromptBuilder:
    """
    Prompt Builder to format structured dataset diagnostic details and metrics
    into a comprehensive, context-aware prompt template for LLM consumption.
    """

    @staticmethod
    def build(prompt_package: dict) -> str:
        system_context = prompt_package.get("system_context", "")
        dataset_context = prompt_package.get("dataset_context", {})
        conversation_context = prompt_package.get("conversation_context", "")
        question = prompt_package.get("user_question", "")

        filename = dataset_context.get("filename", "dataset")

        # Start building prompt parts
        prompt_parts = []
        prompt_parts.append(f"{system_context}\n")
        prompt_parts.append(f"Analyzing Dataset: {filename}\n")

        # 1. Dataset Summary (Profiling)
        if "profiling" in dataset_context and dataset_context["profiling"]:
            prof = dataset_context["profiling"]
            prompt_parts.append(
                f"[Dataset Summary]\n"
                f"- Rows: {prof.get('rows', 'N/A')}\n"
                f"- Columns: {prof.get('columns', 'N/A')}\n"
                f"- Missing Values Count: {prof.get('missing_values', 'N/A')}\n"
                f"- Duplicate Rows Count: {prof.get('duplicate_rows', 'N/A')}\n"
            )

        # 2. Problem/Task Type
        if "problem_type" in dataset_context and dataset_context["problem_type"]:
            prob = dataset_context["problem_type"]
            prompt_parts.append(
                f"[Detected Task Details]\n"
                f"- Target Column: {prob.get('target_column', 'N/A')}\n"
                f"- Detected Task Type: {prob.get('problem_type', 'N/A')} ({prob.get('classification_type', 'N/A')})\n"
            )

        # 3. AI Insights
        if "insights" in dataset_context and dataset_context["insights"]:
            insights = dataset_context["insights"]
            insights_summary = "\n".join([f"- {ins}" for ins in insights])
            prompt_parts.append(f"[AI Insights & Observations]\n{insights_summary}\n")

        # 4. Statistics
        if "statistics" in dataset_context and dataset_context["statistics"]:
            stats = dataset_context["statistics"]
            num_cols = stats.get("numerical", {})
            cat_cols = stats.get("categorical", {})
            stats_summary = "Numerical Columns Statistics:\n"
            for col, desc in num_cols.items():
                stats_summary += f"  - {col}: Mean={desc.get('mean')}, Std={desc.get('std')}, Min={desc.get('min')}, Max={desc.get('max')}\n"
            if cat_cols:
                stats_summary += "Categorical Columns Unique Values count:\n"
                for col, val in cat_cols.items():
                    stats_summary += f"  - {col}: {val.get('unique_values')} unique\n"
            prompt_parts.append(f"[Descriptive Statistics]\n{stats_summary}\n")

        # 5. EDA
        if "eda" in dataset_context and dataset_context["eda"]:
            eda = dataset_context["eda"]
            eda_summary = ""
            correlations = eda.get("correlations", {})
            if correlations:
                eda_summary += "Highly Correlated Pairs:\n"
                count = 0
                for pair, coef in correlations.items():
                    if count < 10:
                        eda_summary += f"  - {pair}: {coef:.3f}\n"
                        count += 1
            outliers = eda.get("outliers", {})
            if outliers:
                eda_summary += "Detected Outliers:\n"
                for col, count_val in outliers.items():
                    if count_val > 0:
                        eda_summary += f"  - {col}: {count_val} outliers\n"
            if eda_summary:
                prompt_parts.append(f"[Exploratory Data Analysis (EDA)]\n{eda_summary}\n")

        # 6. Evaluation
        if "evaluation" in dataset_context and dataset_context["evaluation"]:
            evaluation = dataset_context["evaluation"]
            eval_summary = ""
            if evaluation:
                best_model = evaluation.get("best_model", "N/A")
                model_comparison = evaluation.get("model_comparison", []) or []
                eval_summary = f"Best Model: {best_model}\nModel Comparisons:\n"
                for m in model_comparison:
                    model_name = m.get("model", "N/A")
                    if "accuracy" in m:
                        eval_summary += f"  - {model_name}: Accuracy = {m.get('accuracy') * 100:.1f}%, F1-Score = {m.get('f1_score') * 100:.1f}%\n"
                    elif "r2_score" in m:
                        eval_summary += f"  - {model_name}: R² Score = {m.get('r2_score'):.4f}, MAE = {m.get('mae'):.4f}\n"
                    else:
                        eval_summary += f"  - {model_name}\n"
            else:
                eval_summary = "Model training has not been executed yet. Only heuristics suggestions are available."
            prompt_parts.append(f"[Machine Learning Model Evaluations]\n{eval_summary}\n")

        # Conversation memory history context
        prompt_parts.append(f"[Conversation History]\n{conversation_context}\n")

        # Current question and prompt details
        prompt_parts.append(f"Current User Question: \"{question}\"\n")

        prompt_parts.append(
            "Instructions:\n"
            "1. Provide a professional, concise, and scientifically accurate answer to the user's question.\n"
            "2. Rely only on the provided dataset context, observations, statistics, and conversation history.\n"
            "3. Resolve any pronouns (e.g. 'its', 'model', 'dataset') based on the conversation history.\n"
            "4. If the answer cannot be determined from the provided context, state that you do not have enough information in the dataset context to answer.\n"
            "5. Keep the tone helpful, professional, and clear."
        )

        return "\n".join(prompt_parts)

