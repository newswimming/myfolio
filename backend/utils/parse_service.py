import os, tempfile
import pdfplumber, docx
from lxml import etree


# ---------- BASIC PARSERS ----------

def parse_txt(p):
    with open(p, encoding="utf-8", errors="ignore") as f:
        return f.read()


def parse_pdf(p):
    text = []
    try:
        with pdfplumber.open(p) as pdf:
            for pg in pdf.pages:
                text.append(pg.extract_text() or "")
    except Exception:
        return ""
    return "\n".join(text)


def parse_docx(p):
    try:
        d = docx.Document(p)
        return "\n".join([x.text for x in d.paragraphs])
    except Exception:
        return ""


def parse_fdx(p):
    try:
        tree = etree.parse(p)
        return "\n".join([x.text for x in tree.xpath("//Paragraph/Text") if x.text])
    except Exception:
        return ""


# ---------- CLEANING ----------

def clean_text(raw: str) -> str:
    if not raw:
        return ""

    # normalize whitespace
    raw = raw.replace("\r", "\n")
    raw = "\n".join([line.strip() for line in raw.split("\n")])

    # remove excessive empty lines
    lines = [l for l in raw.split("\n") if l]
    return "\n".join(lines)


# ---------- MAIN ENTRY ----------

async def parse_input(file=None, text=None, max_chars=12000):

    if file:
        suf = file.filename.split('.')[-1].lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{suf}") as tmp:
            content = await file.read()

            # 🔥 safety: limit file size (~5MB)
            if len(content) > 5 * 1024 * 1024:
                return None, "file too large"

            tmp.write(content)
            path = tmp.name

        try:
            if suf == "txt":
                raw = parse_txt(path)
            elif suf == "pdf":
                raw = parse_pdf(path)
            elif suf == "docx":
                raw = parse_docx(path)
            elif suf == "fdx":
                raw = parse_fdx(path)
            else:
                return None, "unsupported file type"
        finally:
            os.remove(path)

    elif text:
        raw = text
    else:
        return None, "no input"

    # ---------- CLEAN ----------
    cleaned = clean_text(raw)

    if not cleaned:
        return None, "empty content"

    # ---------- LENGTH CONTROL ----------
    cleaned = cleaned[:max_chars]

    return cleaned, None
