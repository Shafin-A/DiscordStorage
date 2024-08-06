import {
  Client,
  ClientOptions,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
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

    const pump = async (): Promise<void> => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          res.end(); // Close the response stream when done
          return;
        }
        res.write(Buffer.from(value)); // Convert Uint8Array to Buffer and write chunk to response
        await pump(); // Continue reading
      } catch (error) {
        console.error("Error streaming response:", error);
        res.status(500).end("Failed to download file.");
      }
    };

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

export const fetchFolderDetails = async (textChannelID: string) => {
  const client = await loginDiscord([
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ]);

  // Get text channel
  const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

  if (!channel) {
    throw new Error("Channel not found");
  }

  // Get all threads in channel
  const activeThreads = (await channel.threads.fetchActive()).threads;
  const archivedThreads = (await channel.threads.fetchArchived()).threads;

  const allThreads = activeThreads.concat(archivedThreads);

  const files = [];
  let totalFileSize = 0;

  for (const thread of allThreads.values()) {
    try {
      // Fetch the first & second message in the thread, messages fetch latest -> oldest
      const messages = await thread.messages.fetch();
      const firstMessage = messages.last();
      const secondMessage = messages.at(messages.size - 2);

      // First message is filename
      const fileName = firstMessage ? firstMessage.content : "Unknown";

      // Second message is file size
      const fileSize = secondMessage
        ? parseInt(secondMessage.content.split(" ")[0])
        : 0;

      totalFileSize += fileSize;

      files.push({
        fileID: thread.id,
        fileName: fileName,
        fileSize: fileSize,
        dateCreated: thread.createdAt,
      });
    } catch (error) {
      console.error(
        `Failed to fetch messages for thread ${thread.id}: ${error}`
      );
      throw new Error(`Failed to fetch messages for thread ${thread.id}`);
    }
  }

  return {
    folderName: channel.name,
    folderSize: totalFileSize,
    files: files,
  };
};
