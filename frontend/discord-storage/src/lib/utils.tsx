import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { File, Folder, SortOptions } from "@/interfaces";
import {
  File as FileIcon,
  FileDoc,
  FilePdf,
  FileXls,
  FilePpt,
  FileImage,
  FileVideo,
} from "@phosphor-icons/react";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const convertBytes = (size: number, decimals = 2) => {
  if (!+size) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(size) / Math.log(k));

  return `${parseFloat((size / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const relativeTime = (date: Date) => {
  const now = new Date();
  const elapsed = (now.getTime() - date.getTime()) / 1000;

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
    { label: "second", seconds: 1 },
  ];

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const interval of intervals) {
    const count = Math.floor(elapsed / interval.seconds);
    if (count >= 1 || count <= -1) {
      return rtf.format(-count, interval.label as Intl.RelativeTimeFormatUnit);
    }
  }

  return rtf.format(0, "second");
};

export const getLatestDate = (files: File[]) => {
  const latestDateFile = files.reduce((prev, curr) =>
    curr.dateCreated > prev.dateCreated ? curr : prev
  );

  const date = new Date(latestDateFile.dateCreated);

  return relativeTime(date);
};

export const getFileExtension = (filename: string) =>
  filename.substring(filename.lastIndexOf(".") + 1, filename.length) ||
  filename;

export const getFileIcon = (filename: string) => {
  const fileExtension = getFileExtension(filename).toLowerCase();

  switch (fileExtension) {
    case "pdf":
      return <FilePdf size={48} />;
    case "xls":
    case "xlsx":
      return <FileXls size={48} />;
    case "doc":
    case "docx":
      return <FileDoc size={48} />;
    case "ppt":
    case "pptx":
      return <FilePpt size={48} />;
    case "png":
    case "apng":
    case "jpg":
    case "jpeg":
    case "gif":
      return <FileImage size={48} />;
    case "mp4":
    case "mkv":
    case "mov":
    case "webm":
    case "avi":
    case "mpg":
    case "m4v":
      return <FileVideo size={48} />;
    default:
      return <FileIcon size={48} />;
  }
};

export const sortItems = (
  items: Folder[] | File[],
  option: SortOptions,
  order: "asc" | "desc"
) => {
  let compare = 0;

  return items.sort((a, b) => {
    switch (option) {
      case "Name":
        if ("fileName" in a && "fileName" in b) {
          compare = (a.fileName as string).localeCompare(b.fileName as string);
        } else if ("folderName" in a && "folderName" in b) {
          compare = (a.folderName as string).localeCompare(
            b.folderName as string
          );
        }
        break;
      case "Size":
        if ("fileSize" in a && "fileSize" in b) {
          compare = a.fileSize - b.fileSize;
        } else if ("folderSize" in a && "folderSize" in b) {
          compare = a.folderSize - b.folderSize;
        }
        break;
      case "Date":
        if ("dateCreated" in a && "dateCreated" in b) {
          compare =
            new Date(a.dateCreated).valueOf() -
            new Date(b.dateCreated).valueOf();
        } else if ("folderSize" in a && "folderSize" in b) {
          compare =
            new Date(getLatestDate(a.files)).valueOf() -
            new Date(getLatestDate(b.files)).valueOf();
        }
        break;
      default:
        break;
    }
    return order === "asc" ? compare : -compare;
  });
};
