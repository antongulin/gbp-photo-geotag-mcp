import { defineConfig } from "@trigger.dev/sdk";
import { aptGet } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "proj_tcfgieozwfmxvujihjxt",
  dirs: ["./src/trigger"],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 300,
  build: {
    extensions: [
      // Install ExifTool in the deployed Docker container
      aptGet({
        packages: ["libimage-exiftool-perl"],
      }),
    ],
  },
});
