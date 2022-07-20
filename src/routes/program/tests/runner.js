// Read in JSON file

// Work through each step.
// Step refers to each screen shown to the user

// Step can have background instructions

// dynamically create store values for running the script
// we put these in stores so that we can view the values on screen and also Recover
// the results at the end of the test.

class Runner {
  #steps;
  #actions;
  #current;
  constructor(steps, actions) {
    this.#steps = steps;
    this.#actions = {
      'set-var': this.#setStoreValue,
      'get-var': this.#getStoreValue,
    };
    this.#actions = Object.assign(this.#actions, actions);
    this.#current = 1;


console.log(this.#actions)

  }

  start() {

  }

  currStep() {
    return this.#steps[this.#current];
  }

  async nextStep() {
    this.#current++;
  };

  async runStep(stp) {
    if (typeof stp.scripts !== "undefined") {
      for (const [key, val] of Object.entries(stp.scripts)) {
        await this.#runScript(val)
      }
    }
  }

  async #runScript(stp) {
    let act = this.#actions[stp.action];
    if (typeof act !== "undefined") {
      await act();
    }
  }

  #setStoreValue(variable, value){}

  #getStoreValue(variable){}

  enableNextStep(){}

  createWarning(title, text, failure=false){}

  addToLog(entry){}

  submitResult(){}
};

module.exports = Runner;
