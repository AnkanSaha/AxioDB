import Fastify from "fastify";
import { Console } from "outers";
import path from "path";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import ejs from "ejs";

// Import the Details
import { General } from "./Keys/Keys";

export default async function WebServer() {
  const Server = Fastify({ logger: false });

  // Register static file plugin to serve files
  Server.register(fastifyStatic, {
    root: path.join(__dirname, "public"), // Directory for static files
    prefix: "/public/", // URL prefix for static files
  });

  // Register view plugin with EJS
  Server.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
    root: path.join(__dirname, "Views"), // Directory for EJS templates
    viewExt: "ejs", // Default file extension for templates
  });

  // Listen to the server
  Server.listen({ port: General.PORT }, (err, address) => {
    if (err) {
      Server.log.error(err);
      Console.red("Failed to start the server", err);
      process.exit(1);
    }
    Server.log.info(`AxioDB Web Interface is  listening on ${address}`);
    Console.green("Web Interface Server is running on", address);
  });
}
