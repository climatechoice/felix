import $ from "jquery";
import { createInfoIcon } from "../lib/utils.js";

const guideAssetBaseUrl = `${import.meta.env.BASE_URL}workshop_guides/`;

const workshopGuideFiles = [
  {
    title: "Interface Guide",
    pdf: "Interface_Guide.pdf",
    audience: "All",
    summary: "A supplementary page to show the key functionalities of the interface."
  },
  {
    title: "What happens if the world eats like you?",
    pdf: "Faciliation_Guide_Consume.pdf",
    audience: "All Ages",
    summary: "A guide for a booth event allowing consumers to explore the environmental and social impacts of their food behaviours."
  },
  {
    title: "Diet Change, or more Alternative Proteins?",
    pdf: "Faciliation_Guide_AltProteins.pdf",
    audience: "Students",
    summary: "A short experiment to understand the benefits as well as limits of widespread adoption of alternative proteins."
  }
];

const templateGuide = {
  title: "DOCX Template",
  source: "raw_files/Faciliation_Guide_Template.docx"
};

export function showFacilitationGuideLibrary() {
  const sampleGuideLines = workshopGuideFiles
    .map((guide, index) => `
      <div class="guide-library-row" id="guide-library-row-${index}">
        <div class="guide-library-row-main">
          <span class="guide-library-row-title">${guide.title}</span>
          <span class="guide-library-tag">${guide.audience}</span>
          <span class="guide-library-row-info"></span>
        </div>
        <button class="guide-open-pdf guide-library-action guide-library-action-primary" data-file="${guideAssetBaseUrl}${guide.pdf}">Open PDF</button>
      </div>
    `)
    .join("");

  const popup = $(
    `
    <div class="popup popup-middle survey-popup guide-library-popup">
      <div class="guide-library-shell">
        <div class="guide-library-header">
          <div>
            <h2 class="guide-library-title">
              <span class="material-icons guide-library-title-icon">layers</span>
              <span>Facilitation Guide Library</span>
            </h2>
            <p class="guide-library-subtitle">Explore sample facilitation guides from past events, and use DOCX templates for your own use.</p>
          </div>
          <button class="popup-close" aria-label="Close">
            <span class="material-icons">close</span>
          </button>
        </div>
        <section class="guide-library-panel guide-library-panel-samples">
          <h4>Sample guides</h4>
          <div class="guide-library-list">
            ${sampleGuideLines}
          </div>
          <div class="guide-library-footer">
            <h4>Edit and Contribute</h4>
            <p>These sample guides are available for you to use. If you would prefer to design your own workshop, you can use the DOCX template provided. If you would like to contribute to our existing sample guides, please contact us at tanryan@iiasa.ac.at.</p>
            <div class="guide-library-template-actions">
              <button class="guide-open-source guide-library-action guide-library-action-secondary" data-file="${guideAssetBaseUrl}${templateGuide.source}">
                Download DOCX template
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
  );
  const overlay = $('<div class="popup-overlay"></div>');

  const closePopup = () => {
    overlay.remove();
    popup.remove();
  };

  overlay.on("click", closePopup);
  popup.find(".popup-close").on("click", closePopup);
  popup.on("click", ".guide-open-pdf, .guide-open-source", function () {
    const file = $(this).data("file");
    if ($(this).hasClass("guide-open-source")) {
      const downloadLink = document.createElement("a");
      downloadLink.href = file;
      downloadLink.download = "";
      downloadLink.rel = "noopener noreferrer";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      return;
    }

    window.open(file, "_blank", "noopener,noreferrer");
  });

  workshopGuideFiles.forEach((guide, index) => {
    const $slot = popup.find(`#guide-library-row-${index} .guide-library-row-info`);
    const $icon = createInfoIcon(guide.summary, { graph: true });
    $slot.append($icon);
  });

  overlay.append(popup);
  $("body").append(overlay);
}
