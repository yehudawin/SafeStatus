interface Props {
  onDigit: (d: string) => void
  onDelete: () => void
}

export default function Numpad({ onDigit, onDelete }: Props) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','back']

  return (
    <div className="bg-[#1A1D24] pb-8 pt-4 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-20 mt-auto border-t border-white/5 animate-slide-up" style={{ animationDelay: '0.5s' }}>
      <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
      <div className="grid grid-cols-3 gap-y-4 px-6" dir="ltr">
        {keys.map((k, i) => {
          if (k === '') return <div key={i} className="h-14" />
          if (k === 'back') {
            return (
              <button
                key={i}
                className="keypad-btn h-14 rounded-full text-xl text-white hover:bg-white/5 transition-colors select-none flex items-center justify-center"
                onClick={onDelete}
              >
                <i className="fas fa-backspace opacity-70" />
              </button>
            )
          }
          return (
            <button
              key={i}
              className="keypad-btn h-14 rounded-full text-2xl font-medium text-white hover:bg-white/5 transition-colors select-none"
              onClick={() => onDigit(k)}
            >
              {k}
            </button>
          )
        })}
      </div>
    </div>
  )
}
