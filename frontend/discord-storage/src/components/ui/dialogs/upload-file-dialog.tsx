import { ChangeEvent, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useWebSocket from "@/lib/useWebSocket";
import { Progress } from "../progress";

type UploadFileDialogContentProps = {
  folders: Folder[];
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const UploadFileDialogContent: React.FC<UploadFileDialogContentProps> = ({
  folders,
  setDialogOpen,
}) => {
  const [selectedFolderID, setSelectedFolderID] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { uploadProgress, setUploadProgress } = useWebSocket(
    "ws://localhost:3000"
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!uploadedFile) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetch(
        `http://localhost:3000/upload/${selectedFolderID}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload the folder");
      }

      return response;
    } catch (error: any) {
      throw error;
    }
  };

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["foldersData"] });
      setSelectedFolderID("");
      setUploadedFile(null);
      setTimeout(() => {
        // Looks/feels better with some delay
        setUploadProgress(0);
        setDialogOpen(false);
        toast.success("Folder has been successfully uploaded!");
      }, 500);
    },
    onError: (error: Error) => {
      toast.error(error.message, { duration: Infinity });
    },
  });

  const handleUploadFolder = () => {
    mutation.mutate();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Upload File</DialogTitle>
        <DialogDescription>
          This will upload a file to the selected folder
        </DialogDescription>
      </DialogHeader>
      <div>
        <Select value={selectedFolderID} onValueChange={setSelectedFolderID}>
          <SelectTrigger>
            <SelectValue placeholder="Select a folder to upload file to" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Folders</SelectLabel>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.folderName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input className="mt-4 mb-4" type="file" onChange={handleFileChange} />
        {mutation.isPending && <Progress value={uploadProgress} />}
      </div>
      <DialogFooter>
        <Button
          type="submit"
          onClick={handleUploadFolder}
          disabled={
            mutation.isPending ||
            selectedFolderID === "" ||
            uploadedFile === null
          }
        >
          {mutation.isPending ? "Uploading..." : "Confirm"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default UploadFileDialogContent;
