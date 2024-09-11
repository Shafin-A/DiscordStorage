import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ModeToggle from "@/components/ui/modetoggle";
import { SortOptions } from "@/interfaces";
import SortDropdown from "@/components/ui/sortdropdown";
import { Skeleton } from "@/components/ui/skeleton";

type HeaderProps = {
  breadcrumbs?: { onClick: () => void; label: string }[];
  page?: string;
  sortOption: SortOptions;
  sortOrder: "asc" | "desc";
  handleSortChange: (option: SortOptions, order: "asc" | "desc") => void;
  isLoading: boolean;
};

const Header: React.FC<HeaderProps> = ({
  breadcrumbs = [],
  page,
  sortOption,
  sortOrder,
  handleSortChange,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-zinc-50 dark:border-gray-600 dark:bg-zinc-950 px-4 sm:px-6 rounded-md">
      {breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="cursor-pointer">
                  <BreadcrumbLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      breadcrumb.onClick();
                    }}
                  >
                    {breadcrumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </div>
            ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      ) : isLoading ? (
        <Skeleton className="h-4 w-[50px]" />
      ) : (
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      )}
      {isLoading ? (
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      ) : (
        <div className="flex gap-1">
          <ModeToggle />
          <SortDropdown
            sortOption={sortOption}
            handleSortChange={handleSortChange}
            sortOrder={sortOrder}
          />
        </div>
      )}
    </header>
  );
};

export default Header;
