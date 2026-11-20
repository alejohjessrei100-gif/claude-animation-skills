# Channel brand

## Mascot: Mr. Black (`"type": "host"`)
Black side-parted hair, charcoal suit, white shirt, crimson tie and pocket square. Use him as the recurring host in
every Short. Crimson (`#c42d3f`) is the channel's accent colour: red string on the evidence board, red beacon on the
rooftop tower, red neon in the diner, red files on the desk. Keep other characters as extras.
Defined in `toon2d/character.py` (`ARCHETYPES['host']`, hair `sidepart_black`).

## Captions
Montserrat ExtraBold (OFL), lowercase, 1-2 words, `toon2d/text.py`.

## Own sets (`toon2d/brandsets.py`)
| set | what | actors stand at |
|---|---|---|
| `study` | teal wallpaper, bookshelf, red-string evidence board, window onto the city, banker's lamp (glows at night) | y 1500-1700, z 1.0 (desk hides the legs when y < 1700) |
| `rooftop` | layered city skyline, red beacon tower, water tower, vents, access door lamp, gravel roof, parapet | y 1600-1800, z 1.0 |
| `diner` | neon OPEN window, menu board, red booths, pie case, counter with stools | y 1500-1700, z 1.0 |

Suggested light per set: `study` night (tension) or dawn (ending), `diner` golden (explanation), `rooftop` sunset (name of the effect).
To add a set: write `def myset(mood): return [(name, plane_z, painter, opts), ...], meta` in `brandsets.py` and add it to
`REGISTRY` there.

## "By the way" script voice
Every 1-2 sentences ends in a deadpan ", by the way." (rhythm: sentence / sentence, by the way / sentence /
sentence, by the way ...). It makes the narrator sound casual about odd facts. Rules:
* Put it on the sentence that carries the oddest or most surprising detail, never on the "You see," mechanism sentence.
* Never two "by the way" in a row, never three sentences without one.
* The hook and the final line both end with it, as a callback.
* Counts toward the word budget (110-130 words).
Example: `examples/brand_demo/script.txt` (Path B, peak-end rule).
