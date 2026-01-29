/**
 * YearRangeModal.js
 * Modal dialog for customizing year range settings
 */

import $ from "jquery";
import { defaultMinYear, defaultMaxYear, presentYear, resetYearRangeSettings } from "../stores/year-range-store.js";
import { selectedGraphCount } from "../stores/layout-store.js";
import { initGraphsUI } from "./GraphsUI.js";

export class YearRangeModal {
  constructor() {
    this.isOpen = false;
    this.createModal();
    this.bindEvents();
  }

  createModal() {
    const modalHTML = `
      <div id="year-range-modal" class="year-range-modal">
        <div class="year-range-modal-content">
          <div class="year-range-modal-header">
            <h2>Year Range Settings</h2>
            <button class="year-range-modal-close">&times;</button>
          </div>
          <div class="year-range-modal-body">
            <p class="year-range-modal-description">
              Configure default year ranges for graphs. These values are used when year ranges 
              are not explicitly defined in graphs.csv.
            </p>
            
            <div class="year-range-setting-group">
              <label for="default-min-year">
                <span class="material-icons">calendar_today</span>
                Default Minimum Year
              </label>
              <input 
                type="number" 
                id="default-min-year" 
                min="1900" 
                max="2200" 
                step="1"
                value="2000"
              />
              <span class="year-range-hint">Used for graphs without xAxisMin defined</span>
            </div>

            <div class="year-range-setting-group">
              <label for="default-max-year">
                <span class="material-icons">event</span>
                Default Maximum Year
              </label>
              <input 
                type="number" 
                id="default-max-year" 
                min="1900" 
                max="2200" 
                step="1"
                value="2050"
              />
              <span class="year-range-hint">Used for graphs without xAxisMax defined</span>
            </div>

            <div class="year-range-setting-group">
              <label for="present-day-year">
                <span class="material-icons">today</span>
                Reference Line Year (Dotted Line)
              </label>
              <input 
                type="number" 
                id="present-day-year" 
                min="1900" 
                max="2200" 
                step="1"
                value="2025"
              />
              <span class="year-range-hint">The year shown as a dotted vertical line on graphs</span>
            </div>
          </div>
          <div class="year-range-modal-footer">
            <button class="year-range-modal-btn year-range-modal-btn-secondary" id="year-range-reset">
              Reset to Defaults
            </button>
            <button class="year-range-modal-btn year-range-modal-btn-primary" id="year-range-apply">
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);
    this.$modal = $("#year-range-modal");
  }

  bindEvents() {
    // Close modal on X button click
    this.$modal.find(".year-range-modal-close").on("click", () => {
      this.close();
    });

    // Close modal on outside click
    this.$modal.on("click", (e) => {
      if ($(e.target).is(this.$modal)) {
        this.close();
      }
    });

    // Close on Escape key
    $(document).on("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    // Reset button
    $("#year-range-reset").on("click", () => {
      resetYearRangeSettings();
      this.loadCurrentSettings();
    });

    // Apply button
    $("#year-range-apply").on("click", () => {
      this.applyChanges();
    });

    // Validation on input
    this.$modal.find("input[type=number]").on("change", function() {
      const $input = $(this);
      const value = parseInt($input.val(), 10);
      const min = parseInt($input.attr("min"), 10);
      const max = parseInt($input.attr("max"), 10);

      if (value < min) $input.val(min);
      if (value > max) $input.val(max);
    });
  }

  loadCurrentSettings() {
    // Subscribe to stores and update inputs
    const unsubMinYear = defaultMinYear.subscribe(value => {
      $("#default-min-year").val(value);
    });
    const unsubMaxYear = defaultMaxYear.subscribe(value => {
      $("#default-max-year").val(value);
    });
    const unsubPresentYear = presentYear.subscribe(value => {
      $("#present-day-year").val(value);
    });

    // Unsubscribe after initial load
    unsubMinYear();
    unsubMaxYear();
    unsubPresentYear();
  }

  applyChanges() {
    const minYr = parseInt($("#default-min-year").val(), 10);
    const maxYr = parseInt($("#default-max-year").val(), 10);
    const presentYr = parseInt($("#present-day-year").val(), 10);

    // Validation
    if (minYr >= maxYr) {
      alert("Minimum year must be less than maximum year!");
      return;
    }

    if (presentYr < minYr || presentYr > maxYr) {
      alert("Reference line year should be between minimum and maximum years!");
      // Don't return - allow it but warn the user
    }

    // Update stores
    defaultMinYear.set(minYr);
    defaultMaxYear.set(maxYr);
    presentYear.set(presentYr);

    // Refresh all graphs
    const selectedGraphCategory = $(".graph-category-selector-option.selected").data("value");
    if (selectedGraphCategory) {
      initGraphsUI(selectedGraphCategory, selectedGraphCount.get());
    }

    this.close();
  }

  open() {
    this.loadCurrentSettings();
    this.$modal.fadeIn(200);
    this.isOpen = true;
  }

  close() {
    this.$modal.fadeOut(200);
    this.isOpen = false;
  }
}

// Export singleton instance
export const yearRangeModal = new YearRangeModal();
