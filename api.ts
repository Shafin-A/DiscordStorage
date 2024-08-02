import {
  CategoryChannel,
  Client,
  GatewayIntentBits,
  TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";

import { Readable } from "stream";

require("dotenv").config({ path: "./.env" });

import express, { Response } from "express";
import multer from "multer";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to chunk buffer
const chunkBuffer = (buffer: Buffer, chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
};

// Function to stream file to response
const streamFile = async (
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
            res.end(); // Close the response stream when done
            return;
          }
          console.log(value);
          res.write(value); // Write chunk to response
          return pump(); // Continue reading
        })
        .catch((err) => {
          console.error("Error streaming response:", err);
          res.status(500).end("Failed to download file.");
        });

    await pump(); // Start pumping the stream
  } catch (error) {
    console.error("Error streaming file:", error);
    res.status(500).json({ error: "Failed to stream file" });
  }
};

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});

app.get("/files/:textChannelID", async (req, res) => {
  const textChannelID = req.params.textChannelID;

  // Login to Discord bot
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
  });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // Get text channel
  const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

  if (channel) {
    // Get all threads in channel
    const activeThreads = (await channel.threads.fetchActive()).threads;
    const archivedThreads = (await channel.threads.fetchArchived()).threads;

    const allThreads = activeThreads.concat(archivedThreads);

    const files = [];

    for (const thread of allThreads.values()) {
      try {
        // Fetch the first & second message in the thread, messages fetch latest -> oldest
        const messages = await thread.messages.fetch({ limit: 2 });
        const firstMessage = messages.last();
        const secondMessage = messages.first();

        // First message is filename
        const fileName = firstMessage ? firstMessage.content : "Unknown";

        // Second message is file size
        const fileSize = secondMessage
          ? secondMessage.content.split(" ")[0]
          : "Unknown";

        const threadID = thread.id;

        files.push({
          [threadID]: {
            fileName: fileName,
            fileSize: fileSize,
          },
        });
      } catch (error) {
        console.error(
          `Failed to fetch messages for thread ${thread.id}: ${error}`
        );
      }
    }

    res.json({
      message: `Fetched all files in Channel: ${channel.name} with ID: ${textChannelID}`,
      files: files,
    });
  } else {
    console.error(`Channel with ID ${textChannelID} returned null`);
    res
      .status(404)
      .json({ error: `Failed to find channel with ID: ${textChannelID}` });
  }
});

