import { Button } from "../button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { File, Folder } from "@/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteDialogContentProps = {
  folder: Folder;
  file: File;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DeleteFileDialogContent: React.FC<DeleteDialogContentProps> = ({
  folder,
  file,
  setDialogOpen,
}) => {
  const deleteFile = async () => {
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foldersData"] });
      setDialogOpen(false);
    },
  });

  const handleDeleteFile = () => {
    mutation.mutate();
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
