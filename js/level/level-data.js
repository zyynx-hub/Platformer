window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};
Platformer.LevelJsonCache = Platformer.LevelJsonCache || {};
Platformer.LevelFallbackSize = Platformer.LevelFallbackSize || {};

Platformer.createLevelData = function createLevelData(level = 1) {
  const jsonLevel = Platformer.LevelJsonCache[level] || null;
  const fallback = Platformer.LevelFallbackSize[level] || null;
  const width = Number((jsonLevel && jsonLevel.width) || (fallback && fallback.width) || 90);
  const height = Number((jsonLevel && jsonLevel.height) || (fallback && fallback.height) || 18);
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

  if (jsonLevel && Array.isArray(jsonLevel.commands)) {
    jsonLevel.commands.forEach((cmd) => {
      const op = String((cmd && cmd.op) || "");
      if (op === "line") line(Number(cmd.x1), Number(cmd.x2), Number(cmd.y), String(cmd.ch || "."));
      if (op === "rect") rect(Number(cmd.x1), Number(cmd.y1), Number(cmd.x2), Number(cmd.y2), String(cmd.ch || "."));
      if (op === "many") many(Array.isArray(cmd.items) ? cmd.items : [], String(cmd.ch || "."));
      if (op === "manyEnemies") manyEnemies(Array.isArray(cmd.items) ? cmd.items : []);
    });
  } else {
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
  }

  return rows.map((r) => r.join(""));
};
