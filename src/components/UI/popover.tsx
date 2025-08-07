import { OverlayPlacement } from "@heroui/aria-utils";
import { Popover as PopoverComponent, PopoverTrigger, PopoverContent } from "@heroui/react";

interface IPopoverProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  placement?: OverlayPlacement;
  offset?: number;
}

export const Popover = (props: IPopoverProps) => {
  const { trigger, content, className, contentClassName, placement = "bottom", offset = 20 } = props;

  return (
    <PopoverComponent offset={offset} placement={placement} className={className} triggerScaleOnOpen={false}>
      <PopoverTrigger>
        <div onClick={(e) => e.stopPropagation()} className="cursor-pointer">
          {trigger}
        </div>
      </PopoverTrigger>
      <PopoverContent className={contentClassName}>{content}</PopoverContent>
    </PopoverComponent>
  );
};
