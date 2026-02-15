window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};

Platformer.LevelBuilders[2] = function buildLevel2(api) {
  const { line, rect, many, manyEnemies } = api;

  // Vertical rooftop style with wide landing zones.
  line(14, 18, 17, ".");
  line(38, 42, 17, ".");
  line(62, 66, 17, ".");

  rect(0, 16, 10, 16, "#");
  rect(22, 16, 30, 16, "#");
  rect(46, 16, 54, 16, "#");
  rect(70, 16, 89, 16, "#");

  rect(14, 14, 18, 14, "#");
  rect(38, 13, 42, 13, "#");
  rect(62, 12, 66, 12, "#");

  line(9, 15, 12, "=");
  line(27, 34, 10, "=");
  line(49, 56, 8, "=");
  line(71, 79, 7, "=");

  many([[4, 16]], "S");
  many([[33, 9], [74, 6]], "K");
  many([[12, 11], [29, 9], [33, 9], [50, 7], [55, 7], [72, 6], [78, 6], [86, 15], [25, 15], [47, 15]], "C");
  many([[31, 9], [53, 7], [75, 6], [85, 15]], "^");
  manyEnemies([[24, 16, "F"], [48, 16, "F"], [72, 16, "F"], [84, 16, "F"]]);
};

