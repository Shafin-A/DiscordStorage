import {
  ChannelType,
  Client,
  GatewayIntentBits,
  TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";

require("dotenv").config({ path: "./.env" });

import express from "express";
import multer from "multer";

import swaggerUi from "swagger-ui-express";
import swaggerFile from "./swagger-output.json";

import { streamFile, chunkBuffer, loginDiscord } from "./helpers";

const app = express();
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});

// Create new folder
app.post("/folder/:folderName", async (req, res) => {
  try {
    const client = await loginDiscord([GatewayIntentBits.Guilds]);
    const guildID = process.env.GUILD_ID!;
    const guild = client.guilds.cache.get(guildID);

    if (!guild) {
      throw new Error("Guild not found");
    }

    const folderName = req.params.folderName;

    // Create text channel
    const channel = await guild.channels.create({
      name: folderName,
      type: ChannelType.GuildText,
    });

    res
      .status(201)
      .send(`Channel created: ${channel.name} with ID: ${channel.id}`);
  } catch (error) {
    console.error("Error creating channel:", error);
    if (error instanceof Error) {
      if (error.message === "Guild not found") {
        res.status(404).send(error.message);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  }
});

// Delete folder
app.delete("/folder/:folderID", async (req, res) => {
  try {
    const client = await loginDiscord([GatewayIntentBits.Guilds]);
    const textChannelID = req.params.folderID;

    // Get text channel
    const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Delete text channel
    await channel.delete();
    res
      .status(200)
      .send(`Channel deleted: ${channel.name} with ID: ${channel.id}`);
  } catch (error) {
    console.error("Error deleting channel:", error);
    if (error instanceof Error) {
      if (error.message === "Channel not found") {
        res.status(404).send(error.message);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  }
});

// Update folder name
app.patch("/folder/:folderID", async (req, res) => {
  /*
    #swagger.parameters['newName'] = {
        in: 'body',     
        type: 'string',
        required: 'true',
        description: 'The new name for the folder',
    } 
  */
  try {
    const textChannelID = req.params.folderID;
    const client = await loginDiscord([GatewayIntentBits.Guilds]);

    // Get text channel
    const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

    if (!channel) {
      throw new Error("Channel not found");
    }

    // Update channel name
    await channel.setName(req.body.newName);
    res
      .status(200)
      .send(`Channel name updated: ${channel.name} with ID: ${channel.id}`);
  } catch (error) {
    console.error("Error updating channel name:", error);
    if (error instanceof Error) {
      if (error.message === "Channel not found") {
        res.status(404).send(error.message);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  }
});

// Get folder details
app.get("/folder/:folderID", async (req, res) => {
  try {
    const textChannelID = req.params.folderID;

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
        });
      } catch (error) {
        console.error(
          `Failed to fetch messages for thread ${thread.id}: ${error}`
        );
        throw new Error(`Failed to fetch messages for thread ${thread.id}`);
      }
    }

    res.json({
      folderName: channel.name,
      folderSize: totalFileSize,
      files: files,
    });
  } catch (error) {
    console.error("Error fetching folder details:", error);
    if (error instanceof Error) {
      if (
        error.message === "Channel not found" ||
        error.message.startsWith("Failed to fetch messages")
      ) {
        res.status(404).send(error.message);
      } else {
        res.status(500).send("Internal Server Error");
      }
    }
  }
});

app.get("/folders", async (req, res) => {});

app.get("/download/:folderID/:fileID", async (req, res) => {
  const textChannelID = req.params.folderID;
  const threadID = req.params.fileID;

  const client = await loginDiscord([
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ]);

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
            res.status(500).json({ error: "Failed to download file" });
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
          res.status(200).end(responseBuffer);
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

app.post("/upload/:folderID", upload.single("file"), async (req, res) => {
  /*
        #swagger.consumes = ['multipart/form-data']  
        #swagger.parameters['file'] = {
            in: 'formData',
            type: 'file',
            required: 'true',
            description: 'The file to upload',
    } */
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const textChannelID = req.params.folderID;

  const client = await loginDiscord([GatewayIntentBits.Guilds]);

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
      const thread = await createThreadAndSendChunks(
        req.file.originalname.substring(0, 50),
        req.file.originalname,
        chunks
      );

      return res.json({
        message: `File uploaded successfully in ${chunks.length} chunks: ${fileSize} bytes`,
        filename: req.file.originalname,
        id: thread.id,
      });
    } else {
      // Create a thread and send the file without chunks
      const thread = await createThreadAndSendChunks(
        req.file.originalname.substring(0, 50),
        req.file.originalname,
        [fileBuffer]
      );

      res.json({
        message: `File uploaded successfully: ${req.file.size} bytes`,
        filename: req.file.originalname,
        id: thread.id,
      });
    }
  } else {
    console.error(`Channel with ID ${textChannelID} returned null`);
    res
      .status(404)
      .json({ error: `Failed to find channel with ID: ${textChannelID}` });
  }
});
