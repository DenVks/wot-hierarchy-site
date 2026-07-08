# NPC42 Audit v121 — Селайн Ко'таллен

## Source files

- `NPC_CARD_REVIEW_CHECKLIST_FOR_NEW_CHAT.md`
- `wot_npc_dm_12_NPC42.html`
- Working site state: `wot_hierarchy_site_v120_FULL_FROM_V119.zip`

## Checklist mode

The review was repeated according to the new NPC checklist: identity, stats, proficiency bonus, HP formula, AC, attacks, saves, skills, class features, weave math, hierarchy bonuses, feature `(i)` links, equipment, combat tab, tactics, data structure, and technical checks.

## Identity

- ID: `42` — unique in `assets/npc-data.js`.
- Name: `Селайн Ко'таллен`.
- Class: `Направляющая (Дичок) 16`.
- Origin: `Шончан`.
- Hierarchy: `Хрустальный Трон, Ранг IV`.
- Role: high-rank hidden channeler / Governor-class battlefield controller.

## Stats

Final stats remain:

```text
STR 10 (+0)
DEX 17 (+3)
CON 24 (+7)
INT 13 (+1)
WIS 24 (+7)
CHA 8 (-1)
```

Reasoning preserved from source:

```text
Base array: 15, 15, 14, 12, 10, 8
Seanchan: CON +2, Sturdy +1 HP per level
ASI: WIS +2; WIS +1 / CON +1; DEX +2; DEX +1 / INT +1
Before hierarchy: WIS 18, CON 18, DEX 17, INT 13, STR 10, CHA 8
Rank IV distribution for this governor-channeler: WIS +6, CON +6 -> WIS 24, CON 24
```

No stat exceeds the accepted hierarchy ceiling of 24 for this NPC.

## Proficiency bonus

Level 16 -> proficiency bonus `+5`.

Used consistently in:

- weave DC;
- weave attack;
- class saves;
- skills;
- Imperial Command / Fear Aura DC.

## HP audit

Dichok hit die: `d6`, rounded average `4`.

Rank III inherited hierarchy rule applies `Hit Dice ×1.5`; Rank IV adds `+20 HP`.
Only the Hit Dice part is multiplied; CON is not multiplied.

Formula:

```text
HD part: 6 + 15×4 = 66
Hierarchy multiplier: 66 × 2.5 = 165
CON part: 16 × 7 = 112
Subtotal: 277
Rank IV fixed HP: +20
Seanchan Sturdy: +16
Total: 313 HP
```

Status: `313 HP` remains valid.

## AC audit

```text
Leather armor +3: 11 + DEX 3 + magic 3 = 17
Ring of Protection +2 = 19
Final AC = 19
```

Status: valid.

## Weave DC / attack audit

```text
Base weave DC: 8 + PB 5 + WIS 7 + Rank IV DC bonus 3 = 23
Fire Elementalism Dexterity-save DC: 23 + Durable Weaves 1 = 24
Weave attack: PB 5 + WIS 7 + Angrial level 5 attack bonus 3 = +15
```

Status: valid.

## Slots audit

Dichok 16 base slots:

```text
5 / 5 / 5 / 4 / 4 / 3 / 2 / 1
```

Rank IV adds `+4` extra weaves/slots one level below the maximum available slot level. Maximum slot level is 8, so the extra slots are 7th-level slots.

Final slots:

```text
5 / 5 / 5 / 4 / 4 / 3 / 6 / 1
```

Status: valid.

## Corrections applied in v121

### 1. Imperial Command DC

Old v120 text used `DC 11`, because it omitted proficiency bonus.

Correct formula from the hierarchy ability:

```text
8 + proficiency 5 + CHA modifier (-1) + hierarchy rank 4 = DC 16
```

Updated:

- `Аура Имперской Власти` card;
- `hi.items` hierarchy summary;
- tactics block;
- `co.cr` summary.

### 2. Create Fire / Создать огонь

Old v120 attack card treated Create Fire as possible attack-roll output with `+15`.

Correct standard weave behavior:

```text
Dexterity save, half damage
DC 24
Duration: Concentration
```

Updated:

- attack card: `a: СЛ 24`;
- spell table: `sb: Лов пол., СЛ 24`;
- spell duration: `Конц.`;
- notes: no attack roll.

### 3. Dagger attack added

Equipment listed a simple dagger, but no corresponding attack existed. Added:

```text
Кинжал (простое оружие)
Attack: +8 = DEX 3 + PB 5
Damage: 1к4+3 piercing
Range: melee / 20-60 ft
```

### 4. Skills made explicit

Added transparent non-proficient / hierarchy-relevant skills:

```text
Восприятие +7 -> passive Perception 17
Запугивание +4, with advantage from Aura of Imperial Authority
```

## Feature `(i)` links

Important traits are covered by existing lookup sources:

- class features and exceptional talents -> `assets/classes-data.js`;
- hierarchy features -> `assets/hierarchy-data.js`;
- weave descriptions -> `assets/weaves-data.js`.

The v120 alias handling in `assets/dm-npc.js` remains sufficient for NPC42 feature names. No new lookup code was required in v121.

## Remaining accepted homebrew / explicit source assumptions

The source NPC file explicitly grants all three exceptional-talent stages for all three talents as a homebrew enhancement. This exceeds the ordinary one-choice-per-stage reading, but the source says it was a direct user-level decision. It is retained.

The source NPC file uses WIS/CON as the key hierarchy attributes for this hidden governor-channeler instead of the generic STR/CHA martial default. This is retained as an NPC-specific hierarchy distribution.

## Technical checks

Executed:

```bash
node --check assets/npc-data.js
node --check assets/npc-rules-data.js
node --check assets/hierarchy-data.js
node --check assets/dm-npc.js
```

Additional checks:

```text
NPC_DATA count: 42
Duplicate ids: none
NPC 42 found: yes
HP: 313
AC: 19
Attacks include dice expressions: yes
Dagger attack: yes
Create Fire fixed to save DC: yes
Imperial Command fixed to DC 16: yes
No TODO / уточнить у DM / требует выбора in NPC42 object
```

## Final status

NPC42 is mechanically cleaner than v120. The active corrections are limited and do not alter the core concept, HP, AC, rank, slots, or main damage profile.
