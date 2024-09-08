import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { File } from "@/interfaces";

type PreviewDialogContentProps = {
  file: File;
};

const PreviewDialogContent: React.FC<PreviewDialogContentProps> = ({
  file,
}) => {
  return (
    <DialogContent className="max-w-7xl border-0 bg-transparent p-0">
      <DialogHeader>
        <DialogTitle className="text-zinc-50 mt-[0.9rem]">
          {file.fileName}
        </DialogTitle>
      </DialogHeader>
      <DialogDescription>
        <img
          src={file.previewUrl}
          className="h-full w-full object-contain"
          alt={`Preview for file ${file.fileName}`}
        />
      </DialogDescription>
    </DialogContent>
  );
};

export default PreviewDialogContent;
