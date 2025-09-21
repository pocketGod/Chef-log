# ChefLog

#### calc:
` Portions=segment s∑​(Guestss​×SegMult(s)×Suitability(dish,s))×Popularity×BPP `

SegMult: per-segment multiplier (e.g., adults=1, kids=0.6, vegans=1)

Suitability: 0/1 depending on dish diet vs. segment (e.g., kebab is 'meat' so Suitability=0 for 'vegans')

Rules (MVP):

Segment 'vegans' → allow only diet === 'vegan'

Segment 'vegeterians' → allow diet !== 'meat'

Segment 'kids' → if kidFriendly === false then 0, else 1

Anything else → 1