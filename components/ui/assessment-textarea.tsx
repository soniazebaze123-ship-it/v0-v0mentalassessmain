import * as React from "react"
import { cn } from "@/lib/utils"

export type AssessmentTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const AssessmentTextarea = React.forwardRef<HTMLTextAreaElement, AssessmentTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
AssessmentTextarea.displayName = "AssessmentTextarea"

export { AssessmentTextarea }
