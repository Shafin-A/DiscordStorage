import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Folder } from "@/interfaces";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type RenameDialogContentProps = {
  folder: Folder;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const RenameFolderDialogContent: React.FC<RenameDialogContentProps> = ({
  folder,
  setDialogOpen,
}) => {
  const [inputValue, setInputValue] = useState<string>("");

  const renameFolder = async (newName: string) => {
    const controller = new AbortController();

    // Abort request after 10 seconds
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await fetch(
        `http://localhost:3000/folder/${folder.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newName }),
          signal: controller.signal,
        }
      );

      // Clear the timeout once the request is complete
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to rename the folder");
      }

      return response;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(
          "Folder renaming is taking longer than expected and may be rate-limited. Please try again later. The request will continue to process in the background."
        );
      } else {
        throw error;
      }
    }
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: renameFolder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foldersData"] });
      setDialogOpen(false);
      toast.success("Folder has been successfully renamed!");
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: Infinity });
    },
  });

  const handleRenameFolder = (newName: string) => {
    setInputValue("");
    mutation.mutate(newName);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Are you sure?</DialogTitle>
        <DialogDescription>
          This will rename the folder "{folder.folderName}".
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
          onClick={() => handleRenameFolder(inputValue)}
          disabled={mutation.isPending || inputValue.length === 0}
        >
          {mutation.isPending ? "Renaming..." : "Confirm"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default RenameFolderDialogContent;
