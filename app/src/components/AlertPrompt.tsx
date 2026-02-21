import { useNotifications } from '../lib/notifications'

export default function AlertPrompt() {
  const { prompt, dismissPrompt, respondShelter, respondSafe } = useNotifications()

  if (!prompt) return null

  const isShelter = prompt.type === 'shelter'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-[360px] bg-[#1F2937] rounded-3xl border border-[#374151] shadow-2xl overflow-hidden animate-slide-up">

        {/* Pulsing top strip */}
        <div className={`h-1.5 ${isShelter ? 'bg-[#EF4444]' : 'bg-[#10B981]'} animate-pulse`} />

        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center ${
            isShelter ? 'bg-[#EF4444]/15' : 'bg-[#10B981]/15'
          }`}>
            <i className={`fa-solid ${isShelter ? 'fa-person-shelter text-[#EF4444]' : 'fa-heart-pulse text-[#10B981]'} text-3xl`} />
          </div>

          {/* Title */}
          <h2 className={`text-xl font-bold mb-2 ${isShelter ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
            {isShelter ? 'אזעקה באזור שלך!' : 'האזעקה הסתיימה'}
          </h2>

          {/* Description */}
          <p className="text-sm text-[#D1D5DB] mb-2">
            {isShelter
              ? 'נשמעה אזעקה באזור שלך. היכנס למרחב מוגן ועדכן את הסטטוס שלך.'
              : 'עברו 10 דקות מהאזעקה האחרונה. האם אתה בסדר?'
            }
          </p>

          {/* Cities */}
          {prompt.cities.length > 0 && (
            <p className="text-xs text-[#9CA3AF] mb-6">
              {prompt.cities.slice(0, 4).join(', ')}
              {prompt.cities.length > 4 && ` +${prompt.cities.length - 4}`}
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {isShelter ? (
              <>
                <button
                  onClick={respondShelter}
                  className="w-full py-4 rounded-xl bg-[#F59E0B] hover:bg-amber-600 text-black font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-shield-halved" />
                  נכנסתי למרחב מוגן
                </button>
                <button
                  onClick={respondSafe}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-check" />
                  אני בסדר
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={respondSafe}
                  className="w-full py-4 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-check" />
                  אני בסדר
                </button>
                <button
                  onClick={respondShelter}
                  className="w-full py-3 rounded-xl bg-[#374151] hover:bg-[#4B5563] text-[#F9FAFB] font-medium text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-shield-halved" />
                  עדיין במרחב מוגן
                </button>
              </>
            )}
            <button
              onClick={dismissPrompt}
              className="text-xs text-[#9CA3AF] hover:text-[#D1D5DB] transition-colors mt-2"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
