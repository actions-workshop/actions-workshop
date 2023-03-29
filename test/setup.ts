/**
 * primer/react currently uses the CSS.supports on the top level of a file, however, it is not part of JSDOM (yet)
 * So we need to provide it here before the test files get loaded / imported to avoid an error on test runs.
 * see source: https://github.com/primer/react/blame/main/src/PageLayout/useStickyPaneHeight.ts#LG132
 * (if the CSS.supports calls are not there anymore, you might be able to remove this file again)
 */
window.CSS = {
  ...window.CSS,
  supports: () => false,
};
