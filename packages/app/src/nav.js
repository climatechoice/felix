// /*
//  * Inject a 50px-tall nav bar split into three equal sections
//  */
// function loadNavBar() {
//   const navBar = document.getElementById("nav-bar");
//   navBar.innerHTML = ""; // clear any existing
//   const nav = document.createElement("nav");
//   navBar.appendChild(nav);

//   /*
//    * Section 1: Logo + Reset buttons
//    */
//   const sect1 = document.createElement("div");
//   sect1.className = "nav-section first";

//   // Logo link
//   const logoLink = document.createElement("a");
//   logoLink.href = "https://www.climatechoice.eu/";
//   logoLink.target = "_blank"; // opens in new tab
//   logoLink.rel = "noopener noreferrer"; // for security

//   // Logo image
//   const logoImg = document.createElement("img");
//   logoImg.src = "./imgs/choice-png.png";
//   logoImg.alt = "Choice Logo";
//   logoImg.style.height = "30px"; // fits inside the 50px nav-bar

//   logoLink.appendChild(logoImg);
//   sect1.appendChild(logoLink);

//   // Reset current scenario button
//   const resetScenario = document.createElement("button");
//   // Reset Icon
//   const rsCurrentIcon = document.createElement("span");
//   rsCurrentIcon.className = "material-icons";
//   rsCurrentIcon.textContent = "refresh";
//   resetScenario.appendChild(rsCurrentIcon);
//   // "Current" Text label
//   const rsCurrentLabel = document.createElement("span");
//   rsCurrentLabel.textContent = "Current";
//   resetScenario.appendChild(rsCurrentLabel);
//   resetScenario.addEventListener("click", () => {
//     window.dispatchEvent(new CustomEvent("resetScenario"));
//   });
//   sect1.appendChild(resetScenario);

//   // Reset all scenarios button
//   const resetAll = document.createElement("button");

//   // Icon
//   const rsAllIcon = document.createElement("span");
//   rsAllIcon.className = "material-icons";
//   rsAllIcon.textContent = "refresh";
//   resetAll.appendChild(rsAllIcon);

//   // Text label
//   const rsAllLabel = document.createElement("span");
//   rsAllLabel.textContent = "All";
//   resetAll.appendChild(rsAllLabel);

//   // Dispatch the custom event
//   resetAll.addEventListener("click", () => {
//     window.dispatchEvent(new CustomEvent("resetAll"));
//   });

//   sect1.appendChild(resetAll);

//   // Toggle switch wrapper + input + slider
//   const toggleLabel = document.createElement("label");
//   toggleLabel.className = "toggle-switch";

//   const toggle = document.createElement("input");
//   toggle.type = "checkbox";
//   toggle.addEventListener("change", () => console.log("toggle switched"));

//   const slider = document.createElement("span");
//   slider.className = "slider";

//   toggleLabel.appendChild(toggle);
//   toggleLabel.appendChild(slider);
//   sect1.appendChild(toggleLabel);

//   /*
//    * Section 2: Help + Fullscreen
//    */
//   const sect2 = document.createElement("div");
//   sect2.className = "nav-section second";

//   // Help button
//   const helpBtn = document.createElement("button");
//   helpBtn.textContent = "Help";
//   helpBtn.addEventListener("click", () => console.log("Help needed"));
//   sect2.appendChild(helpBtn);

//   // Fullscreen button
//   const fsBtn = document.createElement("button");
//   const fsIcon = document.createElement("span");
//   fsIcon.className = "material-icons";
//   fsIcon.textContent = "fullscreen";
//   fsBtn.appendChild(fsIcon);
//   fsBtn.addEventListener("click", () => {
//     document.fullscreenElement
//       ? document.exitFullscreen()
//       : document.documentElement.requestFullscreen();
//   });
//   sect2.appendChild(fsBtn);

//   /*
//    * Section 3: Language + Submit a bug
//    */
//   const sect3 = document.createElement("div");
//   sect3.className = "nav-section third";

//   const langSelect = document.createElement("select");
//   langSelect.innerHTML = `<option value="en">English</option>`;
//   langSelect.addEventListener("change", (e) => console.log(e.target.value));
//   sect3.appendChild(langSelect);

//   const bugBtn = document.createElement("button");
//   bugBtn.textContent = "Submit a bug";
//   bugBtn.addEventListener("click", () => {
//     window.location.href = "https://github.com/ntantaroudas/choice-web";
//   });
//   sect3.appendChild(bugBtn);

//   // assemble
//   nav.appendChild(sect1);
//   nav.appendChild(sect2);
//   nav.appendChild(sect3);
// }

// // initialize on page load
// window.addEventListener("load", loadNavBar);
