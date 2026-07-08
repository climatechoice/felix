const e=`## Global Animal Feed Scenarios\r
\r
### Overview\r
This scenario explores alternative feed mixes for animal-based food production in the FeliX model, where livestock are fed crops grown on cropland. These scenarios apply only to crop-based meat (“crop meat”); grazing livestock (“pasture meat”) are not affected, as they rely primarily on grass rather than feed crops.\r
\r
These are stylized policy experiments representing different feed strategies discussed in agriculture and sustainability debates. They change the composition of crops used as animal feed. Some scenarios can also adjust total feed demand, reflecting differences in feed-use efficiency.\r
\r
---\r
\r
### Stylized Scenarios\r
\r
The feed scenarios are expressed as **relative feed demand** across the FeliX Model's four feed crop categories.\r
\r
- **Grains**  \r
  Increases the share of cereal grains in livestock feed, replacing other feed sources. This raises pressure on cropland and typically increases greenhouse gas emissions, water use, and competition between feed and human food systems (Herrero et al., 2013; IPCC, 2019).\r
\r
- **Reference**  \r
  Represents the current global average feed composition, based on FAO Food Balance Sheets (FAO, FAOSTAT, n.d.). It serves as the baseline against which alternative feed strategies are compared.\r
\r
- **Protein**  \r
  Substitutes part of cereal grain feed with pulses. This reduces reliance on synthetic nitrogen fertilizer and can lower emissions and water use, but may increase land demand due to lower yield densities of protein crops (Poore & Nemecek, 2018).\r
\r
- **By-Products**  \r
  Replaces dedicated feed crops with a higher share of agricultural co-products and processing residues. This reduces demand for additional cropland and generally lowers environmental pressures across land use, emissions, and resource use by improving system-wide efficiency (van Zanten et al., 2018; Mottet et al., 2017).\r
<br>\r
\r
| **Feed Category** | **Grain-Intensive Feed** | **Reference Feed** | **Protein Feed** | **By-Product Feed** |\r
|-------------------|-------------------------:|------------------:|------------------:|--------------------:|\r
| **Pulses** | 0.010 | 0.014 | 0.180 | 0.030 |\r
| **Grains** | 0.850 | 0.715 | 0.150 | 0.050 |\r
| **Vegetables & Fruits** | 0.150 | 0.223 | 0.120 | 0.150 |\r
| **Other Crops** | 0.050 | 0.048 | 0.200 | 0.300 |\r
| **Total Feed Demand** | **1.06** | **1.00** | **0.85** | **0.90** |\r
\r
\r
_Relative feed demand across the FeliX Model's feed crop categories. Totals different from one represent stylized changes in overall feed-use efficiency._\r
\r
---\r
\r
### References\r
- FAO (FAOSTAT). Food Balance Sheets.\r
- Herrero, M. et al. (2013). Biomass use, production, and efficiency in livestock systems.\r
- Poore, J. & Nemecek, T. (2018). Reducing food’s environmental impacts. Science.\r
- Tilman, D. & Clark, M. (2014). Global diets link environmental sustainability and health. Nature.\r
- van Zanten, H. et al. (2018). Circular livestock systems and land use limits. Global Change Biology.\r
- Mottet, A. et al. (2017). Feed-food competition and livestock efficiency. Global Food Security.`;export{e as default};
