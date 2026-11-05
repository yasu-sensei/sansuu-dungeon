// Load the real party selectors into isolated battle/save test contexts.
module.exports=s=>[
 s.split('\n').find(l=>l.startsWith('const DUNGEON_THREE_HERO_NAMES=')).replace('const DUNGEON_THREE_HERO_NAMES=','globalThis.DUNGEON_THREE_HERO_NAMES='),
 "globalThis.DUNGEON_THREE_HERO_IMAGES={attack:'dungeon3-attack',defense:'dungeon3-defense',speed:'dungeon3-speed'};",
 ...['heroRoster','heroDisplayName','heroSpriteSource','enemyMaxHP'].map(n=>s.split('\n').find(l=>l.startsWith('function '+n+'(')))
].join('\n')+"\nfunction secretDragonUnlocked(){return false}\nfunction isPlayTime(){return true}\nfunction guardAdventure(){return true}\nfunction consumeDailyBattle(){return true}\nfunction isDungeonUnlocked(){return true}\nfunction dailyBattlesRemaining(){return 6}\n";
