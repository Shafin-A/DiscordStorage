import { Button } from "@/components/ui/button";

const Sidebar = () => {
  return (
    <div className="flex min-h-screen w-full bg-muted/40 dark:bg-black">
      <aside className="hidden w-64 flex-col border-r bg-background dark:bg-black p-4 sm:flex">
        <div className="flex items-center gap-2 pb-4">
          <h2 className="text-lg font-semibold dark:text-white">
            File Manager
          </h2>
        </div>
        <nav className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-left dark:text-white"
          >
            New Folder
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-left dark:text-white"
          >
            Upload File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2 text-left dark:text-white"
          >
            Download
          </Button>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
