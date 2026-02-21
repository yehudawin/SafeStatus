export default function StatusBar() {
  return (
    <div className="h-10 w-full flex justify-between items-center px-6 text-xs font-medium text-white/70 select-none z-10 pt-2">
      <span>09:41</span>
      <div className="flex items-center gap-1.5">
        <i className="fas fa-signal text-[10px]" />
        <i className="fas fa-wifi text-[10px]" />
        <i className="fas fa-battery-full text-[10px]" />
      </div>
    </div>
  )
}
