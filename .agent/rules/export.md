---
trigger: always_on
---

Exporting deck

Once built, a deck can be exported using the swudb.com format.
This is a JSON based format.

Here's an example:

```json
{
  "metadata": {
    "name": "Sabine Wren - Chopper Base"
  },
  "leader": {
    "id": "SOR_014",
    "count": 1
  },
  "base": {
    "id": "SOR_030",
    "count": 1
  },
  "deck": [
    {
      "id": "SOR_141",
      "count": 3
    },
    {
      "id": "SOR_199",
      "count": 2
    },
    {
      "id": "SHD_174",
      "count": 1
    }
  ],
  "sideboard": [
    {
      "id": "SHD_172",
      "count": 2
    },
    {
      "id": "SEC_101",
      "count": 2
    },
    {
      "id": "SEC_180",
      "count": 3
    },
    {
      "id": "SHD_078",
      "count": 2
    },
    {
      "id": "LOF_128",
      "count": 1
    }
  ]

}
```

The name of the deck is set using this pattern: <leader name> - <base name>.

When exporting the deck, the selected leader / base / cards are turned into this JSON structure.
This structure is then copied to the clipboard.

The sideboard attribute includes every cards left from the pool, except leaders and bases.