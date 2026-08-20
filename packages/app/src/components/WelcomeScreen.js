/**
 * WelcomeScreen.js
 * Starting screen shown when users first visit the website
 */

import $ from "jquery";
import { enterMainApp } from "../stores/app-state-store.js";
import felixLogo from "../imgs/felix-png.png";
import { startTutorial } from "./Tutorial.js";
import { startLesson8 } from "./Lesson8";

const buildVersion = typeof __APP_GIT_TAG__ !== "undefined" && __APP_GIT_TAG__
  ? __APP_GIT_TAG__
  : typeof __APP_VERSION__ !== "undefined"
    ? __APP_VERSION__
    : "unknown";

const versionUrl = typeof __APP_VERSION_URL__ !== "undefined"
  ? __APP_VERSION_URL__
  : "https://github.com/climatechoice/felix/releases";

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
          <div class="welcome-row welcome-row-main">
            <button class="welcome-enter-btn">
              <span>Enter Application</span>
              <span class="material-icons">arrow_forward</span>
            </button>
          </div>
          <div class="welcome-row welcome-row-secondary">
            <button class="welcome-tutorial-btn">
              <span class="material-icons">rocket_launch</span>
              <span>Get Started</span>
            </button>
            <button class="welcome-lesson-btn">
              <span class="material-icons">school</span>
              <span>Interactive Lesson</span>
            </button>
          </div>
        </div>
        <div class="welcome-footer">
          <p>Developed by IIASA & ICCS</p>
          <p class="welcome-version-line">
            <span>Version ${buildVersion}</span>
            <span class="welcome-footer-separator">•</span>
            <button type="button" class="welcome-version-link">Release Notes</button>
          </p>
        </div>
      </div>
    </div>
  `);

  $welcomeScreen.find(".welcome-version-link").on("click", () => {
    window.open(versionUrl, "_blank", "noopener,noreferrer");
  });

  // Enter button — always triggers the guide
  $welcomeScreen.find(".welcome-enter-btn").on("click", () => {
    $welcomeScreen.fadeOut(300, () => {
      $welcomeScreen.remove();
      enterMainApp();
      setTimeout(() => {
        startTutorial();
      }, 300);
    });
  });

  // Get Started button — enters the app directly, no guide
  $welcomeScreen.find(".welcome-tutorial-btn").on("click", () => {
    $welcomeScreen.fadeOut(300, () => {
      $welcomeScreen.remove();
      enterMainApp();
    });
  });

  // Interactive lesson button click handler (on welcome screen)
  $welcomeScreen.find(".welcome-lesson-btn").on("click", () => {
    $welcomeScreen.fadeOut(300, () => {
      $welcomeScreen.remove();
      enterMainApp();
      // Start the lesson after a brief delay to ensure UI is loaded
      setTimeout(() => {
        try { startLesson8(); } catch (e) { console.error('Failed to start lesson', e); }
      }, 300);
    });
  });

  return $welcomeScreen;
}
