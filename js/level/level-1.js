window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};

Platformer.LevelBuilders[1] = function buildLevel1(api) {
  const { line, rect, many, manyEnemies } = api;

  // Ground with wide, readable gaps.
  line(12, 15, 17, ".");
  line(34, 37, 17, ".");
  line(58, 61, 17, ".");
  line(78, 81, 17, ".");

  // Broad patrol islands.
  rect(0, 16, 7, 16, "#");
  rect(18, 16, 25, 16, "#");
  rect(40, 16, 47, 16, "#");
  rect(64, 16, 71, 16, "#");
  rect(84, 16, 89, 16, "#");

  // Platforms.
  line(8, 13, 12, "=");
  line(23, 29, 11, "=");
  line(44, 50, 10, "=");
  line(66, 73, 9, "=");

  many([[3, 16]], "S");
  many([[27, 10], [69, 8]], "K");
  many([[10, 11], [24, 10], [28, 10], [45, 9], [49, 9], [67, 8], [72, 8], [86, 15], [88, 15], [20, 15]], "C");
  many([[25, 10], [46, 9], [68, 8], [86, 15]], "^");
  manyEnemies([[20, 16, "E"], [43, 16, "E"], [66, 16, "E"], [86, 16, "E"]]);
};

