import * as React from "react"
import { cn } from "@/lib/utils"

export interface AssessmentInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const AssessmentInput = React.forwardRef<HTMLInputElement, AssessmentInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 touch-input md:h-10 md:px-3 md:py-2 md:text-sm",
          className,
        )}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        ref={ref}
        {...props}
      />
    )
  },
)
AssessmentInput.displayName = "AssessmentInput"

export { AssessmentInput }
