import { Button } from "@/components/ui/button";
import {
  Folder as FolderIcon,
  Plus,
  UploadSimple,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import NewFolderDialogContent from "./dialogs/new-folder-dialog";
import { useState } from "react";

type SidebarProps = {
  isLoading: boolean;
};

const Sidebar = ({ isLoading }: SidebarProps) => {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  return (
    <aside className="hidden w-64 flex-col border-r dark:border-gray-600 bg-background dark:bg-zinc-950 p-4 sm:flex">
      <div className="flex items-center gap-2 pb-4">
        <FolderIcon size={32} />
        <h2 className="text-lg font-semibold dark:text-white">File Manager</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {isLoading ? (
          <Skeleton className="h-8 w-[225px]" />
        ) : (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start gap-2 text-left dark:text-white"
              >
                <Plus size={16} weight="bold" />
                New Folder
              </Button>
            </DialogTrigger>

            <NewFolderDialogContent setDialogOpen={setDialogOpen} />
          </Dialog>
        )}
        {isLoading ? (
          <Skeleton className="h-8 w-[225px]" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-left dark:text-white"
          >
            <UploadSimple size={16} weight="bold" />
            Upload File
          </Button>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
