import { Client, ClientOptions, GatewayIntentBits } from "discord.js";
import { Response } from "express";

export const chunkBuffer = (buffer: Buffer, chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
};

export const streamFile = async (
  fileStream: ReadableStream<Uint8Array>,
  res: Response
): Promise<void> => {
  try {
    const reader = fileStream.getReader();

    const pump = (): Promise<void> =>
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            res.status(200).end(); // Close the response stream when done
            return;
          }
          console.log(value);
          res.write(value); // Write chunk to response
          return pump(); // Continue reading
        })
        .catch((error) => {
          console.error("Error streaming response:", error);
          res.status(500).end("Failed to download file.");
        });

    await pump(); // Start pumping the stream
  } catch (error) {
    console.error("Error streaming file:", error);
    res.status(500).json({ error: "Failed to stream file" });
  }
};

export const loginDiscord = async (intents: ClientOptions["intents"][]) => {
  // Login to Discord bot
  const client = new Client({
    intents: intents,
  });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  return client;
};
