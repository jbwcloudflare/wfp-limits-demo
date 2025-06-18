import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: {
    "https://api.cloudflare.com/client/v4/graphql": {
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    },
  }, // or a local .graphql file
  documents: "**/*.ts", // or .graphql files
  generates: {
    "graphql/generated.ts": {
      config: {
        scalars: { string: "string", UUID: "string" },
      },
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-apollo-client-helpers",
      ],
    },
  },
};

export default config;
