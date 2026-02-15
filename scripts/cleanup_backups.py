from pathlib import Path
import os
import time


def cleanup_backups(root: Path, max_age_days: int = 14) -> int:
    now = time.time()
    cutoff = now - (max_age_days * 86400)
    removed = 0

    for pat in ("*.bak", "*.old"):
        for p in root.rglob(pat):
            try:
                if p.is_file() and p.stat().st_mtime < cutoff:
                    p.unlink(missing_ok=True)
                    removed += 1
            except Exception:
                pass
    return removed


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    days = int(os.getenv('BACKUP_MAX_AGE_DAYS', '14'))
    removed = cleanup_backups(root, days)
    print(f'[cleanup] Removed {removed} stale backup files (>{days} days).')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
