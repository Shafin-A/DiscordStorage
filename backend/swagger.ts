import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    title: "DiscordStorage API",
    description: "API endpoints for using DiscordStorage",
  },
  host: "localhost:3000",
};

const outputFile = "./swagger-output.json";
const routes = ["./api.ts"];

swaggerAutogen()(outputFile, routes, doc);
