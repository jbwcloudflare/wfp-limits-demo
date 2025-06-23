import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client/core";
import { error } from "console";
import { env } from "process";

export function getApolloClient() {
  const graphqlEndpoint = "https://api.cloudflare.com/client/v4/graphql";
  const apiToken =
    env.CLOUDFLARE_API_TOKEN ?? error("missing CLOUDFLARE_API_TOKEN");

  return new ApolloClient({
    link: new HttpLink({
      uri: graphqlEndpoint,
      headers: { Authorization: `Bearer ${apiToken}` },
    }),
    cache: new InMemoryCache(),
  });
}
