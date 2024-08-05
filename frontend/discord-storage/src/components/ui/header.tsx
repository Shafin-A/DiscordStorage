import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Funnel } from "@phosphor-icons/react";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b dark:border-gray-600 dark:bg-zinc-950 px-4 sm:px-6 rounded-md">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {/* <BreadcrumbLink href="/">Home</BreadcrumbLink> */}
            <BreadcrumbPage>Home</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1 dark:text-white"
          >
            <Funnel size={16} />
            Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="dark:bg-zinc-950">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Name</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Size</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Date</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;
