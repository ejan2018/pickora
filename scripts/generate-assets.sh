#!/bin/bash
# Generate consistent minimal-editorial brand assets for the storefront.
# Skips files that already exist so it can be safely re-run.
set -u

OUT="/home/z/my-project/public/products"
mkdir -p "$OUT"

STYLE="professional product photography, centered composition, soft diffused studio lighting, warm off-white seamless background, subtle soft shadow, muted natural tones, minimalist e-commerce editorial style, high quality, photorealistic, no text, no watermark"

gen() { # gen <file> <prompt> [size]
  local file="$1"; local prompt="$2"; local size="${3:-1024x1024}"
  if [ -s "$OUT/$file" ]; then echo "skip $file"; return 0; fi
  echo "→ $file"
  z-ai image -p "$prompt, $STYLE" -o "$OUT/$file" -s "$size" >/dev/null 2>&1 || \
  z-ai image -p "$prompt, $STYLE" -o "$OUT/$file" -s "$size" >/dev/null 2>&1 || \
  echo "FAILED: $file"
}

# Hero (portrait, asymmetric layout right side)
[ -s "$OUT/hero.png" ] || z-ai image -p "editorial still life arrangement of minimal home objects, arched plaster backdrop, ceramic vase with dried pampas grass, stacked books, folded linen textile, warm beige and cream palette with deep teal and muted gold accent objects, soft window light, gentle shadows, sophisticated minimalist aesthetic, high quality, photorealistic, no text" -o "$OUT/hero.png" -s 864x1152 >/dev/null 2>&1 && echo "→ hero.png" || echo "FAILED hero"

# Products
gen "arc-mug.png"        "matte sage green ceramic coffee mug with rounded handle"
gen "halo-lamp.png"      "matte black minimalist LED desk lamp with circular ring light head"
gen "fold-cardholder.png" "tan full-grain leather slim cardholder wallet standing upright"
gen "pulse-earbuds.png"  "stone white wireless earbuds beside open compact charging case"
gen "market-tote.png"    "natural ecru linen canvas tote bag with flat handles, standing upright"
gen "field-watch.png"    "minimalist field wristwatch with charcoal dial and cognac leather strap"
gen "orbit-clock.png"    "round minimalist wall clock with pale oak wood face and black hour markers"
gen "slate-organizer.png" "walnut wood desk organizer tray with geometric compartments"
gen "dune-sunglasses.png" "amber tortoiseshell acetate sunglasses with thin gold temples, folded"
gen "tactile-keyboard.png" "compact 65 percent mechanical keyboard with cream and grey blank keycaps"
gen "ember-candle.png"   "ribbed sage ceramic candle vessel with small lit flame on travertine stone block"
gen "weekender.png"      "olive green waxed canvas weekender duffel bag with dark leather straps"

# Extra gallery angles
gen "field-watch-2.png"  "close-up detail of charcoal dial minimalist wrist watch with cognac leather strap, three-quarter view"
gen "ember-candle-2.png" "ribbed sage ceramic candle vessel with unlit wooden wick, flat lay on beige linen with matchbox"

# Social share card
[ -s "$OUT/og.png" ] || z-ai image -p "minimalist brand social share banner, warm off-white background, small arrangement of curated objects: ceramic vase, watch, candle, linen textile, in deep teal and warm gold muted tones, generous negative space, editorial magazine cover aesthetic, photorealistic, no text" -o "$OUT/og.png" -s 1440x720 >/dev/null 2>&1 && echo "→ og.png" || echo "FAILED og"

echo "DONE"
ls -la "$OUT"
