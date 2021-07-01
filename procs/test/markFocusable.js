// Marks elements that can be keyboard-focused.
exports.markFocusable = async page => {

  // ## CONSTANTS

  // Navigation-key sequence. Next key after focus, refocus.
  const nextNavKeys = {
    Tab: ['ArrowRight', null],
    ArrowRight: ['ArrowDown', 'ArrowDown'],
    ArrowDown: ['ArrowDown', 'Tab']
  };
  // Maximum consecutive external foci (1 suffices for Chrome).
  const externalLimit = 3;

  // ## VARIABLES

  let lastNavKey = 'Tab';
  let externalCount = 0;

  // ## FUNCTIONS

  // Identifies and marks the focused in-body element or identifies a failure status.
  const mark = async () => {
    // Identify a JSHandle of the focused element or a failure status.
    const focusJSHandle = await page.evaluateHandle(lastNavKey => {
      // Identify the focused element.
      const focus = document.activeElement;
      // If it exists and is within the body:
      if (focus && focus !== document.body) {
        // If it was not previously focused:
        if (! focus.dataset.autotestFocused) {
          // Change its status to previously focused.
          focus.setAttribute('data-autotest-focused', lastNavKey);
          // Return it.
          return focus;
        }
        // Otherwise, i.e. if it was previously focused:
        else {
          // Return a status message.
          return {status: 'already'};
        }
      }
      // Otherwise, i.e. if it does not exist or is the body itself:
      else {
        // Return a status message.
        return {status: 'external'};
      }
    }, lastNavKey);
    // Get the failure status.
    const statusHandle = await focusJSHandle.getProperty('status');
    const status = await statusHandle.jsonValue();
    // If there is one:
    if (status) {
      // Return it as a string.
      return status;
    }
    // Otherwise, i.e. if an element within the body is newly focused:
    else {
      // Return its ElementHandle.
      return focusJSHandle.asElement();
    }
  };
  // Recursively focuses and marks elements.
  const markAll = async () => {
    // Identify and mark the newly focused element or identify a status.
    const focOrStatus = await mark();
    // If the status is external:
    if (focOrStatus === 'external') {
      // Press the Tab key, or quit if the external limit has been reached.
      if (externalCount++ < externalLimit) {
        await page.keyboard.press(lastNavKey = 'Tab');
      }
    }
    // Otherwise, i.e. if an element was focused or refocused:
    else {
      // Identify the next navigation key to be pressed.
      const nextKey = nextNavKeys[lastNavKey][focOrStatus === 'already' ? 1 : 0];
      // If it exists:
      if (nextKey) {
        // Press it.
        await page.keyboard.press(lastNavKey = nextKey);
        // Process the element focused by that keypress.
        await markAll();
      }
    }
  };

  // ### OPERATION

  // 
  // Press the Tab key and identify it as the last-pressed navigation key.
  await page.keyboard.press('Tab');
  // Recursively focus and mark elements.
  await markAll();
};
