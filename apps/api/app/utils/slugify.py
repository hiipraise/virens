import re


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


def generate_unique_slug(base: str, existing: list[str]) -> str:
    slug = slugify(base)
    if slug not in existing:
        return slug
    i = 1
    while f"{slug}-{i}" in existing:
        i += 1
    return f"{slug}-{i}"
