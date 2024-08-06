import Sidebar from "@/components/ui/sidebar";
import Header from "@/components/ui/header";
import { Card, CardContent } from "@/components/ui/card";
import { FolderIcon } from "lucide-react";

const App = () => {
  const cardData = [
    {
      title: "Documents",
      numFiles: 12,
      size: "2.3 GB",
      dateCreated: "2 days ago",
    },
    {
      title: "Documents",
      numFiles: 12,
      size: "2.3 GB",
      dateCreated: "2 days ago",
    },
    {
      title: "Documents",
      numFiles: 12,
      size: "2.3 GB",
      dateCreated: "2 days ago",
    },
    {
      title: "Documents",
      numFiles: 12,
      size: "2.3 GB",
      dateCreated: "2 days ago",
    },
    {
      title: "Documents",
      numFiles: 12,
      size: "2.3 GB",
      dateCreated: "2 days ago",
    },
  ];

  return (
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-zinc-900">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6">
        <Header breadcrumbs={[{ href: "/", label: "Home" }]} page="Document" />
        <main className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cardData.map((data, index) => (
            <Card key={index} className="group">
              <div className="flex items-center justify-center p-4">
                <FolderIcon className="h-12 w-12 text-primary" />
              </div>
              <CardContent className="flex flex-col items-start gap-1">
                <h3 className="text-base font-medium">{data.title}</h3>
                <div className="text-sm text-muted-foreground">
                  {data.numFiles} items, {data.size}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created: {data.dateCreated}
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
