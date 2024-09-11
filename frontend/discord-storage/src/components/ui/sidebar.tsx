import { Button } from "@/components/ui/button";
import { Folder, Plus, UploadSimple } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui//skeleton";

type SidebarProps = {
  isLoading: boolean;
};

const Sidebar = ({ isLoading }: SidebarProps) => {
  return (
    <aside className="hidden w-64 flex-col border-r dark:border-gray-600 bg-background dark:bg-zinc-950 p-4 sm:flex">
      <div className="flex items-center gap-2 pb-4">
        <Folder size={32} />
        <h2 className="text-lg font-semibold dark:text-white">File Manager</h2>
      </div>
      <nav className="flex flex-col gap-2">
        {isLoading ? (
          <Skeleton className="h-8 w-[225px]" />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-left dark:text-white"
          >
            <Plus size={16} weight="bold" />
            New Folder
          </Button>
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
