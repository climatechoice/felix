const e=`## Food Loss and Waste Scenario (by Supply Chain)\r
\r
### Overview\r
Food loss and waste occur across the entire food supply chain - from initial production to final consumption. According to the Food and Agriculture Organization (FAO), **food loss** refers to the decrease in edible food mass that takes place during production, post-harvest, and processing stages - primarily due to infrastructural, logistical, or technical constraints. In contrast, **food waste** occurs at the retail and consumption stages and is often driven by behavioral or economic factors, such as over-purchasing, portion sizes, or the discarding of food that is still safe and edible ([FAO, 2014](http://www.fao.org/platform-food-loss-waste)).\r
\r
### Supply Chain Stages\r
![Drivers of Food Loss and Waste Throughout the Supply Chain](https://champions123.org/sites/default/files/inline-images/drivers-of-food-loss-and-waste-throughout-the-supply-chain.png)\r
\r
Earlier stages of the supply chain (e.g., primary production and post-harvest) are typically more prone to **food loss**, while the later stages - particularly **consumption** - are where **food waste** is most prevalent. Each stage presents both challenges and opportunities for reducing inefficiencies and improving the sustainability of food systems.\r
\r
\r
(1) **Primary Production.** This is the stage where crops are harvested or animals are raised for food. *Losses occur due to:*  \r
- Pests, diseases, or extreme weather  \r
- Harvesting inefficiencies (e.g., overripe or underripe crops left behind)  \r
- Market or price fluctuations (e.g., food not harvested due to low market value)  \r
- Cosmetic standards (produce rejected due to shape/appearance)  \r
\r
\r
(2) **Post-Harvest Handling & Storage.** This is the stage where food is collected, sorted, cleaned, and stored before further processing or transport. *Losses occur due to:*  \r
- Poor storage conditions (e.g., lack of refrigeration or pest protection)  \r
- Inadequate infrastructure (e.g., damaged transport, lack of cooling)  \r
- Delays that reduce freshness, especially for perishables  \r
\r
(3) **Processing & Packaging.** This is the stage where raw food is transformed into consumer-ready products (e.g., milling, canning, freezing). *Losses occur due to:*  \r
- Trimming and processing waste (e.g., peels, bones, offcuts)  \r
- Equipment inefficiencies or downtime  \r
- Quality control rejections  \r
- Overproduction or batch spoilage  \r
\r
(4) **Distribution & Retail.** This is the stage where food is transported to retailers and sold to consumers. *Losses occur due to:*  \r
- Damage during transport (e.g., spoilage, packaging failure)  \r
- Inadequate temperature control (cold chain issues)  \r
- Overstocking and expired goods at retail  \r
- Rejection of items that don't meet aesthetic or size standards  \r
\r
\r
(5) **Consumption.** This is the stage where food is purchased, prepared, and eaten by consumers or served in food services. *Waste occurs due to:*  \r
- Over-purchasing or improper storage at home  \r
- Confusion over ""best before"" and ""use by"" labels  \r
- Plate waste in households, restaurants, and cafeterias  \r
- Cultural preferences and lack of awareness about waste "\r
\r
---\r
\r
### Formulation\r
To estimate food loss and waste across the supply chain, we utilize data from Cecilia et al. ([2019](https://link.springer.com/chapter/10.1007/978-3-030-10961-5_11])), which derives loss and waste proportions based on FAO statistics.\r
\r
Food losses and waste occur at various stages of the supply chain and differ depending on the type of food. This formula calculates the final food waste and loss for each food category by adjusting for variations within supply chain segments and accounting for their respective contributions:\r
\r
\r
$$\r
\\text{FWL}_{\\text{food}} = \\text{FWLVar}_{\\text{supplychain}} \\times \\text{FWLShare}_{\\text{supplychain, food}}\r
$$\r
\r
**Where:**\r
\r
- $\\text{FWL}_{\\text{food}}$: Final food waste and loss for a specific food category (food)  \r
- $\\text{FWLVar}_{\\text{supplychain}}$: Variation factor in the supply chain segment (expressed as a multiplier, e.g., 1.1 for +10%)  \r
- $\\text{FWLShare}_{\\text{supplychain, food}}$: Share (proportion) of the supply chain segment's contribution to the food waste and loss in the food category (between 0 and 1)  \r
\r
\r
\r
---\r
\r
\r
\r
### Estimated Input Data for FeliX\r
\r
| Stage             | PasMeat | CropMeat | Dairy | Eggs | Pulses | Grains | VegFruits | OtherCrops |\r
|-------------------|---------|----------|-------|------|--------|--------|-----------|------------|\r
| Primary Production | 3.1     | 3        | 7.1   | 7.1  | 1.9    | 14.5   | 9         | 1.9        |\r
| Post-Harvest      | 6       | 7        | 4.7   | 4.7  | 1.9    | 2.1    | 6         | 1.9        |\r
| Processing        | 4.7     | 5        | 1.2   | 1.2  | 4.8    | 4.1    | 9         | 4.6        |\r
| Distribution      | 1.1     | 1        | 2.3   | 2.3  | 3.8    | 5.2    | 7         | 4.2        |\r
| Consumption       | 5.1     | 4        | 4.7   | 4.7  | 7.6    | 4.1    | 14        | 7.4        |\r
| **Total**         | **20%**  | **20%**   | **20%**|**20%**| **20%** | **30%** | **45%**    | **20%**     |\r
\r
<br>\r
\r
<img src="https://www.researchgate.net/profile/Ja-Cecilia/publication/332416505/figure/fig1/AS:751882171609088@1556274087304/Percentage-of-food-waste-along-the-food-supply-chain-Source-FAO.png" alt="Percentage of food waste along the food supply chain" style="margin: 0 20px 20px 0; width: 350px;" />\r
\r
**Source*:  Cecilia et al. ([2019](https://link.springer.com/chapter/10.1007/978-3-030-10961-5_11])) based on FAO Data.\r
\r
`;export{e as default};
