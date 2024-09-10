import { toast } from "sonner";
import { Button } from "../button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../dialog";
import { Folder } from "@/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type DeleteDialogContentProps = {
  folder: Folder;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DeleteFolderDialogContent: React.FC<DeleteDialogContentProps> = ({
  folder,
  setDialogOpen,
}) => {
  const deleteFolder = async () => {
    const response = await fetch(`http://localhost:3000/folder/${folder.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete the folder");
    }
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foldersData"] });
      setDialogOpen(false);
      toast.success("Folder has been successfully deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: Infinity });
    },
  });

  const handleDeleteFolder = () => {
    mutation.mutate();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you absolutely sure?</DialogTitle>
        <DialogDescription>
          This action cannot be undone. Are you sure you want to permanently
          delete the folder "{folder.folderName}" from our servers?
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button
          type="submit"
          onClick={handleDeleteFolder}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Deleting..." : "Confirm"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default DeleteFolderDialogContent;
