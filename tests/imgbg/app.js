// Handles a form submission.
exports.formHandler = globals => {
  const {query} = globals;
  if (globals.queryIncludes(['url'])) {
    const {chromium} = require('playwright');
    (async () => {
      const ui = await chromium.launch();
      const page = await ui.newPage();
      await page.goto(query.url);
      // Get an ElementHandle for the document body.
      const bodyHandle = await page.$('body');
      // Get a JSON representation of an array of the values of the background images in the body.
      const urlArrayJSON = await bodyHandle.evaluate(body => {
        const elements = Array.from(body.querySelectorAll('*'));
        const biValues = elements.map(element => {
          const bgStyle = window.getComputedStyle(element).getPropertyValue('background-image');
          if (bgStyle) {
            return bgStyle.slice(4, -1);
          }
          else {
            return '';
          }
        });
        const urls = biValues.filter(value => value);
        return JSON.stringify(urls, null, 2);
      });
      // Identify the values that are absolute URLs.
      const urls = JSON.parse(urlArrayJSON);
      // If any exist:
      if (urls.length) {
        // Compile the list items.
        const listItems = urls.map(url => `<li><img src=${url}></li>`);
        // Convert them to a string.
        query.listItems = listItems.join('\n            ');
        // Render and serve a report.
        globals.render('imgbg', true);
      }
      // Otherwise, i.e. if no background images exist:
      else {
        // Render and serve a report.
        query.listItems = '<li>NONE</li>';
        globals.render('imgbg', true);
      }
    })();
  }
  else {
    globals.serveMessage('ERROR: Some information missing or invalid.', globals.response);
  }
};
