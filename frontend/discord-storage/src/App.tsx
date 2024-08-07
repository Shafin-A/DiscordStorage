import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { convertBytes, getFileIcon, getLatestDate } from "@/lib/utils";
import { Folder, File } from "@/interfaces";
import { useState } from "react";
import { Folder as FolderIcon } from "@phosphor-icons/react";

const App = () => {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);

  const { isPending, error, data, isFetching, isLoading } = useQuery({
    queryKey: ["foldersData"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/folders");
      return (await response.json()) as Folder[];
    },
  });

  if (isPending) return "Pending...";

  if (error) return "An error has occurred: " + error.message;

  const handleCardClick = (folder: Folder) => {
    setSelectedFolder(folder);
  };

  const handleBackClick = () => {
    setSelectedFolder(null);
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-zinc-800">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6">
        <Header
          breadcrumbs={
            selectedFolder ? [{ onClick: handleBackClick, label: "Home" }] : []
          }
          page={selectedFolder ? selectedFolder.folderName : "Home"}
        />
        <main className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {selectedFolder
            ? selectedFolder.files.map((file: File) => (
                <Card
                  key={file.fileID}
                  className="group hover:scale-105 cursor-pointer dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-center p-4">
                    {getFileIcon(file.fileName)}
                  </div>
                  <CardContent className="flex flex-col items-start gap-1">
                    <h3 className="text-base font-medium">{file.fileName}</h3>
                    <div className="text-sm text-muted-foreground">
                      {convertBytes(file.fileSize)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Modified: {getLatestDate([file])}
                    </div>
                  </CardContent>
                </Card>
              ))
            : data.map((folder: Folder) => (
                <Card
                  key={folder.id}
                  className="group hover:scale-105 cursor-pointer dark:bg-zinc-900"
                  onClick={() => handleCardClick(folder)}
                >
                  <div className="flex items-center justify-center p-4">
                    <FolderIcon size={48} />
                  </div>
                  <CardContent className="flex flex-col items-start gap-1">
                    <h3 className="text-base font-medium">
                      {folder.folderName}
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {folder.files.length} item(s),{" "}
                      {convertBytes(folder.folderSize)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Modified: {getLatestDate(folder.files)}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </main>
      </div>
    </div>
  );
};

export default App;
