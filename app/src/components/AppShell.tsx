import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface Props {
  children: ReactNode
  alertBadge?: boolean
}

export default function AppShell({ children, alertBadge }: Props) {
  return (
    <div className="flex min-h-dvh justify-center items-center bg-black">
      <div className="relative flex w-full max-w-[430px] flex-col bg-[#111827] text-[#F9FAFB] h-dvh overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {children}
        <BottomNav alertBadge={alertBadge} />
      </div>
    </div>
  )
}
