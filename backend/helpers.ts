import {
  Client,
  GatewayIntentBits,
  TextChannel,
  ThreadAutoArchiveDuration,
} from "discord.js";
import { Response } from "express";
import { IncomingMessage } from "http";
import { Server, WebSocket } from "ws";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);

export const chunkBuffer = (buffer: Buffer, chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
};

export const streamFile = async (
  fileStream: ReadableStream<Uint8Array>,
  res: Response,
  wss: Server<typeof WebSocket, typeof IncomingMessage>,
  fileID: string,
  fileSize: number
): Promise<void> => {
  try {
    const reader = fileStream.getReader();
    let totalBytes = 0;

    const pump = async (): Promise<void> => {
      try {
        const { done, value } = await reader.read();
        if (done) {
          res.end(); // Close the response stream when done
          return;
        }

        totalBytes += value.length;
        res.write(Buffer.from(value)); // Convert Uint8Array to Buffer and write chunk to response

        // Emit progress
        if (wss) {
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "progressWithinLimit",
                  fileID: fileID,
                  progress: (totalBytes / fileSize) * 100,
                })
              );
            }
          });
        }

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

let discordClient: Client<boolean> | null = null; // Global client

export const getDiscordClient = async () => {
  if (!discordClient) {
    discordClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
    });

    const token = process.env.DISCORD_TOKEN;
    await discordClient.login(token);
  }

  return discordClient;
};

export const fetchFolderDetails = async (textChannelID: string) => {
  const client = await getDiscordClient();

  // Get text channel
  const channel = (await client.channels.fetch(textChannelID)) as TextChannel;

  if (!channel) {
    throw new Error("Channel not found");
  }

  // Get all threads in channel
  const activeThreads = (await channel.threads.fetchActive()).threads;
  const archivedThreads = (await channel.threads.fetchArchived()).threads;

  const allThreads = activeThreads.concat(archivedThreads);

  type File = {
    fileID: string;
    fileName: string;
    fileSize: number;
    dateCreated: Date | null;
    previewUrl?: string;
  };

  const files: File[] = [];
  let totalFileSize = 0;

  for (const thread of allThreads.values()) {
    try {
      // Fetch the first, second & third messages in the thread
      const messages = (await thread.messages.fetch()).sort(
        (userA, userB) => userA.createdTimestamp - userB.createdTimestamp
      );
      const firstMessage = messages.at(0);
      const secondMessage = messages.at(1);
      const thirdMessage = messages.at(2);

      // First message is filename
      const fileName = firstMessage ? firstMessage.content : "Unknown";

      // Second message is file size
      const fileSize = secondMessage
        ? parseInt(secondMessage.content.split(" ")[0])
        : 0;

      totalFileSize += fileSize;

      // Third message is preview image, if available will only have 1 attachment
      const previewUrl = thirdMessage
        ? thirdMessage.attachments.first()?.url
        : null;

      const file: File = {
        fileID: thread.id,
        fileName: fileName,
        fileSize: fileSize,
        dateCreated: thread.createdAt,
      };

      if (previewUrl) {
        file.previewUrl = previewUrl;
      }

      files.push(file);
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

export const createThreadAndSendChunks = async (
  channel: TextChannel,
  threadName: string,
  fileName: string,
  fileSize: number,
  chunks: Buffer[],
  preview: Buffer | null
) => {
  const thread = await channel.threads.create({
    name: threadName,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    reason: `${fileName} Thread`,
  });

  await thread.send(fileName);
  await thread.send(`${fileSize} bytes`);

  preview
    ? await thread.send({
        files: [{ attachment: preview, name: "preview.png" }],
      })
    : await thread.send("No preview available for this file.");

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Uploading chunk ${i + 1}/${chunks.length}...`);

    if ((i + 1) % 5 === 0)
      await new Promise((resolve) => setTimeout(resolve, 1000));

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

export const createPreviewBuffer = async (file: Express.Multer.File) => {
  const isImage = file.mimetype.startsWith("image/");
  const isVideo = file.mimetype.startsWith("video/");

  let previewBuffer: Buffer | null = null;

  if (isImage) {
    previewBuffer = await sharp(file.buffer).resize(1280, 720).toBuffer();
  } else if (isVideo) {
    // Temporary folder for storing video frames
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const videoFilePath = path.join(tempDir, file.originalname);

    fs.writeFileSync(videoFilePath, file.buffer);

    const framePath = path.join(tempDir, `${file.originalname}-frame.png`);
    await new Promise((resolve, reject) => {
      ffmpeg(videoFilePath)
        .screenshots({
          timestamps: ["1"], // Capture frame at 1 second
          filename: path.basename(framePath),
          folder: tempDir,
          size: "1280x720",
        })
        .on("end", resolve)
        .on("error", reject);
    });

    previewBuffer = await sharp(framePath).resize(1280, 720).toBuffer();

    // Clean up the temporary files
    fs.unlinkSync(videoFilePath);
    fs.unlinkSync(framePath);
  }
  return previewBuffer;
};
