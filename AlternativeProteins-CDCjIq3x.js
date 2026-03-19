const e=`## Alternative Protein Scenario\r
*Based on:* Yang, A., Throp, H., & Sherman, S. (2024). How strategic collaboration on the bioeconomy can boost climate and nature action. Chatham House. [https://doi.org/10.55317/9781784136253](https://www.chathamhouse.org/2024/10/how-strategic-collaboration-bioeconomy-can-boost-climate-and-nature-action/04-innovation)\r
\r
### Overview and Structure \r
The **Alternative Protein Scenario** explores the transition from traditional animal-based proteins to alternative protein technologies. The scenario highlights the technological influences of food production and how they cascade through the agricultural system to influence land use. It allows the exploration of different adoption trajectories and their implications for food system sustainability.\r
\r
---\r
\r
### Scenario Structure\r
This scenario is structured around three key stages:\r
\r
1. **Replacement Share** _(Actions)_: Determines the market share of animal proteins replaced by alternative proteins, set by a target year. Within FeliXSim's Food Categories, they are: **Pasture-based Meat**, **Crop-based Meat**, **Dairy**, and **Eggs**.\r
\r
2. **Replacement Technology** _(Uncertainties)_: Determines the proportion of each animal food category that can be met by each emerging AP technology:\r
\r
	- **Plant-based Proteins** — Products made entirely from plants that mimic the taste and texture of meat, dairy, or eggs. Think burgers made from pea protein (e.g. Beyond Meat), oat or soy milk, or plant-based cheese. Their production increases demand for **Pulses** (peas, lentils), **Grains** (soy, wheat), and **Other Crops** (vegetable oils).\r
\r
	- **Precision Fermentation** — Microorganisms (like yeast or bacteria) are programmed to produce specific proteins that are molecularly identical to animal proteins — without the animal. The result is things like animal-free whey protein, egg whites, or cheese cultures. Their production increases demand for **Grains** and **Other Crops** (sugars and starches from sugarcane, maize) as feedstock to feed the microorganisms.\r
\r
	- **Cultivated Meat** — Real animal muscle cells are grown in a bioreactor from a small tissue sample, producing actual meat without slaughter. Think lab-grown chicken breast or beef mince. Their production increases demand for **Grains** and **Other Crops** (sugars, amino acids, and growth media often derived from maize or soy) to grow the cells.\r
\r
3. **Changing Caloric Demand**: As animal proteins are replaced, crop demand shifts to meet the feedstock needs of each AP technology. See below for estimated crop demands by technology type.\r
\r
---\r
\r
### Reference Scenario for Range of Animal Protein Replacement\r
|     | **Plant-based**                                                                  | **Precision Fermentation**                                                         | **Cultivated Meat**                                          |\r
|------------------------|----------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|--------------------------------------------------------------|\r
| **Pasture-based Meat** | 20-50% replacement (mainly processed/ready meals)                               | 7.5-35% replacement (processed/ready meals and some cuts)                          | 10% of raw cuts, 30% of processed meats                       |\r
| **Crop-based Meat**    | 20-25% replacement (processed chicken/pork)                                      | ~5% chicken replacement                                                             | 30% replacement (e.g. chicken breasts)                        |\r
| **Dairy**       | 10% of liquid milk, 5% cream, 10% cheese                                         | Up to 90% of milk and cheese, all milk powders                                     | !Cannot replace                                               |\r
| **Eggs**               | !Cannot replace                                                                   | Up to 40% of shell eggs (mostly in ingredients, e.g. baking)                       | !Cannot replace                                               |\r
\r
_Estimated maximum replacement potential of conventional animal proteins by alternative protein technology type. Values represent the share of each food category that could feasibly be substituted under high-adoption scenarios._\r
\r
> *Note*: Plant-based and precision fermentation primarily replace processed foods and ingredient-based uses, while cultivated meat can begin to replace certain whole cuts and **center-of-plate** products.\r
\r
---`;export{e as default};
