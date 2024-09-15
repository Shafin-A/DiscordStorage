import { useState, useEffect, useCallback } from "react";

interface Progress {
  [fileID: string]: number;
}

const useWebSocket = (url: string) => {
  const [progress, setProgress] = useState<Progress>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);

    if (data.type === "progressOutsideLimit") {
      const { bufferIndex, totalBuffers } = data;
      const bufferProgress = (bufferIndex / totalBuffers) * 50;
      setProgress((prevProgress) => ({
        ...prevProgress,
        [data.fileID]: Math.max(prevProgress[data.fileID] || 0, bufferProgress),
      }));
    }

    if (data.type === "progressWithinLimit") {
      const { progress } = data;
      setProgress((prevProgress) => ({
        ...prevProgress,
        [data.fileID]: Math.max(prevProgress[data.fileID] || 0, progress),
      }));
    }

    if (data.type === "uploadProgress") {
      const { chunkIndex, totalChunks } = data;
      const chunkProgress = (chunkIndex / totalChunks) * 100;
      setUploadProgress(chunkProgress);
    }
  }, []);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
      socket.close();
    };
  }, [url, handleMessage]);

  return { progress, setProgress, uploadProgress, setUploadProgress };
};

export default useWebSocket;
