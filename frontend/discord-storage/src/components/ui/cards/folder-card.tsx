import { Card, CardContent } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Folder as FolderIcon,
  FolderOpen,
  Pencil,
  Trash,
} from "@phosphor-icons/react";
import { convertBytes, relativeTime, getLatestDate } from "@/lib/utils";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Folder, Dialogs } from "@/interfaces";
import { useState } from "react";
import {
  DeleteFolderDialogContent,
  RenameFolderDialogContent,
} from "@/components/ui/dialogs";

interface FolderCardProps {
  folder: Folder;
  handleOpenFolder: (folder: Folder) => void;
}

const FolderCard = ({ folder, handleOpenFolder }: FolderCardProps) => {
  const [dialog, setDialog] = useState<Dialogs | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [cardContextMenuOpen, setCardContextMenuOpen] = useState<string | null>(
    null
  );

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <ContextMenu
        onOpenChange={() =>
          setCardContextMenuOpen(
            cardContextMenuOpen === null ? folder.id : null
          )
        }
      >
        <ContextMenuTrigger>
          <Card
            className="h-full group hover:scale-105 cursor-pointer dark:bg-zinc-900"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleOpenFolder(folder);
              }
            }}
            onClick={() => handleOpenFolder(folder)}
          >
            <div className="flex items-center justify-center p-4">
              <FolderIcon size={48} />
            </div>
            <CardContent className="flex flex-col items-start gap-1">
              <h3 className="text-base font-medium">{folder.folderName}</h3>
              <div className="text-sm text-muted-foreground">
                {folder.files.length} item(s), {convertBytes(folder.folderSize)}
              </div>
              <div className="text-xs text-muted-foreground">
                Modified:{" "}
                {folder.files.length > 0 &&
                  relativeTime(getLatestDate(folder.files))}
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>
            <span className="block max-w-[200px] truncate">
              {folder.folderName}
            </span>
          </ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleOpenFolder(folder)}>
            <FolderOpen size={16} className="mr-3" />
            Open Folder
          </ContextMenuItem>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.renameFolderDialog)}
          >
            <ContextMenuItem>
              <Pencil size={16} className="mr-3" />
              Rename Folder
            </ContextMenuItem>
          </DialogTrigger>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.deleteFolderDialog)}
          >
            <ContextMenuItem>
              <Trash size={16} className="mr-3" />
              Delete Folder
            </ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>

      {dialog === Dialogs.renameFolderDialog ? (
        <RenameFolderDialogContent
          folder={folder}
          setDialogOpen={setDialogOpen}
        />
      ) : dialog === Dialogs.deleteFolderDialog ? (
        <DeleteFolderDialogContent
          folder={folder}
          setDialogOpen={setDialogOpen}
        />
      ) : null}
    </Dialog>
  );
};

export default FolderCard;
