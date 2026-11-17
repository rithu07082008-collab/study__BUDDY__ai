import os
import re
import streamlit as st
from pypdf import PdfReader
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="AI Study Buddy",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded",
)

NEO_AURORA_CSS = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    html, body, [class*="css"], .stApp {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #f8fafc;
    }

    @keyframes gradientShift {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
        }
    }

    @keyframes auroraMove {
        0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.72;
        }
        50% {
            transform: translate3d(-4%, 3%, 0) scale(1.06);
            opacity: 0.92;
        }
    }

    .stApp {
        background: linear-gradient(125deg, #090d16 0%, #0f172a 32%, #1e1b4b 68%, #0f172a 100%);
        background-size: 220% 220%;
        animation: gradientShift 15s ease infinite;
        color: #f8fafc;
        position: relative;
        overflow-x: hidden;
    }

    .stApp::before {
        content: "";
        position: fixed;
        inset: -20%;
        pointer-events: none;
        z-index: 0;
        background:
            radial-gradient(circle at 82% 16%, rgba(99, 102, 241, 0.28) 0%, transparent 46%),
            radial-gradient(circle at 18% 78%, rgba(139, 92, 246, 0.2) 0%, transparent 48%);
        animation: auroraMove 18s ease-in-out infinite;
        will-change: transform, opacity;
    }

    .stApp > * {
        position: relative;
        z-index: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        .stApp, .stApp::before {
            animation: none;
        }
    }

    section[data-testid="stSidebar"] {
        background: rgba(9, 13, 22, 0.85);
        backdrop-filter: blur(18px);
        border-right: 1px solid rgba(129, 140, 248, 0.22);
    }

    section[data-testid="stSidebar"] * {
        color: #f8fafc;
    }

    .status-box {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(129, 140, 248, 0.35);
        border-radius: 12px;
        padding: 0.75rem 0.9rem;
        margin-top: 0.5rem;
        font-size: 0.85rem;
        backdrop-filter: blur(12px);
    }

    .hero-bento {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.78) 0%, rgba(30, 27, 75, 0.72) 55%, rgba(15, 23, 42, 0.88) 100%);
        border: 1px solid rgba(129, 140, 248, 0.42);
        border-radius: 20px;
        padding: 2.1rem 2.4rem;
        margin-bottom: 1.75rem;
        box-shadow: 0 20px 50px -12px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.15) inset;
        backdrop-filter: blur(18px);
    }

    .hero-badge {
        display: inline-block;
        padding: 0.4rem 1rem;
        border-radius: 9999px;
        background: linear-gradient(90deg, rgba(99, 102, 241, 0.28) 0%, rgba(139, 92, 246, 0.28) 100%);
        border: 1px solid rgba(165, 180, 252, 0.5);
        color: #e0e7ff;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        margin-bottom: 0.95rem;
        box-shadow: 0 4px 18px rgba(99, 102, 241, 0.28);
    }

    .hero-title {
        font-size: 2.65rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        margin: 0 0 0.55rem 0;
        line-height: 1.12;
        background: linear-gradient(90deg, #f8fafc 0%, #c7d2fe 52%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
        font-size: 1.02rem;
        color: #cbd5e1;
        margin: 0;
        max-width: 760px;
        line-height: 1.6;
    }

    .glass-card, .term-card, div[data-testid="stColumn"] > div > div > div[data-testid="stVerticalBlockBorderWrapper"] {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(129, 140, 248, 0.35) !important;
        border-radius: 16px;
        padding: 1.4rem 1.55rem;
        transition: all 0.3s ease;
        box-shadow: 0 8px 24px -8px rgba(2, 6, 23, 0.45);
    }

    .glass-card:hover, .term-card:hover, div[data-testid="stColumn"] > div > div > div[data-testid="stVerticalBlockBorderWrapper"]:hover {
        transform: translateY(-4px);
        transition: all 0.3s ease;
        box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.3);
        border-color: rgba(165, 180, 252, 0.6) !important;
    }

    .term-card {
        height: 100%;
    }

    .metric-bento {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(129, 140, 248, 0.35);
        border-radius: 14px;
        padding: 1.1rem 1.25rem;
        transition: all 0.3s ease;
    }

    .metric-bento:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px -10px rgba(99, 102, 241, 0.3);
    }

    .metric-label {
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #94a3b8;
        margin-bottom: 0.35rem;
        font-weight: 600;
    }

    .metric-value {
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.7rem;
        font-weight: 700;
        color: #f8fafc;
    }

    .term-title {
        font-size: 1.08rem;
        font-weight: 700;
        color: #c7d2fe;
        margin-bottom: 0.5rem;
    }

    .term-body {
        font-size: 0.94rem;
        color: #e2e8f0;
        line-height: 1.6;
    }

    .summary-row {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.78rem 0.95rem;
        margin-bottom: 0.55rem;
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.55);
        border: 1px solid rgba(129, 140, 248, 0.22);
        color: #f1f5f9;
        line-height: 1.55;
    }

    .summary-row:last-child {
        margin-bottom: 0;
    }

    .summary-check {
        color: #a78bfa;
        font-weight: 700;
        flex-shrink: 0;
    }

    .mcq-card {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(129, 140, 248, 0.35);
        border-radius: 16px;
        padding: 1.3rem 1.5rem;
        margin-top: 1rem;
        margin-bottom: 0.45rem;
        transition: all 0.3s ease;
    }

    .mcq-question {
        font-size: 1.05rem;
        font-weight: 600;
        color: #f8fafc;
        line-height: 1.5;
    }

    .answer-highlight {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.18) 100%);
        border: 1px solid rgba(165, 180, 252, 0.45);
        border-radius: 12px;
        padding: 0.85rem 1.1rem;
        margin-top: 0.4rem;
        margin-bottom: 0.85rem;
        color: #e0e7ff;
        font-size: 0.93rem;
        line-height: 1.5;
    }

    .stTextArea textarea, .stTextInput input {
        background-color: rgba(15, 23, 42, 0.78) !important;
        color: #f8fafc !important;
        border: 1px solid rgba(129, 140, 248, 0.35) !important;
        border-radius: 12px !important;
        transition: all 0.2s ease !important;
    }

    .stTextArea textarea:focus, .stTextInput input:focus {
        border-color: #8b5cf6 !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.32) !important;
    }

    .stButton > button {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: #f8fafc;
        border: 1px solid rgba(199, 210, 254, 0.38);
        border-radius: 12px;
        padding: 0.7rem 1.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
        box-shadow: 0 10px 26px -8px rgba(99, 102, 241, 0.55);
    }

    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 30px -8px rgba(139, 92, 246, 0.65);
        border-color: rgba(224, 231, 255, 0.65);
    }

    .stButton > button:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.45);
    }

    .footer-note {
        text-align: center;
        color: #94a3b8;
        font-size: 0.88rem;
        padding: 2rem 0 1rem 0;
        margin-top: 2.75rem;
        border-top: 1px solid rgba(129, 140, 248, 0.22);
    }
