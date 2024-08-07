import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Sort from "@/components/ui/sort";
import ModeToggle from "@/components/ui/modetoggle";

type HeaderProps = {
  breadcrumbs?: { onClick: () => void; label: string }[];
  page?: string;
};

const Header: React.FC<HeaderProps> = ({ breadcrumbs = [], page }) => {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b dark:border-gray-600 dark:bg-zinc-950 px-4 sm:px-6 rounded-md">
      {breadcrumbs.length > 0 ? (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="cursor-pointer">
                  <BreadcrumbLink onClick={breadcrumb.onClick}>
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
        <Sort />
      </div>
    </header>
  );
};

export default Header;
