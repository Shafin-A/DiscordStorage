import { Button } from "./button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { File, Folder } from "@/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteDialogContentProps = {
  folder: Folder;
  file: File;
};

const DeleteFileDialogContent: React.FC<DeleteDialogContentProps> = ({
  folder,
  file,
}) => {
  const deleteFile = async ({ folder, file }: DeleteDialogContentProps) => {
    const response = await fetch(
      `http://localhost:3000/folder/${folder.id}/file/${file.fileID}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete the file");
    }
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foldersData"] });
    },
  });

  const handleDeleteFile = () => {
    mutation.mutate({ folder, file });
    folder.files = folder.files.filter((folderFile) => folderFile !== file);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. Are you sure you want to permanently
          delete the file "{file.fileName}" from our servers?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="submit"
          onClick={handleDeleteFile}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Deleting..." : "Confirm"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteFileDialogContent;
