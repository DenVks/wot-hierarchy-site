# Monster scene format v1

Introduced in site release v179. Schema v1 retains the wot-bestiary-v178 catalog identifier.

The executable contract is `assets/monster-scene.js`. UI, persistence and catalog reconstruction are in `assets/monster-scene-ui.js`. The battle page provides creature definitions and actions. Tests: `tools/verify-monster-scene.cjs` and `tools/verify-monster-copies.cjs`.

## Envelope

JSON object with `format: "wot-monster-scene"`, `version: 1`, `dataset: "wot-bestiary-v178"`, `sceneId`, `name`, `savedAt` and the following fields:

| Field | Meaning |
|---|---|
| creatures | Loaded catalog records and encounter copies; each references a local templateId |
| initiative | Ordered entries: id, val, name, z, manual |
| turnIndex | Current initiative entry; zero for an empty queue |
| round, running, turnSerial | Round, active/paused state, serial for explicitly selected/advanced turns |
| nextCloneId | Next encounter-copy sequence; greater than every existing clone ID |
| selectedId, tab | Selected creature card and local tab; selection may differ from the current actor |
| backgroundId, backgroundExpanded | Environment selection and its disclosure state |
| log | At most 100 scene events, with text and a round/turn stamp |

Each creature record has `id`, `templateId`, `cloneNo` (null for catalog entries), four editable defense strings in `profile`, their background-origin maps in `sources`, known background trait IDs in `traits`, and `state`.

State contains current `hp`, six supported condition flags in `conds`, phase 1/2 where applicable, `bleach` marks, initiative value/null, and `roll` results keyed by attack index or `quick`. Each saved roll has plain `text`; no imported HTML is executed. Maximum HP, attacks and the original rule text are resolved from the installed bestiary rather than copied from an arbitrary imported statblock.

Custom defense edits and traits added by known backgrounds are reconstructed on top of the canonical local template. Imported names for manual initiative participants are rendered as escaped text. Identifiers, references, ranges, duplicate entries, structural depth and prototype-related keys are checked before replacement. Unknown templates, backgrounds, dataset or schema versions are rejected.

The file input accepts JSON up to 4 MiB. There can be at most 1000 creature records and 1000 queue entries. One batch adds 1–20 copies. New game-state fields require an explicit schema decision and migration; silently dropping future resources is not a compatibility strategy.

## Turn semantics

- Initiative can be assembled before combat. Starting sets round 1 and selects the first actor.
- Next turn advances once; wrapping increments the round. Pause prevents advancement; resume retains actor and round.
- Sorting preserves the active actor, including while a started combat is paused.
- Removing an earlier entry adjusts the index to preserve the actor. Removing the current entry selects its successor; removing the final entry stops combat and clears the round display.
- Clicking a queue entry is a manual correction of the current turn, recorded in the log; it does not infer a new round.
- A creature at 0 HP remains in the queue until the Master removes it. No automatic death, concentration, recharge or recurring-damage rule is invented.
- "Сброс бросков" clears selected roll displays only. It is separate from advancing a turn or round.

## Persistence and replacement

Current key: `wot.monsterScene.v1`. Backup key: `wot.monsterScene.backup.v1`. No previous persistent monster-scene schema existed in this implementation.

Rendering an updated scene validates and saves its state; dice actions also save their structured result. A fingerprint avoids redundant writes. Write failures remain visible; the live scene is retained. Unreadable saves are not overwritten automatically.

Import parses and validates the complete file, then shows a preview. Confirming replacement backs up the live scene before applying the prepared result; cancel changes no participants. Creating a new scene uses the same backup rule. An unreadable original is separately retained under a `.unreadable.<timestamp>` key when the user explicitly replaces it. Backup failure aborts replacement. The backup UI itself uses the same preview/confirm path.

Export is a local JSON download. It requires the same dataset on the receiving installation. A different dataset/schema requires a deliberate migration or a clear rejection; arbitrary statblock import and merging scenes are outside v1. The active tab and state are restored after reload. Query links that add packs are not reapplied when restoring an existing saved scene.

## Scope

This format preserves the counters already tracked by the battle tool. It does not introduce a generalized resource system for all legendary actions, reactions or recharge mechanics, nor a combined NPC/monster encounter. Those need separate data contracts. The scene journal records explicit commands and reminders; the Master resolves game effects.
