import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function OnboardingShell({ children }: Props) {
  return (
    <div className="flex min-h-dvh justify-center items-center bg-black">
      <div className="relative flex w-full max-w-[480px] flex-col bg-[#0F1115] text-white h-dvh overflow-hidden">
        {children}
      </div>
    </div>
  )
}
