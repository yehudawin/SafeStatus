export function haptic(ms = 10) {
  if (navigator.vibrate) navigator.vibrate(ms)
}

export function hapticError() {
  if (navigator.vibrate) navigator.vibrate([50, 50, 50])
}
