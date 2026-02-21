const labels = ['בחירת עיר', 'סנכרון', 'סיום']

interface Props {
  step: 1 | 2 | 3
}

export default function ProgressBar({ step }: Props) {
  return (
    <div className="px-6 py-4">
      <div className="flex gap-2" dir="rtl">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${
              s === step ? 'bg-[#FF4D4D]' : s < step ? 'bg-[#FF4D4D] opacity-50' : 'bg-[#232730]'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs font-medium text-[#9CA3AF]">
        {labels.map((label, i) => (
          <span
            key={i}
            className={i + 1 === step ? 'text-[#FF4D4D]' : i + 1 < step ? 'text-white/60' : ''}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
