const {
  Client,
  GatewayIntentBits,
  ThreadAutoArchiveDuration,
} = require("discord.js");

const { Readable } = require("stream");

require("dotenv").config({ path: "./.env" });

const express = require("express");
const multer = require("multer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to chunk buffer
const chunkBuffer = (buffer, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
};

// Function to stream file to response
async function streamFile(fileStream, res) {
  try {
    const reader = fileStream.getReader();

    const pump = () =>
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
}

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});

app.get("/files", async (req, res) => {
  // Login to Discord bot
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
  });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // Get text channel
  const textChannelID = process.env.TEXT_CHANNEL_ID;
  const channel = await client.channels.fetch(textChannelID);

  // Get all threads in channel
  const activeThreads = (await channel.threads.fetchActive()).threads;
  const archivedThreads = (await channel.threads.fetchArchived()).threads;

  const allThreads = activeThreads.concat(archivedThreads);

  const files = [];

  for (const thread of allThreads.values()) {
    try {
      // Fetch the first & second message in the thread, messages fetch latest -> oldest
      const messages = await thread.messages.fetch({ limit: 2, after: 0 });
      const firstMessage = messages.last();

      const secondMessage = messages.first();

      // First message is filename
      const fileName = firstMessage.content;

      // Second message is file size
      const fileSize = secondMessage.content.split(" ")[0];
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
    message: "Fetched all files",
    files: files,
  });
});

app.get("/download/:threadID", async (req, res) => {
  const threadID = req.params.threadID;

  // Login to Discord bot
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // Get text channel
  const textChannelID = process.env.TEXT_CHANNEL_ID;
  const channel = await client.channels.fetch(textChannelID);

  // Get thread
  const thread = await channel.threads.fetch(threadID);

  // Get messages with attachments
  const messages = await thread.messages.fetch();

  if (messages) {
    // Within file size limit, no chunks
    if (messages.size === 2) {
      try {
        // Latest message fetched first
        const latestMessage = messages.first();

        // Oldest message will be file name
        const fileName = messages.last().content;

        if (latestMessage.attachments.size === 1) {
          const attachment = latestMessage.attachments.first();
          const downloadURL = attachment.url;
          if (!downloadURL) {
            return res.status(404).json({ error: "File not found" });
          }

          try {
            // Fetch the file from the URL
            const response = await fetch(downloadURL);

            if (!response.ok) {
              throw new Error(
                `Failed to fetch ${downloadURL}: ${response.statusText}`
              );
            }

            // Set appropriate headers
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="${fileName}"`
            );
            res.setHeader("Content-Type", response.headers.get("content-type"));

            // Download the file
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
        console.error(`Error fetching messages for thread ${threadID}:`, error);
      }
    } else {
      // Oldest message will be file name
      const fileName = messages.last().content;

      const downloadURLs = [];
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

      // Stream the reassembled file to the client
      const fileStream = Readable.from(responseBuffer);
      fileStream.pipe(res);
    }
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Login to Discord bot
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const token = process.env.DISCORD_TOKEN;
  await client.login(token);

  // Get text channel
  const textChannelID = process.env.TEXT_CHANNEL_ID;
  const channel = await client.channels.fetch(textChannelID);

  // Setting max file sizes
  const fileBuffer = req.file.buffer;
  const fileSize = fileBuffer.length;
  const maxChunkSize = 23 * 1024 * 1024; // 23 MB

  // Function to create a thread and send file chunks
  const createThreadAndSendChunks = async (threadName, fileName, chunks) => {
    const thread = await channel.threads.create({
      name: threadName,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      reason: `${fileName} Thread`,
    });

    await thread.send(fileName);
    await thread.send(`${req.file.size} bytes`);

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
      message: `File uploaded successfully in ${chunks.length} chunks: ${req.file.size} bytes`,
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
});
