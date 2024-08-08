import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { SortOptions } from "@/interfaces";
import { Button } from "@/components/ui/button";
import { CaretDown, CaretUp, Funnel } from "@phosphor-icons/react";

type SortDropdownProps = {
  sortOption: SortOptions;
  sortOrder: "asc" | "desc";
  handleSortChange: (option: SortOptions, order: "asc" | "desc") => void;
};

const SortDropdown = ({
  sortOption,
  sortOrder,
  handleSortChange,
}: SortDropdownProps) => {
  const handleSortClick = (option: SortOptions) => {
    if (sortOption === option) {
      handleSortChange(option, sortOrder === "asc" ? "desc" : "asc");
    } else {
      handleSortChange(option, "asc");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1 dark:text-white"
        >
          <Funnel size={16} weight="bold" />
          Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="dark:bg-zinc-950">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {["Name", "Size", "Date"].map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => handleSortClick(option as SortOptions)}
          >
            <div className="flex items-center gap-2">
              {option}
              {sortOption === option &&
                (sortOrder === "asc" ? (
                  <CaretUp size={16} />
                ) : (
                  <CaretDown size={16} />
                ))}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SortDropdown;
