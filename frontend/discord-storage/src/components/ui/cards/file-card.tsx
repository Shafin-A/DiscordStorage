import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Eye, Download, Trash } from "@phosphor-icons/react";
import {
  convertBytes,
  getFileIcon,
  relativeTime,
  getLatestDate,
} from "@/lib/utils";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { File, Dialogs, Folder } from "@/interfaces";
import { useState } from "react";
import {
  DeleteFileDialogContent,
  PreviewDialogContent,
} from "@/components/ui/dialogs";

interface FileCardProps {
  folder: Folder;
  file: File;
  handleFileDownload: (
    folderID: string,
    fileID: string,
    fileName: string
  ) => void;
  progress: number;
}

const FileCard = ({
  folder,
  file,
  handleFileDownload,
  progress,
}: FileCardProps) => {
  const [dialog, setDialog] = useState<Dialogs | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [cardContextMenuOpen, setCardContextMenuOpen] = useState<string | null>(
    null
  );

  const isDownloadDisabled = progress > 0;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <ContextMenu
        onOpenChange={() =>
          setCardContextMenuOpen(
            cardContextMenuOpen === null ? file.fileID : null
          )
        }
      >
        <ContextMenuTrigger disabled={isDownloadDisabled}>
          <Card
            className={`h-full group hover:scale-105 ${
              isDownloadDisabled ? "cursor-not-allowed" : "cursor-pointer"
            } dark:bg-zinc-900`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                !isDownloadDisabled &&
                  handleFileDownload(folder.id, file.fileID, file.fileName);
              }
            }}
            onClick={() =>
              !isDownloadDisabled &&
              handleFileDownload(folder.id, file.fileID, file.fileName)
            }
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
                Modified: {relativeTime(getLatestDate([file]))}
              </div>
              {progress > 0 && <Progress value={progress} />}
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>
            <span className="block max-w-[200px] truncate">
              {file.fileName}
            </span>
          </ContextMenuLabel>
          <ContextMenuSeparator />
          {file.previewUrl && (
            <DialogTrigger
              asChild
              onClick={() => setDialog(Dialogs.previewDialog)}
            >
              <ContextMenuItem>
                <Eye size={16} className="mr-3" />
                Preview File
              </ContextMenuItem>
            </DialogTrigger>
          )}
          <ContextMenuItem
            onClick={() =>
              !isDownloadDisabled &&
              handleFileDownload(folder.id, file.fileID, file.fileName)
            }
          >
            <Download size={16} className="mr-3" />
            Download File
          </ContextMenuItem>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.deleteFileDialog)}
          >
            <ContextMenuItem>
              <Trash size={16} className="mr-3" />
              Delete File
            </ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>

      {dialog === Dialogs.previewDialog ? (
        <PreviewDialogContent file={file} />
      ) : dialog === Dialogs.deleteFileDialog ? (
        <DeleteFileDialogContent
          folder={folder}
          file={file}
          setDialogOpen={setDialogOpen}
        />
      ) : null}
    </Dialog>
  );
};

export default FileCard;