</style>
"""

st.markdown(NEO_AURORA_CSS, unsafe_allow_html=True)

MODELS_TO_TRY = ["gemini-2.5-flash", "gemini-2.0-flash"]


def escape_html(text: str) -> str:
    """Escape HTML special characters safely for markdown rendering."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def extract_pdf_text(uploaded_file) -> str:
    """Extract readable text from an uploaded PDF file using pypdf."""
    uploaded_file.seek(0)
    reader = PdfReader(uploaded_file)
    pages_text = []
    for page in reader.pages:
        content = page.extract_text()
        if content:
            pages_text.append(content.strip())
    return "\n\n".join(pages_text).strip()


def build_revision_prompt(study_material: str) -> str:
    """Create a strictly structured prompt for summary, key terms, and 5 MCQs."""
    trimmed_text = study_material[:24000]
    return f"""You are an expert exam revision tutor. Analyze the following study notes and produce a concise, high-yield revision kit using the EXACT section headers and format below.

STUDY MATERIAL:
\"\"\"
{trimmed_text}
\"\"\"

OUTPUT FORMAT REQUIREMENTS (FOLLOW EXACTLY):

### SUMMARY
- Bullet 1 (one clear, high-yield exam takeaway)
- Bullet 2
- Bullet 3
- Bullet 4
- Bullet 5

### KEY_TERMS
1. Term Name | Clear, concise exam-ready definition
2. Term Name | Clear, concise exam-ready definition
3. Term Name | Clear, concise exam-ready definition

### QUIZ
Q1. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: A
Explanation: Brief explanation of why A is correct.

Q2. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: B
Explanation: Brief explanation of why B is correct.

Q3. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: C
Explanation: Brief explanation of why C is correct.

Q4. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: D
Explanation: Brief explanation of why D is correct.

Q5. Question text here?
A) Option A text
B) Option B text
C) Option C text
D) Option D text
Answer: A
Explanation: Brief explanation of why A is correct.
"""


