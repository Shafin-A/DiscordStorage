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
import SortDropdown from "./sortdropdown";

type HeaderProps = {
  breadcrumbs?: { onClick: () => void; label: string }[];
  page?: string;
  sortOption: SortOptions;
  sortOrder: "asc" | "desc";
  handleSortChange: (option: SortOptions, order: "asc" | "desc") => void;
};

const Header: React.FC<HeaderProps> = ({
  breadcrumbs = [],
  page,
  sortOption,
  sortOrder,
  handleSortChange,
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
      ) : (
        <BreadcrumbItem>
          <BreadcrumbPage>{page}</BreadcrumbPage>
        </BreadcrumbItem>
      )}
      <div className="flex gap-1">
        <ModeToggle />
        <SortDropdown
          sortOption={sortOption}
          handleSortChange={handleSortChange}
          sortOrder={sortOrder}
        />
      </div>
    </header>
  );
};

export default Header;
