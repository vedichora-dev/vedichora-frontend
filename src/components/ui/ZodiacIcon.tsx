import { RASI_SVG_PATHS } from '@/lib/constants'

interface Props {
  sign: string
  size?: number
  color?: string
  className?: string
}

export default function ZodiacIcon({ sign, size = 24, color = 'currentColor', className = '' }: Props) {
  const path = RASI_SVG_PATHS[sign]
  if (!path) return null
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={size} 
      height={size} 
      fill="none" 
      stroke={color} 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: path.replace(/<g[^>]*>/, '').replace('</g>', '') }}
    />
  )
}
