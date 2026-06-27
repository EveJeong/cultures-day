import { QRCodeSVG } from 'qrcode.react'

/** 참가 유도 QR (빔프로젝터 코너) */
export default function QrJoin() {
  const url = import.meta.env.VITE_APP_BASE_URL || window.location.origin

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-center gap-1 rounded-2xl bg-white/90 p-3 shadow-xl">
      <QRCodeSVG value={url} size={96} />
      <span className="font-head text-xs text-pink-600">폰으로 참가!</span>
    </div>
  )
}
