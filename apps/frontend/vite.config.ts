import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import { expressMiddlewarePlugin } from "../backend/src/vite";

const repositoryRoot = resolve(import.meta.dirname, "../..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repositoryRoot, "");

  return {
    envDir: repositoryRoot,
    plugins: [expressMiddlewarePlugin(env), react(), tailwindcss()],
    resolve: {
      alias: [
        {
          find: "@densy/loadry-sdk/v1",
          replacement: resolve(repositoryRoot, "packages/sdk/src/v1/index.ts"),
        },
        {
          find: "@densy/loadry-sdk",
          replacement: resolve(repositoryRoot, "packages/sdk/src/index.ts"),
        },
        {
          find: "@densy/loadry-contracts",
          replacement: resolve(repositoryRoot, "packages/contracts/src/index.ts"),
        },
      ],
    },
  };
});
