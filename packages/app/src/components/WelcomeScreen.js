/**
 * WelcomeScreen.js
 * Starting screen shown when users first visit the website
 */

import $ from "jquery";
import { enterMainApp } from "../stores/app-state-store.js";
import felixLogo from "../imgs/felix-png.png";
import { startTutorial } from "./Tutorial.js";

export function createWelcomeScreen() {
  const $welcomeScreen = $(`
    <div id="welcome-screen">
      <div class="welcome-content">
        <div class="welcome-logo">
          <img src="${felixLogo}" alt="FeliXSim Logo" />
        </div>
        <h1 class="welcome-title">FeliXSim</h1>
        <p class="welcome-description">
          What if the whole world adopts my food behaviour? <br/>Explore how your actions impact global sustainability goals.
        </p>
        <div class="welcome-buttons">
          <button class="welcome-enter-btn">
            <span>Enter Application</span>
            <span class="material-icons">arrow_forward</span>
          </button>
          <button class="welcome-tutorial-btn">
            <span class="material-icons">help_outline</span>
            <span>Quick Guide</span>
          </button>
        </div>
        <div class="welcome-footer">
          <p>Developed by IIASA & ICCS</p>
        </div>
      </div>
    </div>
  `);

  // Enter button click handler
  $welcomeScreen.find(".welcome-enter-btn").on("click", () => {
    $welcomeScreen.fadeOut(300, () => {
      $welcomeScreen.remove();
      enterMainApp();
    });
  });

  // Tutorial button click handler
  $welcomeScreen.find(".welcome-tutorial-btn").on("click", () => {
    $welcomeScreen.fadeOut(300, () => {
      $welcomeScreen.remove();
      enterMainApp();
      // Start tutorial after a brief delay to ensure UI is loaded
      setTimeout(() => {
        startTutorial();
      }, 300);
    });
  });

  return $welcomeScreen;
}
