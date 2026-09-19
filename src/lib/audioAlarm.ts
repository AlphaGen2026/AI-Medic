/**
 * audioAlarm.ts — Web Audio API orqali tibbiy apparat signaliga o'xshash
 * to'xtovsiz ovozli alarm generatori.
 *
 * playAlarm()  → ovozni boshlaydi (to'xtovsiz beep-beep)
 * stopAlarm()  → ovozni to'xtatadi
 * isPlaying()  → hozir chalinayotganini tekshiradi
 */

let ctx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let playing = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function beep(frequency: number, durationMs: number) {
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + durationMs / 1000);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + durationMs / 1000);
}

/** Tibbiy monitor signaliga o'xshash pattern: beep-beep ... beep-beep */
function alarmPattern() {
  beep(880, 150);
  setTimeout(() => beep(880, 150), 200);
  setTimeout(() => beep(1100, 200), 500);
}

export function playAlarm() {
  if (playing) return;
  playing = true;

  // Resume context if suspended (browser autoplay policy)
  const audioCtx = getCtx();
  if (audioCtx.state === "suspended") audioCtx.resume();

  alarmPattern();
  intervalId = setInterval(alarmPattern, 1500);
}

export function stopAlarm() {
  playing = false;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function isAlarmPlaying() {
  return playing;
}
