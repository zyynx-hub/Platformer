window.Platformer = window.Platformer || {};

Platformer.WorldMapData = {
  id: "NeoTokyoRoute",
  bounds: { x: 40, y: 80, width: 1520, height: 760 },
  spawn: { x: 150, y: 700 },
  blockedRegions: [
    { x: 430, y: 270, width: 170, height: 95, label: "water" },
    { x: 860, y: 470, width: 200, height: 95, label: "water" },
    { x: 1200, y: 260, width: 150, height: 120, label: "cliff" },
  ],
  nodes: [
    {
      id: "Level_01",
      levelId: "Level_01",
      gameLevel: 1,
      displayName: "Rooftop Start",
      difficulty: "Easy",
      x: 180,
      y: 680,
      requires: [],
      next: ["Level_02"],
      tutorial: "Collect 10 coins to clear. Use checkpoints and watch turret shots.",
    },
    {
      id: "Level_02",
      levelId: "Level_02",
      gameLevel: 2,
      displayName: "Metro Drift",
      difficulty: "Normal",
      x: 460,
      y: 540,
      requires: ["Level_01"],
      next: ["Level_03"],
      tutorial: "Enemy pressure increases when close. Use dash to break contact.",
    },
    {
      id: "Level_03",
      levelId: "Level_03",
      gameLevel: 3,
      displayName: "Neon Ward",
      difficulty: "Normal",
      x: 780,
      y: 640,
      requires: ["Level_02"],
      next: ["Level_04"],
      tutorial: "Projectiles are the main threat. Keep moving and route for coins.",
    },
    {
      id: "Level_04",
      levelId: "Level_04",
      gameLevel: 4,
      displayName: "Skyline Core",
      difficulty: "Hard",
      x: 1100,
      y: 500,
      requires: ["Level_03"],
      next: ["Boss_01"],
      tutorial: "Hard mode spacing: fewer safe zones and faster enemy reactions.",
    },
    {
      id: "Boss_01",
      levelId: "Boss_01",
      gameLevel: 4,
      displayName: "Boss Approach",
      difficulty: "Very Hard",
      x: 1390,
      y: 360,
      requires: ["Level_04"],
      next: [],
      tutorial: "Boss node currently uses level 4 ruleset as a challenge endpoint.",
    },
  ],
};

Platformer.WorldMapData.getNodeById = function getNodeById(id) {
  return this.nodes.find((n) => n.id === id) || null;
};

Platformer.WorldMapData.getNodeForGameLevel = function getNodeForGameLevel(level) {
  return this.nodes.find((n) => Number(n.gameLevel) === Number(level)) || null;
};
