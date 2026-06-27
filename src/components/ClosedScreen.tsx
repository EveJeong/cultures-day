/** 행사 close 상태 — 로고만 표시 (로그인·조작 차단) */
export default function ClosedScreen({ logoUrl, eventName }: { logoUrl: string; eventName: string }) {
  return (
    <div className="rainbow-bg flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="max-h-72 rounded-3xl shadow-2xl" />
      ) : (
        <img src="/bonobono.png" alt="보노보노" className="h-44 drop-shadow-2xl" />
      )}
      <h1 className="wordart wordart-yellow text-6xl md:text-7xl">{eventName}</h1>
      <p className="font-head text-xl text-white/80 drop-shadow">잠시 후 시작합니다 *^^*</p>
    </div>
  )
}
