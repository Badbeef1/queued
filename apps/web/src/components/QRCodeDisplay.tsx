import QRCode from 'react-qr-code'

export function QRCodeDisplay({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border bg-white p-4">
        <QRCode value={url} size={160} />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Scan to open on another device
      </p>
      <p className="text-center text-xs font-mono text-muted-foreground">{url}</p>
    </div>
  )
}
