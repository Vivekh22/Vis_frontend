import { Window } from 'happy-dom';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const window = new Window();
  const document = window.document;

  // Capture console errors
  window.console.error = (...args) => {
    console.error('BROWSER ERROR:', ...args);
  };
  window.console.log = (...args) => {
    console.log('BROWSER LOG:', ...args);
  };

  // Import the built or compiled TS? We can't directly run TS in happy-dom without a bundler.
  console.log("We need to compile it or use ts-node.");
}

run();
