import { Monitor, Smartphone, Speaker } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import type { Device } from '@queued/validators'

function DeviceIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  if (t === 'smartphone') return <Smartphone className="h-4 w-4" />
  if (t === 'computer') return <Monitor className="h-4 w-4" />
  return <Speaker className="h-4 w-4" />
}

export function DeviceSelector({ sessionId }: { sessionId: string }) {
  const { data: devices = [], isLoading, refetch } = trpc.spotify.getDevices.useQuery(
    { sessionId },
    { refetchInterval: 15_000 },
  )

  const setDevice = trpc.spotify.setDevice.useMutation({
    onSuccess: () => {
      toast({ title: 'Device set', description: 'Playback will queue to this device.' })
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    },
  })

  const sessionQuery = trpc.session.get.useQuery({ id: sessionId })
  const currentDeviceId = sessionQuery.data?.deviceId

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading devices...</div>
  }

  const typedDevices = devices as Device[]

  if (typedDevices.length === 0) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>No Spotify devices found.</p>
        <p>Open Spotify on any device on the same account, then{' '}
          <button className="underline" onClick={() => refetch()}>refresh</button>.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {typedDevices.map((device) => {
        const isSelected = device.id === currentDeviceId
        return (
          <button
            key={device.id ?? device.name}
            onClick={() => {
              if (device.id) setDevice.mutate({ sessionId, deviceId: device.id })
            }}
            disabled={!device.id || setDevice.isPending}
            className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
              isSelected ? 'border-primary bg-primary/5' : ''
            }`}
          >
            <DeviceIcon type={device.type} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{device.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {device.type.toLowerCase()}
                {device.is_active && ' · Active'}
              </p>
            </div>
            {isSelected && (
              <span className="text-xs font-medium text-primary">Selected</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
