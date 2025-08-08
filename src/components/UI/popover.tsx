import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

interface IPopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  placement?:
    | "top"
    | "bottom"
    | "left"
    | "right"
    | "top-start"
    | "top-end"
    | "bottom-start"
    | "bottom-end"
    | "left-start"
    | "left-end"
    | "right-start"
    | "right-end";
  offset?: number;
}

export const Popover = (props: IPopoverProps) => {
  const { trigger, content, className, contentClassName, placement = "bottom", offset = 20 } = props;

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <div onClick={(e) => e.stopPropagation()} className="cursor-pointer">
          {trigger}
        </div>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={`z-50 w-72 rounded-lg bg-gray-900/90 backdrop-blur-md p-4 shadow-2xl outline-none border border-white/0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${
            contentClassName || ""
          }`}
          sideOffset={offset}
          side={placement as any}
          align="center"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {content}
          <PopoverPrimitive.Arrow className="fill-gray-900/90" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
