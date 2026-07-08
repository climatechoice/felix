const e=`## Agricultural Productivity Scenarios\r
\r
### Overview  \r
This scenario explores alternative levels of agricultural productivity in the FeliX model. It represents different assumptions about how efficiently crops can be produced on existing agricultural land, *without* changing land area or introducing additional environmental pressures.\r
\r
These are stylized policy experiments reflecting a plausible range of productivity outcomes. The scenarios are applied independently for each crop type, meaning pulses, grains, vegetables & fruits, and other crops can experience different levels of productivity change under the same scenario setting.\r
\r
---\r
\r
### Stylized Scenarios\r
\r
The productivity scenarios are expressed as **relative yield changes compared to the current baseline**.\r
\r
| Crop Type | "-20%" | "-10%" | Reference | "10%" | "20%" |\r
|-----------|-------:|-------:|----------:|------:|------:|\r
| **Pulses** | 0.75 | 0.90 | 1.00 | 1.10 | 1.20 |\r
| **Grains** | 0.70 | 0.88 | 1.00 | 1.12 | 1.25 |\r
| **Vegetables & Fruits** | 0.80 | 0.92 | 1.00 | 1.05 | 1.12 |\r
| **Other Crops** | 0.75 | 0.90 | 1.00 | 1.08 | 1.18 |\r
\r
---\r
\r
### Heterogeneous productivity potential\r
\r
Differences in productivity potential across crop groups reflect established findings in the agronomic literature. Yield growth has historically been stronger for staple cereals than for legumes and many horticultural crops due to differences in breeding intensity, input responsiveness, and mechanisation potential (Ray et al., 2013). At the same time, pulses and legumes tend to have slower yield growth but can benefit from underinvestment in breeding and biological nitrogen fixation advantages in low-input systems (FAO, 2016).\r
\r
---\r
\r
### References  \r
- FAO (2016). *Pulses: Nutritious seeds for a sustainable future.*  \r
- Fischer, T. et al. (2014). *Yield gaps and global food security.* Field Crops Research.  \r
- Mueller, N. D. et al. (2012). *Closing yield gaps through nutrient and management improvements.* Nature.  \r
- Ray, D. K. et al. (2013). *Yield trends are insufficient to double global crop production by 2050.* PLoS ONE.  `;export{e as default};
