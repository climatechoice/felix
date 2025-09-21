import $ from "jquery";

import choiceLogo from "../imgs/choice-png.png";
import iiasaLogo from "../imgs/iiasa-png.png";
import felixLogo from "../imgs/felix-png.png";

export function loadFloatingLogos() {
  // Add logos to bottom left
  const $logoContainer = $('<div class="logo-container"></div>');

  // Logos link + image
  const $logo1Link = $(
    '<a href="https://www.climatechoice.eu/" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logo1Img = $(
    `<img src="${choiceLogo}" alt="Choice Logo" style="height: 20px;">`
  );

  const $logo2Link = $(
    '<a href="https://iiasa.ac.at/" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logo2Img = $(
    `<img src="${iiasaLogo}" alt="IIASA Logo" style="height: 24px;">`
  );

  const $logo3Link = $(
    '<a href="https://iiasa.ac.at/models-tools-data/felix" target="_blank" rel="noopener noreferrer"></a>'
  );
  const $logo3Img = $(
    `<img src="${felixLogo}" alt="FeliX Logo" style="height: 20px;">`
  );

  const $sdeLink = $(
    '<a href="https://github.com/climateinteractive/SDEverywhere" target="_blank" rel="noopener noreferrer" class="sde-link">Powered by SDEverywhere</a>'
  );

  $logo1Link.append($logo1Img);
  $logo2Link.append($logo2Img);
  $logo3Link.append($logo3Img);
  $logoContainer.append($logo1Link, $logo2Link, $logo3Link, $sdeLink);
  $("body").append($logoContainer);
}
