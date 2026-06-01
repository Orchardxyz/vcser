import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
  site: "https://orchardxyz.github.io",
  base: "/vcser",
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
