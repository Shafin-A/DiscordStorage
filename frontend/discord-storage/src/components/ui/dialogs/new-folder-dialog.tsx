import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type NewFolderDialogContentProps = {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const NewFolderDialogContent: React.FC<NewFolderDialogContentProps> = ({
  setDialogOpen,
}) => {
  const [inputValue, setInputValue] = useState<string>("");

  const createNewFolder = async (folderName: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/folder/${folderName}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create new folder");
      }

      return response;
    } catch (error: any) {
      throw error;
    }
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createNewFolder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foldersData"] });
      setDialogOpen(false);
      toast.success(
        "Folder has been successfully created in the Home directory!"
      );
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: Infinity });
    },
  });

  const handleNewFolder = (folderName: string) => {
    setInputValue("");
    mutation.mutate(folderName);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Folder</DialogTitle>
        <DialogDescription>
          This will create a new folder in the Home directory.
        </DialogDescription>
      </DialogHeader>
      <div>
        <Input
          value={inputValue}
          placeholder="New Name"
          type="text"
          onChange={(e) => setInputValue(e.target.value)}
        />
      </div>
      <DialogFooter>
        <Button
          type="submit"
          onClick={() => handleNewFolder(inputValue)}
          disabled={mutation.isPending || inputValue.length === 0}
        >
          {mutation.isPending ? "Creating..." : "Confirm"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default NewFolderDialogContent;
