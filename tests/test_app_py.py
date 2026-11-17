import ast
import pathlib
import re
import types as py_types
import unittest


ROOT = pathlib.Path(__file__).resolve().parent.parent


class TestStreamlitDeliverables(unittest.TestCase):
    def test_requirements_txt_exact_lines(self):
        req_path = ROOT / "requirements.txt"
        self.assertTrue(req_path.exists(), "requirements.txt must exist in root")
        lines = [line.strip() for line in req_path.read_text(encoding="utf-8").splitlines() if line.strip()]
        self.assertEqual(lines, ["streamlit", "pypdf", "google-genai", "python-dotenv"])

    def test_app_py_syntax_and_exact_imports(self):
        app_path = ROOT / "app.py"
        self.assertTrue(app_path.exists(), "app.py must exist in root")
        source = app_path.read_text(encoding="utf-8")

        # Must parse with zero syntax errors
        tree = ast.parse(source, filename="app.py")

        expected_import_lines = [
            "import os",
            "import re",
            "import streamlit as st",
            "from pypdf import PdfReader",
            "from google import genai",
            "from google.genai import types",
            "from dotenv import load_dotenv",
        ]
        for expected in expected_import_lines:
            self.assertIn(expected, source)

        # Ensure no invalid stray imports like 'import r'
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    self.assertNotEqual(alias.name, "r")

        # Verify required strings, config, & models exist
        self.assertIn("⚡ 2026 TURBO EXAM REVISION ENGINE", source)
        self.assertIn('"gemini-2.5-flash"', source)
        self.assertIn('"gemini-2.0-flash"', source)
        self.assertIn("temperature=0.2", source)
        self.assertIn("max_output_tokens=1200", source)
        self.assertIn("rgba(30, 41, 59, 0.7)", source)
        self.assertIn("rgba(129, 140, 248, 0.35)", source)
        self.assertIn("Connection Status:", source)
        self.assertIn("@keyframes", source)
        self.assertIn("animation:", source)
        self.assertIn("© 2026 Amuluru Rithwik. All Rights Reserved.", source)

    def test_parse_study_output_from_app_py(self):
        source = (ROOT / "app.py").read_text(encoding="utf-8")
        tree = ast.parse(source, filename="app.py")

        fn_sources = []
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name in {
                "build_revision_prompt",
                "parse_study_output",
            }:
                fn_sources.append(ast.get_source_segment(source, node))

        self.assertEqual(len(fn_sources), 2)
        ns = {"re": re}
        exec("\n\n".join(fn_sources), ns)
        parse_study_output = ns["parse_study_output"]

        sample_output = """
### SUMMARY
- Point one
- Point two
- Point three
- Point four
- Point five

### KEY_TERMS
1. Osmosis | Diffusion of water across a semipermeable membrane.
2. Mitosis | Nuclear division producing two genetically identical daughter cells.
3. Enzyme | Biological catalyst that lowers activation energy.

### QUIZ
Q1. What lowers activation energy?
A) Lipid
B) Enzyme
C) Glucose
D) Water
Answer: B
Explanation: Enzymes speed up reactions by lowering activation energy.

Q2. What moves during osmosis?
A) Water
B) Sodium
C) Protein
D) DNA
Answer: A
Explanation: Osmosis is specifically the movement of water.
"""
        parsed = parse_study_output(sample_output)
        self.assertEqual(len(parsed["summary_bullets"]), 5)
        self.assertEqual(len(parsed["key_terms"]), 3)
        self.assertEqual(parsed["key_terms"][0]["term"], "Osmosis")
        self.assertEqual(len(parsed["mcqs"]), 2)
        self.assertEqual(parsed["mcqs"][0]["answer"], "B")
        self.assertEqual(parsed["mcqs"][1]["options"]["A"], "Water")


if __name__ == "__main__":
    unittest.main()
