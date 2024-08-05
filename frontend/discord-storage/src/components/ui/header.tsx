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
  breadcrumbs?: { href: string; label: string }[];
  page?: string;
};

const Header: React.FC<HeaderProps> = ({ breadcrumbs = [], page }) => {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b dark:border-gray-600 dark:bg-zinc-950 px-4 sm:px-6 rounded-md">
      {breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  <BreadcrumbLink href={breadcrumb.href}>
                    {breadcrumb.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </div>
            ))}
            {page && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{page}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex gap-1">
        <ModeToggle />
        <Sort />
      </div>
    </header>
  );
};

export default Header;