def parse_study_output(raw_text: str) -> dict:
    """Parse structured Gemini output into summary bullets, key terms, and MCQs using regex."""
    summary_bullets = []
    key_terms = []
    mcqs = []

    summary_match = re.search(
        r"###\s*SUMMARY\s*(.*?)(?=###\s*KEY_TERMS|$)",
        raw_text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    if summary_match:
        summary_block = summary_match.group(1)
        for line in summary_block.splitlines():
            cleaned = re.sub(r"^\s*[-*•✔✓\d.)]+\s*", "", line).strip()
            if cleaned:
                summary_bullets.append(cleaned)

    terms_match = re.search(
        r"###\s*KEY_TERMS\s*(.*?)(?=###\s*QUIZ|$)",
        raw_text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    if terms_match:
        terms_block = terms_match.group(1)
        for line in terms_block.splitlines():
            cleaned = re.sub(r"^\s*[-*•\d.)]+\s*", "", line).strip()
            if "|" in cleaned:
                parts = cleaned.split("|", 1)
                term = parts[0].strip().strip("*").strip()
                definition = parts[1].strip()
                if term and definition:
                    key_terms.append({"term": term, "definition": definition})

    quiz_match = re.search(
        r"###\s*QUIZ\s*(.*)$",
        raw_text,
        flags=re.DOTALL | re.IGNORECASE,
    )
    if quiz_match:
        quiz_block = quiz_match.group(1).strip()
        question_blocks = re.split(r"(?m)(?=^\s*Q\d+[.:)])", quiz_block)
        for block in question_blocks:
            block = block.strip()
            if not block:
                continue

            q_match = re.search(
                r"^\s*Q\d+[.:)]\s*(.+?)(?=\n\s*A[).])",
                block,
                flags=re.DOTALL,
            )
            if not q_match:
                continue
            question_text = " ".join(q_match.group(1).split())

            options = {}
            for letter in ["A", "B", "C", "D"]:
                opt_match = re.search(
                    rf"(?m)^\s*{letter}[).]\s*(.+)$",
                    block,
                )
                if opt_match:
                    options[letter] = opt_match.group(1).strip()

            ans_match = re.search(
                r"(?i)Answer\s*:\s*([A-D])",
                block,
            )
            answer_letter = ans_match.group(1).upper() if ans_match else "A"

            exp_match = re.search(
                r"(?i)Explanation\s*:\s*(.+)$",
                block,
                flags=re.DOTALL,
            )
            explanation = (
                " ".join(exp_match.group(1).split())
                if exp_match
                else "Review the summary notes above to reinforce this concept."
            )

            if len(options) == 4:
                mcqs.append(
                    {
                        "question": question_text,
                        "options": options,
                        "answer": answer_letter,
                        "explanation": explanation,
                    }
                )

    return {
        "summary_bullets": summary_bullets[:5],
        "key_terms": key_terms[:3],
        "mcqs": mcqs[:5],
    }


def generate_revision_kit(api_key: str, study_material: str) -> tuple[dict, str]:
    """Call Google GenAI SDK with multi-model fallback."""
    client = genai.Client(api_key=api_key)
    prompt = build_revision_prompt(study_material)
    last_error = None

    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=1200,
                ),
            )
            raw_text = response.text or ""
            parsed = parse_study_output(raw_text)
            if parsed["summary_bullets"] or parsed["mcqs"]:
                return parsed, model_name
            last_error = ValueError(f"Model {model_name} returned an empty or unparseable response.")
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"All fallback models failed ({', '.join(MODELS_TO_TRY)}): {last_error}")


