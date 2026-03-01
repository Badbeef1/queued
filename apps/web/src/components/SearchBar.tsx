import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  isLoading?: boolean
}

export function SearchBar({ onSearch, placeholder = 'Search songs...', isLoading = false }: SearchBarProps) {
  const [value, setValue] = useState('')
  const [isDebouncing, setIsDebouncing] = useState(false)

  useEffect(() => {
    if (value.length <= 2) {
      setIsDebouncing(false)
      onSearch(value)
      return
    }
    setIsDebouncing(true)
    const id = setTimeout(() => {
      setIsDebouncing(false)
      onSearch(value)
    }, 250)
    return () => clearTimeout(id)
  }, [value]) // onSearch is stable (useCallback in parent)

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  const showSpinner = isDebouncing || isLoading

  return (
    <form onSubmit={(e) => e.preventDefault()} className="relative">
      {showSpinner ? (
        <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}
