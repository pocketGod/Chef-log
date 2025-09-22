# Chef Log

**Core math**  
- `portions = totalGuests × BPP × popularity`  
- `ingredientAmount = portions × qtyPerPortion`

**Terms**  
- **BPP**: Base portions per person (recipe default; e.g., kebab=2 skewers/person).  
- **Popularity**: Event-specific demand multiplier (slider).  
- **qty/portion**: Ingredient amount to make **one portion**.

**Flow**  
1. Sum event segments → `totalGuests`.  
2. For each menu dish: compute `portions`.  
3. For each ingredient: add `qtyPerPortion × portions`, grouped by `(ingredientId|name, baseUnit)`.  
4. Convert big units (`g≥1000→kg`, `ml≥1000→l`; pcs unchanged) and sort by name.


**Notes**  
- Missing BPP or popularity → `1`.  
- Ingredients lacking id or name are ignored.  
- Units aren’t mixed (pcs vs g/ml kept separate) (l/ml and g/kg do mix).




**Manual deployment**  
`ng build --configuration production`
`firebase deploy --only hosting`
