window.Platformer = window.Platformer || {};
Platformer.LevelBuilders = Platformer.LevelBuilders || {};
Platformer.LevelFallbackSize = Platformer.LevelFallbackSize || {};
Platformer.LevelFallbackSize[5] = { width: 15, height: 12 };

// Built-in fallback for Level 5 (LDtk test map) when cached JSON files are unavailable.
Platformer.LevelBuilders[5] = ({ line, many }) => {
  line(2, 4, 4, "#");
  line(8, 10, 4, "#");
  line(2, 2, 5, "#");
  line(2, 2, 6, "#");
  line(5, 10, 6, "#");
  line(2, 3, 7, "#");
  line(9, 12, 7, "#");
  line(5, 6, 8, "#");
  line(9, 12, 8, "#");
  line(2, 6, 9, "#");
  line(10, 11, 9, "#");
  line(2, 6, 10, "#");
  line(10, 11, 10, "#");
  line(4, 6, 11, "#");
  line(9, 10, 11, "#");
  many([[3, 5]], "S");
};
