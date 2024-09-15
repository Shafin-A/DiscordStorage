import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import { useQuery } from "@tanstack/react-query";
import { sortItems } from "@/lib/utils";
import { Folder, File, SortOptions } from "@/interfaces";
import { useEffect, useState } from "react";
import { FolderCard, FileCard } from "@/components/ui/cards";
import { Toaster } from "@/components/ui/sonner";

const App = () => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});

  const [sortOption, setSortOption] = useState<SortOptions>("Name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "progressOutsideLimit") {
        const { bufferIndex, totalBuffers } = data;
        // Buffer progress is 50% of the total progress
        const bufferProgress = (bufferIndex / totalBuffers) * 50;
        setProgress((prevProgress) => ({
          ...prevProgress,
          [data.fileID]: Math.max(
            prevProgress[data.fileID] || 0,
            bufferProgress
          ),
        }));
      }
      if (data.type === "progressWithinLimit") {
        const { progress } = data;
        setProgress((prevProgress) => ({
          ...prevProgress,
          [data.fileID]: Math.max(prevProgress[data.fileID] || 0, progress),
        }));
      }
    });

    return () => {
      socket.close();
    };
  }, []);

  const { isPending, error, data } = useQuery({
    queryKey: ["foldersData"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/folders");
      return (await response.json()) as Folder[];
    },
  });

  if (error) return "An error has occurred: " + error.message;

  const handleOpenFolder = (folder: Folder) => {
    setSelectedFolder(folder);
  };

  const handleBackClick = () => {
    setSelectedFolder(null);
  };

  const handleSortChange = (option: SortOptions, order: "asc" | "desc") => {
    setSortOption(option);
    setSortOrder(order);
  };

  const sortedFiles = selectedFolder
    ? (sortItems([...selectedFolder.files], sortOption, sortOrder) as File[])
    : [];
  const sortedFolders = !selectedFolder
    ? (sortItems([...(data || [])], sortOption, sortOrder) as Folder[])
    : [];

  const handleFileDownload = async (
    folderID: string,
    fileID: string,
    fileName: string
  ) => {
    if (progress[fileID] && progress[fileID] > 0) return; // Skip if progress is ongoing

    setProgress((prevProgress) => ({
      ...prevProgress,
      [fileID]: 0.1, // Setting a progress value so card gets disabled
    }));

    try {
      const response = await fetch(
        `http://localhost:3000/download/${folderID}/${fileID}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const contentLength = response.headers.get("content-length");
      if (!contentLength) {
        throw new Error("Content-Length response header is missing");
      }

      const total = parseInt(contentLength, 10);
      let loaded = 0;

      const reader = response.body?.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader?.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }

              loaded += value?.length || 0;
              // File download progress is 50% of the total progress
              const fileDownloadProgress = 50 + (loaded / total) * 50;
              setProgress((prevProgress) => ({
                ...prevProgress,
                [fileID]: Math.max(
                  prevProgress[fileID] || 0,
                  fileDownloadProgress
                ),
              }));
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      const responseBlob = await new Response(stream).blob();
      const downloadUrl = window.URL.createObjectURL(responseBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setTimeout(() => {
        // Looks/feels better with some delay
        setProgress((prevProgress) => ({
          ...prevProgress,
          [fileID]: 0,
        }));
      }, 500);
    } catch (error) {
      console.error("Download failed", error);
      setProgress((prevProgress) => ({
        ...prevProgress,
        [fileID]: 0,
      }));
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-zinc-800">
      <Sidebar folders={sortedFolders} isLoading={isPending} />
      <div className="flex-1 p-4 sm:p-6">
        <Header
          breadcrumbs={
            selectedFolder ? [{ onClick: handleBackClick, label: "Home" }] : []
          }
          page={selectedFolder ? selectedFolder.folderName : "Home"}
          sortOption={sortOption}
          sortOrder={sortOrder}
          handleSortChange={handleSortChange}
          isLoading={isPending}
        />
        <main className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {selectedFolder
            ? sortedFiles.map((file: File) => (
                <FileCard
                  key={file.fileID}
                  folder={selectedFolder}
                  file={file}
                  handleFileDownload={handleFileDownload}
                  progress={progress[file.fileID]}
                />
              ))
            : sortedFolders.map((folder: Folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  handleOpenFolder={handleOpenFolder}
                />
              ))}
          <Toaster richColors closeButton toastOptions={{}} />
        </main>
      </div>
    </div>
  );
};

export default App;
