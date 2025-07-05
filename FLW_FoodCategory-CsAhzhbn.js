const e=`## Food Loss and Waste Scenario (by Food Categories)\r
\r
### Overview\r
Food loss and waste vary significantly across different food categories due to their unique characteristics, production processes, and resource requirements. Understanding these differences is crucial for targeting effective interventions and reducing the overall environmental impact of the food system. \r
\r
1. **Pasture Meat** : Meat from animals raised on grasslands, such as beef and lamb. These meats have a higher environmental impact due to extensive land and water use. Losses at the production stage can be particularly impactful given the long growth cycles and resource intensity.\r
\r
2. **Crop Meat**: Meat from animals primarily fed on crops like soy and corn, including chicken and pork. Generally, they have a lower environmental footprint than pasture meats but are vulnerable to losses during harvesting, processing, and distribution due to perishability and storage challenges.\r
\r
3. **Dairy**: Products made from milk, such as cheese, yogurt, and butter. Dairy farming contributes significantly to greenhouse gas emissions and water usage. Dairy products are highly perishable, making spoilage a major cause of loss in processing, transport, and retail stages.\r
\r
4. **Eggs**: A nutrient-rich food source from poultry, including chicken, duck, and quail eggs. Eggs have a lower environmental impact compared to meat but still require feed, water, and careful handling to minimize breakage and spoilage across the supply chain.\r
\r
5. **Pulses**: Protein-rich plant foods like lentils, beans, and chickpeas. Pulses improve soil health and have a low carbon footprint. Their longer shelf life makes them less prone to loss, though storage and processing conditions can still cause losses.\r
\r
1. **Grains**  \r
Staple crops such as wheat, rice, corn, and oats. These are essential for global food security but some require high water usage and are susceptible to losses during harvesting and storage due to pests, moisture, or poor infrastructure.\r
\r
1. **Vegetables and Fruits**  \r
A diverse group including leafy greens, root vegetables, and berries. Generally have a lower environmental impact, but their perishability leads to high losses and waste throughout harvesting, transport, storage, and consumption stages. Transport and refrigeration also contribute to their environmental footprint.\r
\r
1. **Other Crops**  \r
Includes foods like nuts, sugar, and oils (palm, soybean, canola). Some, especially tropical crops like palm oil, have significant land-use impacts. Losses vary widely depending on processing complexity and storage conditions.\r
\r
---\r
\r
### Formulation\r
\r
To estimate baseline food loss and waste across major food categories, we apply average loss rates based on FAO data ([FAO, 2015](https://www.fao.org/save-food/news-and-multimedia/news/news-details/en/c/320086/)). These values represent the proportion of food that is lost or wasted across the supply chain for each category.\r
\r
The food waste and loss per category is estimated as:\r
\r
$$\r
\\text{FLW}_{\\text{food}} = \\text{TotalSupply}_{\\text{food}} \\times \\text{FLWRate}_{\\text{food}}\r
$$\r
\r
**Where:**\r
\r
- $\\text{FLW}_{\\text{food}}$: Estimated food waste and loss for a given food category  \r
- $\\text{TotalSupply}_{\\text{food}}$: Total supply of that food category  \r
- $\\text{FLWRate}_{\\text{food}}$: Average food loss and waste rate for that category (from FAO data)\r
\r
---\r
\r
### Data Inputs\r
\r
| Food Category  | FLW Rate |\r
|----------------|----------|\r
| PasMeat        | 0.20     |\r
| CropMeat       | 0.20     |\r
| Dairy          | 0.20     |\r
| Eggs           | 0.20     |\r
| Pulses         | 0.20     |\r
| Grains         | 0.30     |\r
| VegFruits      | 0.45     |\r
| OtherCrops     | 0.20     |\r
\r
*Source: [FAO (2015)](https://www.fao.org/save-food/news-and-multimedia/news/news-details/en/c/320086/)*\r
\r
`;export{e as default};
