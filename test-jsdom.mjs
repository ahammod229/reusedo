import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

async function run() {
  try {
    const html = await (await fetch('http://localhost:5173')).text();
    
    // We need to fetch the JS scripts because Vite serves them as ES modules
    // JSDOM has limited support for ES modules.
    // Let's just create a virtual console to see if JSDOM catches any errors from parsing or inline scripts.
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on("error", (err) => {
      console.error("VIRTUAL CONSOLE ERROR:", err);
    });
    virtualConsole.on("jsdomError", (err) => {
      console.error("JSDOM ERROR:", err);
    });
    virtualConsole.on("log", (msg) => {
      console.log("VIRTUAL CONSOLE LOG:", msg);
    });

    const dom = new JSDOM(html, {
      url: 'http://localhost:5173',
      runScripts: "dangerously",
      resources: "usable",
      virtualConsole
    });

    // wait a bit for scripts to load
    await new Promise(r => setTimeout(r, 3000));
    console.log("Done waiting");
  } catch(e) {
    console.error(e);
  }
}

run();
