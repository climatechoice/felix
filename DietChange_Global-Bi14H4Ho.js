const e=`## Global Diet Change Scenario\r
\r
### Overview\r
This scenario enables the exploration of diets exogenously, examining the impact of the world transitioning towards a specific diet type, which allows for the exploration of a wide range of impacts across health and the environment.\r
\r
---\r
\r
### Reference Data\r
Here, we provide five dietary compositions in terms of their **caloric composition**, based on the FeliX Model's eight food categories:\r
\r
- **Meat Diet**: Represents a high animal product intake based on existing US 2018 dietary patterns ([USDA, 2018](https://www.ers.usda.gov/data-products/food-consumption-nutrient-intakes-and-diet-quality))  \r
- **Affluent Diet**: Represents a high-income dietary pattern based on OECD average dietary estimates  \r
- **Reference Diet**: Represents a baseline or current average dietary intake, based on FAO Diet Composition Statistics ([FAO, 2013](https://www.fao.org/faostat/en/#data/FBS)) calibrated for this analysis  \r
- **Healthy Diet**: Updated plant-forward diet with adjusted caloric proportions, based on [WHO Healthy Diet Guidelines](https://www.who.int/news-room/fact-sheets/detail/healthy-diet)\r
- **Flexitarian Diet**: Mostly plant-based with moderate amounts of animal products, based on the [EAT-Lancet Planetary Health Diet](https://eatforum.org/eat-lancet/the-planetary-health-diet/)\r
\r
<br>\r
\r
| **Category**         | **Meat (%)** | **Affluent (%)** | **Reference (%)** | **Healthy (%)** | **Flexitarian (%)** |\r
|----------------------|-------------:|-----------------:|------------------:|----------------:|--------------------:|\r
| **Pasture Meat**     | 9.6          | 6.0              | 1.8               | 1.34            | 0.4                 |\r
| **Crop Meat**        | 8.4          | 8.4              | 5.6               | 4.09            | 2.5                 |\r
| **Dairy**            | 10.0         | 1.2              | 6.8               | 7.78            | 8.0                 |\r
| **Eggs**             | 1.2          | 4.8              | 1.2               | 0.74            | 0.8                 |\r
| **Pulses**           | 4.8          | 10.0             | 2.4               | 6.88            | 7.1                 |\r
| **Grains**           | 30.0         | 30.0             | 47.9              | 29.23           | 30.0                |\r
| **Vegetable & Fruits** | 17.0       | 17.0             | 8.3               | 11.76           | 12.1                |\r
| **Other Crops**      | 19.0         | 22.6             | 26.0              | 37.45           | 38.4                |\r
\r
_Caloric composition (%) of each diet across the FeliX Model's eight food categories._\r
\r
---\r
`;export{e as default};
