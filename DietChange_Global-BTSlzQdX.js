const e=`## Global Diet Change Scenario\r
\r
### Overview\r
This scenario enables the exploration of diets exogenously, examining the impact of the world transitioning towards a specific diet type, which allows for the exploration of a wide range of impacts across health and the environment.\r
\r
### Reference Data\r
Here, we provide four dietary compositions in terms of their **caloric composition**, based on the FeliX Model's eight food categories:\r
\r
\r
- **Reference Diet**: Represents a baseline or current average dietary intake, based on FAO Diet Composition Statistics ([FAO, 2013](https://www.fao.org/faostat/en/#data/FBS)) calibrated for this analysis  \r
- **Healthy Diet**: Updated plant-forward diet with adjusted caloric proportions, based on [WHO Healthy Diet Guidelines](https://www.who.int/news-room/fact-sheets/detail/healthy-diet) estimated by [Springmann et al. (2018)](https://doi.org/10.1038/s41586-018-0594-0) \r
- **Mediterranean Diet**: Plant-forward with olive oil, grains, fruits, and modest meat and dairy, estimated based on general dietary guidelines  \r
- **Flexitarian Diet**: Mostly plant-based with moderate amounts of animal products, estimated based on general dietary guidelines  \r
\r
\r
| **Category**   | **Reference (%)** | **Healthy (%)** | **Mediterranean (%)** | **Flexitarian (%)** |\r
|----------------|------------------:|----------------:|----------------------:|--------------------:|\r
| **Pasture Meat**     | 1.8               | 1.34            | 1.0                   | 0.4                 |\r
| **Crop Meat**    | 5.6               | 4.09            | 6.0                   | 2.5                 |\r
| **Dairy**       | 6.8               | 7.78            | 8.0                   | 8.0                 |\r
| **Eggs**        | 1.2               | 0.74            | 2.0                   | 0.8                 |\r
| **Pulses**      | 2.4               | 6.88            | 4.0                   | 7.1                 |\r
| **Grains**      | 47.9              | 29.23           | 43.0                  | 30.0                |\r
| **Vegetable & Fruits**   | 8.3               | 11.76           | 12.0                  | 12.1                |\r
| **Other Crops**  | 26.0              | 37.45           | 24.0                  | 38.4                |"\r
`;export{e as default};
