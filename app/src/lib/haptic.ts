import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export async function haptic(ms?: number) {
  try {
    if (ms && ms > 100) {
      await Haptics.vibrate({ duration: ms })
    } else {
      await Haptics.impact({ style: ImpactStyle.Light })
    }
  } catch {
    if (navigator.vibrate) navigator.vibrate(ms ?? 10)
  }
}

export async function hapticError() {
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50])
  }
}
