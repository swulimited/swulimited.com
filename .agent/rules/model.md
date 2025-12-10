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
