/**
 * Resolves when a DOM element that matches selector exists.
 *
 * @param {string} selector css selector to match element
 */
export async function waitForElement(selector) {
  return document.querySelector(selector) || new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });
  });
}

export default waitForElement;
