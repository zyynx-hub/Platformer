window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};

Platformer.LevelBuilders[3] = function buildLevel3(api) {
  const { line, rect, many, manyEnemies } = api;

  // Dash-pressure lanes, but no trap cracks for enemies.
  line(10, 13, 17, ".");
  line(28, 31, 17, ".");
  line(46, 49, 17, ".");
  line(64, 67, 17, ".");
  line(80, 83, 17, ".");

  rect(0, 16, 6, 16, "#");
  rect(16, 16, 23, 16, "#");
  rect(34, 16, 41, 16, "#");
  rect(52, 16, 59, 16, "#");
  rect(70, 16, 77, 16, "#");
  rect(86, 16, 89, 16, "#");

  line(7, 12, 13, "=");
  line(21, 27, 12, "=");
  line(39, 45, 11, "=");
  line(57, 63, 10, "=");
  line(75, 82, 9, "=");

  many([[2, 16]], "S");
  many([[27, 11], [77, 8]], "K");
  many([[9, 12], [23, 11], [26, 11], [40, 10], [44, 10], [58, 9], [62, 9], [76, 8], [81, 8], [88, 15]], "C");
  many([[24, 11], [42, 10], [60, 9], [78, 8]], "^");
  manyEnemies([[18, 16, "G"], [36, 16, "G"], [54, 16, "G"], [72, 16, "G"]]);
};

