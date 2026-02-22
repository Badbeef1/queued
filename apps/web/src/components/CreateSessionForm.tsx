import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000'

export function CreateSessionForm({ onClose }: { onClose: () => void }) {
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      name: '',
      hostName: '',
    },
    validators: {
      onSubmit: ({ value }) => {
        if (!value.name.trim()) return 'Session name is required'
        if (!value.hostName.trim()) return 'Host name is required'
        return undefined
      },
    },
    onSubmit: async ({ value }) => {
      setFormError(null)
      const params = new URLSearchParams({
        name: value.name.trim(),
        hostName: value.hostName.trim(),
      })
      // Redirect to server auth endpoint — browser follows OAuth flow
      window.location.href = `${SERVER_URL}/auth/spotify?${params}`
    },
    onSubmitInvalid: ({ formApi }) => {
      const error = formApi.state.errors[0]
      if (error && typeof error === 'string') setFormError(error)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {formError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      )}

      <form.Field
        name="name"
        children={(field) => {
          const errorMessage = field.state.meta.errors[0]
          const errorText =
            errorMessage
              ? typeof errorMessage === 'string'
                ? errorMessage
                : (errorMessage as unknown as { message?: string })?.message
              : undefined
          return (
            <div className="space-y-2">
              <Label htmlFor="name">Session name</Label>
              <Input
                id="name"
                placeholder="Sam's Kitchen Party"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched && errorText && (
                <p className="text-sm text-destructive">{errorText}</p>
              )}
            </div>
          )
        }}
      />

      <form.Field
        name="hostName"
        children={(field) => {
          const errorMessage = field.state.meta.errors[0]
          const errorText =
            errorMessage
              ? typeof errorMessage === 'string'
                ? errorMessage
                : (errorMessage as unknown as { message?: string })?.message
              : undefined
          return (
            <div className="space-y-2">
              <Label htmlFor="hostName">Your name</Label>
              <Input
                id="hostName"
                placeholder="Sam"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.isTouched && errorText && (
                <p className="text-sm text-destructive">{errorText}</p>
              )}
            </div>
          )
        }}
      />

      <p className="text-sm text-muted-foreground">
        You'll be redirected to Spotify to authorize playback control.
      </p>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <form.Subscribe
          selector={(state) => state.isSubmitting}
          children={(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Redirecting...' : 'Connect Spotify'}
            </Button>
          )}
        />
      </div>
    </form>
  )
}
