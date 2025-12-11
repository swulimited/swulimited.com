---
trigger: always_on
---

Model

The following entities are used in the app.

Consider that all attributes are never `null` by default.
Whenever an attribute is nullable and the value is `null`,
skip this attribute instead of setting the value to `null`.

# Card set

Enum values:
- LOF
- SEC

# Card type

Enum values:
- leader
- base
- unit
- upgrade
- event
- token

# Card rarity

Enum values:
- common
- uncommon
- rare
- legendary
- special

# Card aspect

Enum values:
- vigilance
- command
- aggression
- cunning
- villainy
- heroism

# Card

Attributes:
- id (string)
- set (Card set)
- number (number)
- type (Card type)
- rarity (Card rarity)
- aspects (array of Card aspect)
- name (string)
- title (string, nullable)
- art (string)

A card belongs to a card set.

The card id is built using the set and the number, following this pattern: <set> + "-" + <number>.
If the number value is less than 100, pad it with a leading '0'.

Use the card number when sorting cards.

# Booster pack

Attributes:
- set (Card set)
- cards (Card array)

Each booster pack contains exactly 16 cards.
Among those 16, the first one is guaranteed to be a leader card, and the second card is guaranteed to be a base.
That leaves 14 cards remaining that are pulled from the pool of “standard” (non-leader, non-base, non-token) cards.

Outside of the cards that are exclusive to starter decks, the cards in this game are divided into four rarities: Common, Uncommon, Rare, and Legendary. In each booster pack, you will find 9 Common cards, 3 Uncommon cards, and 1 Rare or Legendary card.

There are special rules for some sets:
- in LOF there is no rare base in the base slot, only common bases
- in LOF you may find a rare base in the rare/legendary slot

The final card in a pack can be of any rarity, except you will not find a base in this slot.