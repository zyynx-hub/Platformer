window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};

Platformer.createLevelData = function createLevelData(level = 1) {
  const width = 90;
  const height = 18;
  const rows = Array.from({ length: height }, () => Array.from({ length: width }, () => "."));

  const inBounds = (x, y) => x >= 0 && x < width && y >= 0 && y < height;
  const put = (x, y, ch) => {
    if (inBounds(x, y)) rows[y][x] = ch;
  };
  const line = (x1, x2, y, ch) => {
    for (let x = x1; x <= x2; x += 1) put(x, y, ch);
  };
  const rect = (x1, y1, x2, y2, ch) => {
    for (let y = y1; y <= y2; y += 1) {
      for (let x = x1; x <= x2; x += 1) put(x, y, ch);
    }
  };
  const many = (items, ch) => items.forEach(([x, y]) => put(x, y, ch));
  const manyEnemies = (items) => items.forEach(([x, y, ch]) => put(x, y, ch));

  // Base floor.
  line(0, width - 1, height - 1, "#");

  const builder = Platformer.LevelBuilders[level] || Platformer.LevelBuilders[1];
  if (builder) {
    builder({
      width,
      height,
      put,
      line,
      rect,
      many,
      manyEnemies,
    });
  }

  return rows.map((r) => r.join(""));
};