app.get("/download/:textChannelID/:threadID", async (req, res) => {
  const textChannelID = req.params.textChannelID;
  const threadID = req.params.threadID;

  // Login to Discord bot
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // Get text channel - Folder
  const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

  if (channel) {
    // Get thread - File
    const thread = await channel.threads.fetch(threadID);

    if (thread) {
      // Get messages with attachments
      const messages = await thread.messages.fetch();

      if (messages) {
        // Within file size limit, no chunks
        if (messages.size === 2) {
          try {
            // Latest message fetched first
            const latestMessage = messages.first();

            // Oldest message will be file name
            const oldestMessage = messages.last();
            const fileName = oldestMessage ? oldestMessage.content : "Unknown";

            if (latestMessage && latestMessage.attachments.size === 1) {
              const attachment = latestMessage.attachments.first();
              if (!attachment) {
                return res.status(404).json({ error: "File not found" });
              }

              const downloadURL = attachment.url;

              try {
                // Fetch the file from the URL
                const response = await fetch(downloadURL);

                if (!response.ok) {
                  throw new Error(
                    `Failed to fetch ${downloadURL}: ${response.statusText}`
                  );
                }

                const contentType = response.headers.get("content-type");

                // Set appropriate headers
                res.setHeader(
                  "Content-Disposition",
                  `attachment; filename="${fileName}"`
                );
                res.setHeader(
                  "Content-Type",
                  contentType ? contentType : "Unknown"
                );

                // Download the file
                if (!response.body) throw new Error("response.body is null");
                await streamFile(response.body, res);
              } catch (error) {
                console.error("Error downloading file:", error);
                res.status(500).json({ error: "Failed to download file" });
              }
            } else {
              console.log(
                "The second message does not have exactly one attachment."
              );
            }
          } catch (error) {
            console.error(
              `Error fetching messages for thread ${threadID}:`,
              error
            );
          }
        }
        // Larger than 25 MB case
        else {
          // Oldest message will be file name
          const oldestMessage = messages.last();
          const fileName = oldestMessage ? oldestMessage.content : "Unknown";

          const downloadURLs: string[] = [];
          messages.forEach((message) => {
            if (message.attachments.size > 0) {
              message.attachments.forEach((attachment) =>
                downloadURLs.unshift(attachment.url)
              );
            }
          });

          const buffers = [];

          for (let i = 0; i < downloadURLs.length; i++) {
            console.log(
              `Building buffer ${i + 1}/${downloadURLs.length} for download...`
            );
            const url = downloadURLs[i];

            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            buffers.push(buffer);

            console.log(`Buffer ${i + 1}/${downloadURLs.length} done`);
          }

          // Concatenate all buffers into one
          const responseBuffer = Buffer.concat(buffers);

          // Set headers for file download
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
          );
          res.setHeader("Content-Type", "application/octet-stream");

          // Download
          res.end(responseBuffer);
        }
      }
    } else {
      console.error(`Thread with ID ${threadID} returned null`);
      res
        .status(404)
        .json({ error: `Failed to find thread with ID: ${threadID}` });
    }
  } else {
    console.error(`Channel with ID ${textChannelID} returned null`);
    res
      .status(404)
      .json({ error: `Failed to find channel with ID: ${textChannelID}` });
  }
});

app.post("/upload/:textChannelID", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const textChannelID = req.params.textChannelID;

  // Login to Discord bot
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // Get text channel - Folder
  const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

  if (channel) {
    // Setting max file sizes
    const fileBuffer = req.file.buffer;
    const fileSize = fileBuffer.length;
    const maxChunkSize = 23 * 1024 * 1024; // 23 MB

    // Function to create a thread and send file chunks
    const createThreadAndSendChunks = async (
      threadName: string,
      fileName: string,
      chunks: Buffer[]
    ) => {
      const thread = await channel.threads.create({
        name: threadName,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        reason: `${fileName} Thread`,
      });

      await thread.send(fileName);
      await thread.send(`${fileSize} bytes`);

      for (let i = 0; i < chunks.length; i++) {
        console.log(`Uploading chunk ${i + 1}/${chunks.length}...`);

        await thread.send({
          files: [
            {
              attachment: chunks[i],
              name:
                chunks.length == 1
                  ? `${fileName}`
                  : `${fileName} Part ${i + 1}.txt`,
            },
          ],
        });

        console.log(`Chunk ${i + 1}/${chunks.length} uploaded.`);
      }

      return thread;
    };

    if (fileSize > maxChunkSize) {
      // Break into chunks and create a thread
      const chunks = chunkBuffer(fileBuffer, maxChunkSize);
      await createThreadAndSendChunks(
        req.file.originalname.substring(0, 50),
        req.file.originalname,
        chunks
      );

      return res.json({
        message: `File uploaded successfully in ${chunks.length} chunks: ${fileSize} bytes`,
        filename: req.file.originalname,
      });
    } else {
      // Create a thread and send the file without chunks
      await createThreadAndSendChunks(
        req.file.originalname.substring(0, 50),
        req.file.originalname,
        [fileBuffer]
      );

      res.json({
        message: `File uploaded successfully: ${req.file.size} bytes`,
        filename: req.file.originalname,
      });
    }
  } else {
    console.error(`Channel with ID ${textChannelID} returned null`);
    res
      .status(404)
      .json({ error: `Failed to find channel with ID: ${textChannelID}` });
  }
});
