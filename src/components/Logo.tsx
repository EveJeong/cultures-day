type Size = 'sm' | 'md' | 'lg'

const imgSize: Record<Size, string> = { sm: 'h-10', md: 'h-20', lg: 'h-36' }
const textSize: Record<Size, string> = { sm: 'text-xl', md: 'text-4xl', lg: 'text-6xl' }

/** 로고: 보노보노 + "바딧불이 야호" 워드아트 */
export default function Logo({ size = 'md' }: { size?: Size }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/bonobono.png" alt="보노보노" className={`${imgSize[size]} drop-shadow-lg`} />
      <span className={`wordart wordart-yellow ${textSize[size]}`}>바딧불이 야호</span>
    </div>
  )
}
