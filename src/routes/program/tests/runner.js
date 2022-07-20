// Read in JSON file

// Work through each step.
// Step refers to each screen shown to the user

// Step can have background instructions

// dynamically create store values for running the script
// we put these in stores so that we can view the values on screen and also Recover
// the results at the end of the test.

class Runner {
  #steps;
  #current;
  constructor(stp) {
    this.#steps = JSON.parse(JSON.stringify(stp));
    this.#current = 1;
  }

  start() {

  }

  getStep() {
    for (const [key, val] of Object.entries(this.#steps)) {
      if (val.index == this.#current) {
        return val;
      }
    }
    return null;
  }

  async nextStep(){}

  async runScript(){}

  async executeScriptStep(){}

  async updateStoreValue(variable, value){}

  getStoreValue(variable){}

  enableNextStep(){}

  createWarning(title, text, failure=false){}

  addToLog(entry){}

  submitResult(){}
};

module.exports = Runner;
