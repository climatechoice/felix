# FeliX ISE

FeliX Interactive Simulation Environment (FeliX ISE) builds upon the robust [FeliX](https://github.com/iiasa/Felix-Model) model, a global system dynamics-based Integrated Assessment Model (IAM) developed by IIASA, designed to simulate complex interactions among population, economy, energy, land, food, climate, biodiversity, and more. 

FeliX is one of the very few models that explicitly model human behaviors in the human-earth system, considering dynamic interactions of socio-economic and environmental sectors. The model is calibrated with data from 1900 to 2020 and projects through to 2100.

## The interface
<img width="2308" height="1257" alt="image" src="https://github.com/user-attachments/assets/900fcdbb-51d7-4b49-ade5-dce31813bfe2" />  
Visit it yourself:  https://climatechoice.github.io/felix/

## Instructions for setting up the project

### Prerequisites

Before you begin, ensure you have the following installed:  
1. Node.js (which includes npm, the Node.js package manager)  
You can find it here:  
https://nodejs.org/en/download/prebuilt-installer

2. ⚠️ For Windows Users, you also have to follow these instructions to fix python PATH:  
( [GitHub Issues](https://github.com/climateinteractive/SDEverywhere/issues/359#issuecomment-2029636476) )  
- Add python3 Folder to your USER 'PATH' environmental variables.  
- Reboot your computer.

3. Emscripten SDK  
Here, instead of manually downloading and setting up the Emscripten SDK, we propose using the instructions listed in SDEverywhere's Quick Start guide, to ensure that everything is correctly configured.
[SDEverywhere Quick Start guide](https://github.com/climateinteractive/SDEverywhere?tab=readme-ov-file#quick-start)  

```sh
# Create an empty directory and change to that directory:
mkdir my-project-folder
cd my-project-folder
# Use `npm` to run the "create" script:
npm create @sdeverywhere@latest
```
The create script will ask you a few questions.  
Pick the default answers apart from the following:  
```
- Would you like your project to use WebAssembly? » - Use arrow-keys. Press Enter to submit. -> Yes, generate a WebAssembly model
- Would you like to install the Emscripten SDK? -> Install under **PARENT** directory  // This is the important part for the Emscripten SDK
```
Once you've completed that, run it:  
```sh
npm run dev
```
and then navigate to http://localhost:8080/index.html  
You should see that the default SDEverywhere project runs as expected. If there are any issues, resolve them, and then come back to set up the FeliX ISE.


### Setting up the FeliX ISE

If you've followed all the previous instructions correctly, setting up the FeliX ISE should be as simple as the steps below:  
```sh
git clone https://github.com/climatechoice/felix.git
cd felix
npm install
npm run dev
```
and then navigate to http://localhost:8080/index.html
