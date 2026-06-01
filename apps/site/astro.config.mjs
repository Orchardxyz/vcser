import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
  site: "https://vcser.oryz.work",
  base: "/",
  output: "static",
  integrations: [
    icon({
      include: {
        tabler: ["sun-high", "moon-stars"],
        mdi: ["github", "download", "content-copy"]
      }
    })
  ]
});
