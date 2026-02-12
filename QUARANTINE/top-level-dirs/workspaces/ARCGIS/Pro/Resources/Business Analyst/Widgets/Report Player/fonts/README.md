# Description

Fonts config specifies:

- Mapping of "font-family" to font files. These fonts must be available by the fonts path passed to the `report-player-cef.initialize` method. See `report-player-cef.ts` file.
- Fonts to be cached.
- Symbols to be cached for each font in the config.

# Format

The following format is expected.

```
{
  "symbols": [
    { "name": "Range", "range": ["0x00", "0xAA"] },
    { "name": "Ranges", "ranges": [["0x00", "0xAA"]] },
    { "name": "Some symbol", "code": "0xBB" }
    { "name": "Some symbols", "codes": ["0xBB"] }
  ],
  "fonts": [{
      "font-family": "Avenir Next",
      "files": [{
          "name": "AvenirNextLTPro-Regular.ttf", // may be missing for system fonts
          "font-weight": "normal", // supported values: "normal" | "bold" | "600" (demi)
          "font-style": "normal" // supported values: "normal" | "italic"
        },
        {
          "name": "AvenirNextLTPro-Demi.ttf",
          "font-weight": "600",
          "font-style": "normal"
        },
        {
          "name": "AvenirNextLTPro-Demi.ttf",
          "font-weight": "bold",
          "font-style": "normal"
        },
        {
          "name": "AvenirNextLTPro-It.ttf",
          "font-weight": "normal",
          "font-style": "italic"
        },
        {
          "name": "AvenirNextLTPro-DemiIt.ttf",
          "font-weight": "600",
          "font-style": "italic"
        },
        {
          "name": "AvenirNextLTPro-DemiIt.ttf",
          "font-weight": "bold",
          "font-style": "italic"
        }
      ]
    },
    {
        //...
    },
    {
      //...
    }
  ]
}
```
