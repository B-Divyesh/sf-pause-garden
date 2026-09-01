# Pause Garden visual system

## Direction and purpose

Pause Garden uses **surreal editorial scenery**: a moonlit greenhouse folded
like a paper stage, with enormous seed pods hanging above small garden beds.
The impossible scale makes the chapter feel like a shared story, while solid
ink-coloured plates keep every game action calm and legible. The scene frames
the game; it never competes with the board.

## Palette

The palette is drawn from wet soil, dusk glass, pale seedlings, and one coral
visitor flower. It is a deliberate single dark treatment.

- `--night: #151b27` — page background
- `--soil: #252736` — raised surfaces
- `--paper: #f5f0df` — primary text and board paper
- `--mist: #c7c2b2` — secondary text
- `--leaf: #b8d97a` — primary action and success
- `--leaf-ink: #182015` — text on leaf
- `--coral: #ff927d` — current turn and visitor accent
- `--rain: #8fc7d9` — weather and focus
- `--danger: #ffafa2` — errors

Body text on night and soil exceeds 4.5:1. Dark text on leaf also exceeds
4.5:1. State changes use words and shapes as well as colour.

## Type

- Display: Georgia, with broad editorial italics for chapter titles.
- Body and controls: system sans-serif (`Inter`-like platform stack).
- Numbers use tabular figures.

System fonts avoid a font download and keep the first visit quick. Display
type is sparse and large; game controls stay quiet and literal.

## Spacing and shape

An 8 px base rhythm drives gaps: 8, 16, 24, 32, 48, 72. Pages have an
asymmetric editorial grid with a narrow text column beside the garden stage.
Cards use clipped paper corners rather than generic rounded rectangles. Game
tiles are soft squares with a dark inner border, large enough for touch.

## Interaction grammar

The current player and selected tool share the coral edge. Selecting a tool
makes valid beds rise by 2 px; placing a token presses the bed down. Every
action writes a plain status sentence to the live region. Keyboard players use
arrow keys to move between beds, then Enter or Space to act. Touch users get
the same labelled controls.

## Motion

One atmospheric idea: seed motes drift slowly across the greenhouse and pause
when the tab is hidden. The simulation uses a fixed 60 Hz step, clamps long
frames, and renders with `requestAnimationFrame`. UI transitions take 180–240
ms and animate only opacity and transforms. Under `prefers-reduced-motion`,
all travel stops and state changes become instant. Nothing flashes.

## Art direction and asset plan

Hero prompt: “Surreal editorial illustration of a moonlit greenhouse folded
like a paper theatre, four tiny friendly garden sprites around a geometric
garden quilt, enormous translucent seed pods floating overhead, layered cut
paper and gouache texture, deep ink blue, muted cream, leaf green, coral and
rain blue palette, wide negative space on the left for a dark interface plate,
soft cinematic dusk light, no people, no hands, no text, no watermark, no
logos, no recognizable characters.”

The generated scene is used as a quiet stage backdrop on the landing page and
as the source for the social preview. Game beds, weather marks, sprites, and
icons are original CSS/SVG shapes authored in the repository. No stock assets
or external icon sets are used.

Provenance: generated with the factory Azure OpenAI image deployment on
2026-09-01. Source PNG and prompt sidecar live in `assets/src/`; optimized
WebP variants live in `public/art/`. Generated imagery is disclosed in the
footer.

## Difficulty curve

A chapter lasts 12 turns. The target starts at 18 bloom points for two players
and adds two points per extra player. Rain doubles watering, wind clears one
care mark after an action, and warm weather advances planted beds. The visitor
request adds a secondary goal. Every seed produces the same weather, garden,
and visitor request. A run can be lost when the final turn ends below either
goal; replaying the seed rewards better action ordering.

## Responsive intent

At 390 px, the hero image becomes a shallow stage behind the first screen and
the copy plate stays opaque. The game board remains a 4 × 4 grid. Secondary
explanations move below play, but weather, goal, active player, and actions stay
visible without horizontal scrolling.

