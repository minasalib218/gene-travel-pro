from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_IMAGES = ROOT / "public" / "images"
BACKUP_ROOT = ROOT / "tmp_backups" / f"public-images-originals-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".jfif", ".png"}
MIN_BYTES = 700 * 1024
MAX_LONG_EDGE = 1920
JPEG_QUALITY = 84
PNG_COMPRESS_LEVEL = 9


def should_skip(path: Path) -> bool:
    parts = {part.lower() for part in path.parts}
    if any(part.endswith("_files") for part in parts):
        return True
    if path.suffix.lower() not in IMAGE_EXTENSIONS:
        return True
    if path.stat().st_size < MIN_BYTES:
        return True
    return False


def backup_original(path: Path) -> None:
    relative = path.relative_to(ROOT)
    destination = BACKUP_ROOT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, destination)


def optimize_image(path: Path) -> tuple[int, int] | None:
    before = path.stat().st_size

    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source)
        has_alpha = image.mode in ("RGBA", "LA") or (
            image.mode == "P" and "transparency" in image.info
        )

        width, height = image.size
        long_edge = max(width, height)
        if long_edge > MAX_LONG_EDGE:
            scale = MAX_LONG_EDGE / long_edge
            next_size = (round(width * scale), round(height * scale))
            image = image.resize(next_size, Image.Resampling.LANCZOS)

        suffix = path.suffix.lower()
        save_kwargs: dict[str, object] = {"optimize": True}

        if suffix in {".jpg", ".jpeg", ".jfif"}:
            if image.mode not in ("RGB", "L"):
                image = image.convert("RGB")
            save_kwargs.update(
                {
                    "quality": JPEG_QUALITY,
                    "progressive": True,
                    "subsampling": 1,
                }
            )
            image.save(path, format="JPEG", **save_kwargs)
        elif suffix == ".png":
            if not has_alpha:
                image = image.convert("RGB")
            save_kwargs.update({"compress_level": PNG_COMPRESS_LEVEL})
            image.save(path, format="PNG", **save_kwargs)

    after = path.stat().st_size
    if after >= before:
        backup = BACKUP_ROOT / path.relative_to(ROOT)
        shutil.copy2(backup, path)
        return None

    return before, after


def main() -> None:
    optimized = []
    for path in sorted(PUBLIC_IMAGES.rglob("*")):
        if not path.is_file() or should_skip(path):
            continue
        backup_original(path)
        result = optimize_image(path)
        if result:
            optimized.append((path.relative_to(ROOT), *result))

    before_total = sum(item[1] for item in optimized)
    after_total = sum(item[2] for item in optimized)
    saved = before_total - after_total

    print(f"Optimized files: {len(optimized)}")
    print(f"Before: {before_total / 1024 / 1024:.2f} MB")
    print(f"After: {after_total / 1024 / 1024:.2f} MB")
    print(f"Saved: {saved / 1024 / 1024:.2f} MB")
    print(f"Backup folder: {BACKUP_ROOT}")


if __name__ == "__main__":
    main()
