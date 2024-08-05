import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import Sort from "@/components/ui/sort";

import ModeToggle from "./modetoggle";

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
      <div className="flex gap-1">
        <ModeToggle />
        <Sort />
      </div>
    </header>
  );
};

export default Header;
