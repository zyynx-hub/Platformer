window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};

Platformer.LevelBuilders[4] = function buildLevel4(api) {
  const { line, rect, many, manyEnemies } = api;

  // Fortress layout: layered routes, tank enemies, clean patrol lanes.
  line(12, 16, 17, ".");
  line(36, 40, 17, ".");
  line(60, 64, 17, ".");

  rect(0, 16, 8, 16, "#");
  rect(20, 16, 28, 16, "#");
  rect(44, 16, 52, 16, "#");
  rect(68, 16, 76, 16, "#");
  rect(84, 16, 89, 16, "#");

  rect(30, 14, 34, 14, "#");
  rect(54, 13, 58, 13, "#");
  rect(78, 12, 82, 12, "#");

  line(9, 16, 12, "=");
  line(26, 34, 10, "=");
  line(48, 57, 8, "=");
  line(70, 80, 7, "=");

  many([[3, 16]], "S");
  many([[32, 9], [74, 6]], "K");
  many([[11, 11], [28, 9], [33, 9], [49, 7], [56, 7], [71, 6], [79, 6], [86, 15], [22, 15], [45, 15]], "C");
  many([[30, 9], [52, 7], [75, 6], [86, 15]], "^");
  manyEnemies([[22, 16, "H"], [46, 16, "H"], [70, 16, "H"], [85, 16, "H"]]);
};