# Sidebar Controls
with st.sidebar:
    st.markdown("## 🎓 Study Controls")
    env_api_key = os.getenv("GEMINI_API_KEY", "")
    api_key_input = st.text_input(
        "Gemini API Key",
        value=env_api_key,
        type="password",
        placeholder="Paste your Gemini API key...",
        help="Automatically loaded from GEMINI_API_KEY in .env when configured.",
    )

    if api_key_input.strip():
        st.markdown(
            '<div class="status-box">🟢 <strong>Connection Status:</strong> API Key Ready</div>',
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            '<div class="status-box">🟠 <strong>Connection Status:</strong> Awaiting API Key</div>',
            unsafe_allow_html=True,
        )

    st.markdown("---")
    st.markdown("**Model Fallback Order**")
    st.caption("1. `gemini-2.5-flash`\n2. `gemini-2.0-flash`")
    st.markdown("---")
    st.markdown("**Revision Kit Layout**")
    st.caption("• Quick Revision Summary\n• 3 Key Terms Bento Grid\n• 5 Interactive Practice MCQs")

# Glowing Bento Hero Header
st.markdown(
    """
    <div class="hero-bento">
        <div class="hero-badge">⚡ 2026 TURBO EXAM REVISION ENGINE</div>
        <h1 class="hero-title">AI Study Buddy</h1>
        <p class="hero-subtitle">
            Convert dense lecture notes or chapter PDFs into a crisp revision summary,
            glowing key-term bento cards, and an interactive 5-question practice quiz in seconds.
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# Dual Input Bento Columns
col_notes, col_pdf = st.columns(2, gap="large")

with col_notes:
    with st.container(border=True):
        st.subheader("📝 Option 1: Paste Study Notes")
        pasted_notes = st.text_area(
            "Paste lecture notes, textbook excerpts, or topic outlines",
            height=240,
            placeholder="Paste your study notes here...",
            label_visibility="collapsed",
        )

with col_pdf:
    with st.container(border=True):
        st.subheader("📄 Option 2: Upload Chapter PDF")
        uploaded_pdf = st.file_uploader(
            "Upload a chapter or lecture PDF",
            type=["pdf"],
            help="Parsed seamlessly using pypdf.",
        )
        pdf_extracted_text = ""
        if uploaded_pdf is not None:
            try:
                pdf_extracted_text = extract_pdf_text(uploaded_pdf)
                if pdf_extracted_text:
                    st.success(f"Extracted {len(pdf_extracted_text.split())} words from {uploaded_pdf.name}")
                else:
                    st.warning("No selectable text found in this PDF. Try pasting notes in Option 1.")
            except Exception as pdf_err:
                st.error(f"Could not read PDF: {pdf_err}")

combined_material = "\n\n".join(
    part.strip() for part in [pasted_notes, pdf_extracted_text] if part and part.strip()
)

generate_clicked = st.button("🚀 Generate Revision Kit", use_container_width=True)

if generate_clicked:
    if not api_key_input.strip():
        st.error("Please enter your Gemini API Key in the sidebar or set GEMINI_API_KEY in .env.")
    elif not combined_material:
        st.warning("Please paste study notes or upload a readable PDF before generating.")
    else:
        with st.spinner("Generating your neo-aurora revision kit..."):
            try:
                result_data, used_model = generate_revision_kit(api_key_input.strip(), combined_material)
                st.session_state["revision_data"] = result_data
                st.session_state["used_model"] = used_model
                st.session_state["source_word_count"] = len(combined_material.split())
                st.session_state["quiz_checked"] = False
                for idx in range(5):
                    st.session_state.pop(f"mcq_choice_{idx}", None)
            except Exception as gen_err:
                st.error(f"Generation failed: {gen_err}")

# Output Layout
if "revision_data" in st.session_state:
    data = st.session_state["revision_data"]
    used_model = st.session_state.get("used_model", "gemini-2.5-flash")
    word_count = st.session_state.get("source_word_count", 0)
    summary_bullets = data.get("summary_bullets", [])
    key_terms = data.get("key_terms", [])
    mcqs = data.get("mcqs", [])

    st.markdown("### 📊 Metric Summary Bar")
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(
            f'<div class="metric-bento"><div class="metric-label">Source Words</div><div class="metric-value">{word_count}</div></div>',
            unsafe_allow_html=True,
        )
    with m2:
        st.markdown(
            f'<div class="metric-bento"><div class="metric-label">Summary Points</div><div class="metric-value">{len(summary_bullets)}</div></div>',
            unsafe_allow_html=True,
        )
    with m3:
        st.markdown(
            f'<div class="metric-bento"><div class="metric-label">Key Terms</div><div class="metric-value">{len(key_terms)}</div></div>',
            unsafe_allow_html=True,
        )
    with m4:
        st.markdown(
            f'<div class="metric-bento"><div class="metric-label">Practice Quiz</div><div class="metric-value">{len(mcqs)}</div></div>',
            unsafe_allow_html=True,
        )

    st.caption(f"Synthesized with `{used_model}`")

    # Quick Revision Summary Glass Container
    if summary_bullets:
        st.markdown("### ⚡ Quick Revision Summary")
        summary_rows_html = "".join(
            f'<div class="summary-row"><span class="summary-check">✔</span><span>{escape_html(bullet)}</span></div>'
            for bullet in summary_bullets
        )
        st.markdown(f'<div class="glass-card">{summary_rows_html}</div>', unsafe_allow_html=True)

    # 3 Key Terms Bento Grid
    if key_terms:
        st.markdown("### 🔑 Key Terms Bento Grid")
        term_cols = st.columns(len(key_terms))
        for col, item in zip(term_cols, key_terms):
            with col:
                st.markdown(
                    f"""
                    <div class="term-card">
                        <div class="term-title">{escape_html(item['term'])}</div>
                        <div class="term-body">{escape_html(item['definition'])}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    # 5 Practice MCQs
    if mcqs:
        st.markdown("### 🧠 5 Practice MCQs")
        for idx, q in enumerate(mcqs):
            st.markdown(
                f'<div class="mcq-card"><div class="mcq-question">Q{idx + 1}. {escape_html(q["question"])}</div></div>',
                unsafe_allow_html=True,
            )
            option_labels = [f"{k}) {v}" for k, v in q["options"].items()]
            selected_label = st.radio(
                f"Select option for Question {idx + 1}",
                options=option_labels,
                key=f"mcq_choice_{idx}",
                index=None,
                label_visibility="collapsed",
            )

            if st.session_state.get("quiz_checked"):
                selected_letter = selected_label[0] if selected_label else None
                correct_letter = q["answer"]
                status_prefix = "✅ Correct" if selected_letter == correct_letter else "❌ Incorrect"
                chosen_text = selected_letter if selected_letter else "None"
                st.markdown(
                    f"""
                    <div class="answer-highlight">
                        <strong>{status_prefix}</strong> · Selected: <strong>{chosen_text}</strong> · Correct Answer: <strong>{correct_letter}</strong><br/>
                        {escape_html(q['explanation'])}
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        check_col, reset_col = st.columns([2, 1])
        with check_col:
            if st.button("✅ Check Quiz Answers", use_container_width=True):
                st.session_state["quiz_checked"] = True
                st.rerun()
        with reset_col:
            if st.button("🔄 Reset Quiz", use_container_width=True):
                st.session_state["quiz_checked"] = False
                for idx in range(len(mcqs)):
                    st.session_state.pop(f"mcq_choice_{idx}", None)
                st.rerun()

        if st.session_state.get("quiz_checked"):
            score = 0
            for idx, q in enumerate(mcqs):
                chosen = st.session_state.get(f"mcq_choice_{idx}")
                if chosen and chosen[0] == q["answer"]:
                    score += 1
            st.markdown(
                f'<div class="answer-highlight"><strong>Final Score: {score} / {len(mcqs)} ({round((score / len(mcqs)) * 100)}%)</strong></div>',
                unsafe_allow_html=True,
            )

# Centered Copyright Footer
st.markdown(
    '<div class="footer-note">© 2026 Amuluru Rithwik. All Rights Reserved.</div>',
    unsafe_allow_html=True,
)
