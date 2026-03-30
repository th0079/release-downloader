import { cp, mkdir } from "node:fs/promises";

const rendererOutDir = new URL("../dist/renderer/", import.meta.url);

await mkdir(rendererOutDir, { recursive: true });
await cp(new URL("../src/renderer/index.html", import.meta.url), new URL("./index.html", rendererOutDir));
await cp(new URL("../src/renderer/styles.css", import.meta.url), new URL("./styles.css", rendererOutDir));

