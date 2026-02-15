from pathlib import Path
import sys

REQUIRED = [
    Path('index.html'),
    Path('desktop_launcher.py'),
    Path('js/main.js'),
    Path('js/vendor/phaser.min.js'),
    Path('js/core/build-info.js'),
    Path('js/app.bundle.js'),
    Path('js/app.bundle.js.map'),
    Path('assets/Slaughter to Prevail - K (mp3cut.net).mp3'),
    Path('assets/Elevator Music - So Chill (mp3cut.net).mp3'),
    Path('assets/levels/level-1.json'),
    Path('assets/levels/level-2.json'),
    Path('assets/levels/level-3.json'),
    Path('assets/levels/level-4.json'),
]
OPTIONAL = [
    Path('assets/IFFY_IDLE.png'),
    Path('assets/kawaii-anime-girl.gif'),
]


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    missing = []
    for rel in REQUIRED:
        p = root / rel
        if not p.exists() or p.stat().st_size <= 0:
            missing.append(str(rel))

    warns = []
    for rel in OPTIONAL:
        p = root / rel
        if not p.exists() or p.stat().st_size <= 0:
            warns.append(str(rel))

    if missing:
        print('[assets] Missing required assets/files:')
        for m in missing:
            print(f'  - {m}')
        return 1

    print('[assets] Required assets validated.')
    if warns:
        print('[assets] Optional assets missing (fallbacks will be used):')
        for w in warns:
            print(f'  - {w}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
