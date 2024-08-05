import { Button } from "@/components/ui/button";
import { Folder, Plus, UploadSimple } from "@phosphor-icons/react";

const Sidebar = () => {
  return (
    <aside className="hidden w-64 flex-col border-r dark:border-gray-600 bg-background dark:bg-black p-4 sm:flex">
      <div className="flex items-center gap-2 pb-4">
        <Folder size={32} />
        <h2 className="text-lg font-semibold dark:text-white">File Manager</h2>
      </div>
      <nav className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-left dark:text-white"
        >
          <Plus size={16} />
          New Folder
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 text-left dark:text-white"
        >
          <UploadSimple size={16} />
          Upload File
        </Button>
      </nav>
    </aside>
  );
};

export default Sidebar;
