# SINNOH REBORN — Expanded 3D fan-game prototype

An unofficial browser game inspired by the Sinnoh setting from Pokémon Diamond and Pearl. Built for playing on desktop with WASD, real 3D terrain, a story introduction, over-world Pokémon, turn-based battles, gyms, and local saving.

## Play on your PC

**https://pokemon-sa-ntiago.vercel.app/**

The game is deployed automatically from the repository's default \`main\` branch using the existing Vercel project \`sa-ntiago/pokemon\`.

## Controls

| Action | Control |
| --- | --- |
| Move | WASD or arrow keys |
| Run | Hold Shift |
| Speak / enter buildings / interact | E or Enter |
| Team / heal with potions | R |
| Regional Sinnoh atlas | M |
| Rotate the outside camera | Drag mouse |
| Zoom | Mouse wheel |
| Close menus | Esc |

### Story start

1. Select **Nueva aventura**. The story begins in the protagonist's bedroom with a news report about a red Gyarados.
2. Go downstairs, speak to Mom, and visit Barry at his house.
3. Head to Lake Verity and investigate the briefcase.
4. Select Turtwig, Chimchar or Piplup, and battle a Starly.
5. Return home, visit Professor Rowan's Sandgem lab, and receive the Pokédex.
6. Explore Route 202 and Jubilife, fight the Oreburgh Gym Leader, and continue exploring Sinnoh.

## Features implemented

- Original procedural 3D world with 14 locations and 17 connected routes, inspired by Sinnoh's geography. It is **not** a pixel-for-pixel or geographically exact port.
- Town districts with unique visual themes: gardens, mining, urban centers, coastline, wetlands, old towns, and snow.
- Route network and region atlas with visited town tracking, compass, objective marker and minimap.
- Playable interiors (home, bedroom, Barry's house, laboratory, Pokémon Center, Poké Mart, gyms, and houses).
- Scripted introduction with dialogues, a starter choice, the lake encounter, the Pokédex, and extended gym progression.
- 8 gym leaders, trainer challenges, earned badges, prize money and interactive shop.
- Wild encounters, roaming Pokémon, ball capture, basic type effectiveness, HP, XP, levels, starter evolution and switching the lead party Pokémon.
- Potions and Pokémon Center healing, team of up to 6, autosave with browser localStorage.
- Daytime lighting, changing scenic biomes, animated roaming Pokémon, petals, snow, rain, walking motion, and camera transitions.
- Keyboard-focused desktop gameplay.

## Technology

- Three.js with low-poly procedural geometry, standard materials, shadows and fog.
- HTML/CSS interface, JavaScript ES modules; no build step, no backend.
- External artwork for official Pokémon from PokeAPI's sprite repository and selected character graphics hosted by Pokémon Showdown. Requires Internet and WebGL.
- Game save stored only within the current browser/profile using localStorage. Clearing site data deletes it.
- Latest content is deployed by pushing to GitHub; no second Vercel project is needed.

## What is not done yet

This is **not the complete Pokémon Diamond/Pearl game**, nor a 1:1 remake of every interior, story beat, move, item, quest, route, evolution, animation or Pokédex entry. The eight gym leaders currently use simplified one-opponent battles. There is no full Team Galactic campaign, Elite Four, Legendary storyline, online play, or a full 3D creature model pipeline. Many characters still use animated 2D artwork rather than fully rigged models.

Runtime smoke tests checked procedural region generation, the beginning-of-game dialogue progression, gym badge rewards, module syntax and Vercel deployment output. These checks are not substitutes for complete in-browser gameplay and visual QA.

## Legal notice

This is an unofficial, non-commercial fan prototype, not affiliated with Nintendo, Game Freak, Creatures Inc. or The Pokémon Company. Pokémon and associated names and artwork belong to their respective owners. Treat external assets according to their owners' terms.
