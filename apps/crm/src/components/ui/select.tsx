'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from './button'

const selectVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        ghost: 'bg-transparent border-none',
      },
    },
  }
)

export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, value, onValueChange, placeholder, disabled, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [selectedValue, setSelectedValue] = React.useState(value || '')

    const handleSelect = (value: string) => {
      setSelectedValue(value)
      setIsOpen(false)
      onValueChange?.(value)
    }

    React.useEffect(() => {
      if (value !== selectedValue) {
        setSelectedValue(value || '')
      }
    }, [value])

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <span className={cn('text-sm', !selectedValue && 'text-muted-foreground')}>
            {selectedValue
              ? React.Children.toArray(children).find(
                  (child) => React.isValidElement(child) && child.props.value === selectedValue
                )?.props.children
              : placeholder || 'Selecione...'}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full min-w-32 bg-popover text-popover-foreground rounded-md border border-border shadow-md animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
            <div className="p-1">
              {React.Children.map(children, (child) => {
                if (!React.isValidElement(child)) return null
                const { value, children: childChildren, ...childProps } = child.props
                return (
                  <div
                    key={value}
                    className={cn(
                      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground',
                      selectedValue === value && 'bg-accent text-accent-foreground'
                    )}
                    onClick={() => handleSelect(value)}
                    data-selected={selectedValue === value}
                    {...childProps}
                  >
                    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                      {selectedValue === value && <Check className="h-4 w-4" />}
                    </span>
                    {childChildren}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }
)
Select.displayName = 'Select'

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
  ({ className, value, ...props }, ref) => (
    <div ref={ref} className={className} data-value={value} {...props} />
  )
)
SelectItem.displayName = 'SelectItem'

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <Button ref={ref} variant="outline" className={cn('w-full justify-between', className)} {...props} />
  )
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative z-50 min-w-32 bg-popover text-popover-foreground rounded-md border border-border shadow-md', className)} {...props} />
  )
)
SelectContent.displayName = 'SelectContent'

const SelectValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span ref={ref} className={cn('text-sm', className)} {...props} />
  )
)
SelectValue.displayName = 'SelectValue'

export { Select, SelectItem, SelectTrigger, SelectContent, SelectValue }
