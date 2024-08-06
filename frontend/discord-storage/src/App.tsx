import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import { Card, CardContent } from "@/components/ui/card";
import { FolderIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { convertBytes, getLatestDate } from "@/lib/utils";
import { Folder } from "@/interfaces";

const App = () => {
  const { isPending, error, data, isFetching, isLoading } = useQuery({
    queryKey: ["foldersData"],
    queryFn: async () => {
      const response = await fetch("http://localhost:3000/folders");
      return (await response.json()) as Folder[];
    },
  });

  if (isPending) return "Pending...";

  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-zinc-800">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6">
        <Header page="Home" />
        <main className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.map((folder: Folder) => (
            <Card
              key={folder.id}
              className="group hover:scale-105 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-center p-4">
                <FolderIcon className="h-12 w-12 text-primary" />
              </div>
              <CardContent className="flex flex-col items-start gap-1">
                <h3 className="text-base font-medium">{folder.folderName}</h3>
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
