import { useEffect, useMemo, useRef, useState } from 'react'
import { RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react'
import { agents, createRoundQuestions, decoyChoices, providers, providerDecoyChoices, sounds, type Agent, type Choice, type Question } from './game-data'
import introVideo from '../video/intro.mp4'
import introMusic from '../sounds/intro.mp3'

type Screen = 'home' | 'question' | 'answer' | 'final'
type Mode = 'agents' | 'providers'

const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)

function playTone(type: 'correct' | 'incorrect') {
  const file = sounds[type]
  if (file) {
    const effect = new Audio(file)
    effect.volume = .35
    effect.play().catch(() => undefined)
    return
  }
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.frequency.value = type === 'correct' ? 740 : 180
  gain.gain.setValueAtTime(.05, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .22)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(); oscillator.stop(context.currentTime + .22)
}

function playTimerTick(urgent: boolean) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  if (!AudioContextClass) return
  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'square'
  oscillator.frequency.value = urgent ? 820 : 510
  gain.gain.setValueAtTime(urgent ? .08 : .045, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .08)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(); oscillator.stop(context.currentTime + .08)
  window.setTimeout(() => context.close().catch(() => undefined), 120)
}

function Logo() {
  return <div className="flex items-center justify-center" aria-label="Logo AdivinIA">
    {/* Sustituye esta ruta por el logo definitivo si fuese necesario. */}
    <img src="/logo/Neto-Logo-Blanco-2.png" alt="Logo AdivinIA" className="max-h-24 max-w-64 object-contain" />
  </div>
}

/*function HomeTitle() {
  return <h1 className="metallic-title max-w-md text-center text-5xl font-black leading-[1.08] sm:text-6xl">
    <span className="block">¡Juega y gana</span>
    <span className="block">muchos premios!</span>
  </h1>
}*/

/** Interruptor de desarrollo: pon esto en `false` para desactivar el audio de intro.mp3
 *  (portada y partida) y el audio propio del video intro.mp4, sin borrar los archivos. */
const INTRO_AUDIO_ENABLED = false

const HOME_AUDIO_CYCLE_MS = 3 * 60 * 1000

function HomeBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const ambientRef = useRef<HTMLAudioElement>(null)
  const [silenced, setSilenced] = useState(false)
  const silencedRef = useRef(false)
  const applyMuteRef = useRef(() => {})

  useEffect(() => {
    silencedRef.current = silenced
    applyMuteRef.current()
  }, [silenced])

  useEffect(() => {
    const video = videoRef.current
    const ambient = ambientRef.current
    if (!video || !ambient) return
    let videoAudioTimeout: number
    let phase: 'video' | 'ambient' = 'video'

    // Ambos elementos siempre están reproduciéndose (arrancan silenciados, lo que el navegador
    // permite sin gesto del usuario); solo se alterna `muted` para pasar el sonido de uno a otro,
    // ya que silenciar/activar un medio que ya está en reproducción no requiere interacción previa.
    // El botón de silencio manual se superpone a ese ciclo sin detenerlo.
    function applyMuteState() {
      if (!INTRO_AUDIO_ENABLED || silencedRef.current) { video!.muted = true; ambient!.muted = true; return }
      video!.muted = phase !== 'video'
      ambient!.muted = phase !== 'ambient'
    }
    applyMuteRef.current = applyMuteState

    function playAmbient() {
      phase = 'ambient'
      applyMuteState()
    }

    function playVideoAudio() {
      phase = 'video'
      video!.currentTime = 0
      applyMuteState()
      const duration = Number.isFinite(video!.duration) && video!.duration > 0 ? video!.duration : 10
      window.clearTimeout(videoAudioTimeout)
      videoAudioTimeout = window.setTimeout(playAmbient, duration * 1000)
    }

    video.play().catch(() => undefined)
    ambient.play().catch(() => undefined)
    playVideoAudio()
    const cycle = window.setInterval(playVideoAudio, HOME_AUDIO_CYCLE_MS)

    const unlock = () => { video.play().catch(() => undefined); ambient.play().catch(() => undefined) }
    window.addEventListener('pointerdown', unlock, { once: true })

    return () => {
      window.clearInterval(cycle)
      window.clearTimeout(videoAudioTimeout)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [])

  return <>
    <video ref={videoRef} className="home-media" src={introVideo} autoPlay muted loop playsInline aria-hidden="true" />
    <audio ref={ambientRef} src={introMusic} autoPlay muted loop preload="auto" />
    {INTRO_AUDIO_ENABLED && <button
      type="button"
      onClick={() => setSilenced((value) => !value)}
      aria-label={silenced ? 'Activar música de fondo' : 'Silenciar música de fondo'}
      className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm"
    >
      {silenced ? <VolumeX size={22} /> : <Volume2 size={22} />}
    </button>}
  </>
}

function Portrait({ agent, result, fallbackLabel, variant }: { agent: Agent; result: boolean; fallbackLabel: string; variant: 'photo' | 'logo' }) {
  const isLogo = variant === 'logo'
  return <div className={`grid h-full w-full place-items-center overflow-hidden ${isLogo ? 'bg-white p-10' : result ? 'bg-emerald-700' : 'bg-rose-800'}`}>
    {agent.image ? <img src={agent.image} alt={agent.name} className={isLogo ? 'h-full w-full object-contain' : 'h-full w-full object-cover'} /> : <div className="flex flex-col items-center gap-4">
      <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-white/70 text-5xl font-black text-white" style={{ backgroundColor: agent.color }}>{agent.name.slice(0, 1)}</div>
      <span className={`text-center text-sm font-semibold ${isLogo ? 'text-slate-600' : 'text-white/80'}`}>{fallbackLabel}<br />{agent.name}</span>
    </div>}
  </div>
}

function Sparks({ score }: { score: number }) {
  const gold = score > 4
  return <>{Array.from({ length: 34 }, (_, index) => <i key={index} className="spark" style={{ left: `${(index * 37) % 100}%`, animationDuration: `${2.4 + (index % 5) * .5}s`, animationDelay: `${(index % 7) * -.75}s`, color: gold ? '#facc15' : '#e2e8f0', backgroundColor: 'currentColor' }} />)}</>
}

function createChoices(pool: Agent[], decoys: Choice[]): Choice[] {
  // Las seis respuestas reales cambian de posición y se suman dos distractores nuevos en cada pregunta.
  return shuffle([...pool.map(({ id, name }) => ({ id, name })), ...shuffle(decoys).slice(0, 2)])
}

function poolFor(mode: Mode) { return mode === 'agents' ? agents : providers }
function decoysFor(mode: Mode) { return mode === 'agents' ? decoyChoices : providerDecoyChoices }

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [mode, setMode] = useState<Mode>('agents')
  const [rounds, setRounds] = useState<Question[]>(() => createRoundQuestions(poolFor('agents')))
  const [position, setPosition] = useState(0)
  const [score, setScore] = useState(0)
  const [chosen, setChosen] = useState<Choice | null>(null)
  const [turning, setTurning] = useState(false)
  const [choices, setChoices] = useState<Choice[]>(() => createChoices(poolFor('agents'), decoysFor('agents')))
  const [mixing, setMixing] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const timeLeftRef = useRef(10)
  const backgroundMusicRef = useRef<HTMLAudioElement>(null)
  const current = rounds[position]
  const isCorrect = chosen?.id === current?.agent.id
  const finalMessage = useMemo(() => score < 3 ? 'Ánimo, en la siguiente partida lo harás mejor' : score < 5 ? '¡Eres genial!' : '¡Eres increíble, con todo!', [score])

  function startBackgroundMusic() {
    if (!INTRO_AUDIO_ENABLED) return
    const music = backgroundMusicRef.current
    if (!music) return
    music.volume = .7
    music.play().catch(() => undefined)
  }

  function shuffleChoices(activeMode: Mode = mode) {
    setMixing(true)
    setChoices(createChoices(poolFor(activeMode), decoysFor(activeMode)))
    window.setTimeout(() => setMixing(false), 720)
  }
  function startGame(nextMode: Mode) {
    const nextRounds = createRoundQuestions(poolFor(nextMode))
    startBackgroundMusic(); setMode(nextMode); setRounds(nextRounds); setPosition(0); setScore(0); setChosen(null); shuffleChoices(nextMode); setScreen('question')
  }
  function finishGame() {
    setChosen(null); setScreen('home')
  }
  function choose(choice: Choice) {
    if (screen !== 'question' || mixing) return
    setChosen(choice); setTurning(true); setScreen('answer')
  }

  useEffect(() => {
    if (screen !== 'question' || mixing) return
    const timeoutChoice: Choice = { id: 'time-expired', name: 'Tiempo agotado', isDecoy: true }
    timeLeftRef.current = 10
    setTimeLeft(10)
    const countdown = window.setInterval(() => {
      setTimeLeft((previous) => {
        const next = previous - 1
        timeLeftRef.current = Math.max(0, next)
        if (next <= 0) {
          window.clearInterval(countdown)
          setChosen(timeoutChoice)
          setTurning(true)
          setScreen('answer')
          return 0
        }
        return next
      })
    }, 1000)
    let soundTimeout = window.setTimeout(function tick() {
      const seconds = timeLeftRef.current
      if (seconds <= 0) return
      playTimerTick(seconds <= 3)
      const delay = seconds > 6 ? 1000 : seconds > 3 ? 650 : 300
      soundTimeout = window.setTimeout(tick, delay)
    }, 1000)
    return () => { window.clearInterval(countdown); window.clearTimeout(soundTimeout) }
  }, [screen, mixing])

  useEffect(() => {
    if (screen !== 'answer') return
    const reveal = window.setTimeout(() => { setTurning(false); playTone(isCorrect ? 'correct' : 'incorrect') }, 1160)
    const next = window.setTimeout(() => {
      if (isCorrect) setScore((value) => value + 1)
      if (position === rounds.length - 1) { setScreen('final') }
      else { setPosition((value) => value + 1); setChosen(null); shuffleChoices(); setScreen('question') }
    }, 3100)
    return () => { window.clearTimeout(reveal); window.clearTimeout(next) }
  }, [screen, isCorrect, position, rounds.length])

  return <main className={`game-shell flex min-h-svh flex-col px-5 py-7 sm:px-10 ${screen === 'home' ? 'home-shell' : ''}`}>
    <audio ref={backgroundMusicRef} src={introMusic} loop preload="auto" />
    {screen === 'home' && <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-between py-6">
      <HomeBackground />
      <Logo />
      {/* <HomeTitle /> */}
      <div className="flex w-full flex-col gap-4">
        <button onClick={() => startGame('agents')} className="game-button game-button-large w-full px-8 py-5 text-2xl font-bold text-white">Jugar con Agentes</button>
        <button onClick={() => startGame('providers')} className="game-button game-button-large w-full px-8 py-5 text-2xl font-bold text-white">Jugar con Proveedores</button>
      </div>
    </section>}

    {(screen === 'question' || screen === 'answer') && current && <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center">
      <header className="mb-3 w-full text-center">
        <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">{mode === 'agents' ? '¿Adivina de qué agente estamos hablando?' : '¿Adivina de qué proveedor estamos hablando?'}</h2>
        <div className="score-line mt-1">
          <p className={`timer-display ${timeLeft <= 3 ? 'timer-urgent' : timeLeft <= 6 ? 'timer-warning' : ''}`} aria-label={`${timeLeft} segundos restantes`} role="timer">{timeLeft}s</p>
          <p className="text-3xl font-black text-yellow-300">{score}/{rounds.length}</p>
        </div>
      </header>
      <div className={`question-card relative grid shrink-0 place-items-center rounded-3xl p-7 text-center ${turning ? 'card-turning' : ''} ${screen === 'answer' ? (isCorrect ? 'border-yellow-300 shadow-[0_0_25px_#facc15]' : 'border-red-500 shadow-[0_0_25px_#ef4444]') : ''}`}>
        {screen === 'question' ? <p className="text-xl font-bold leading-relaxed text-white sm:text-2xl">{current.text}</p> : <Portrait agent={current.agent} result={Boolean(isCorrect)} fallbackLabel={mode === 'agents' ? 'IMAGEN DEL PERSONAJE' : 'LOGO DEL PROVEEDOR'} variant={mode === 'agents' ? 'photo' : 'logo'} />}
      </div>
      {screen === 'answer' && <div className="mt-3 min-h-14 text-center"><p className="text-xl font-black text-white">Respuesta correcta: <span className="text-yellow-300">{current.agent.name}</span></p><p className="text-sm text-white/75">Siguiente pregunta…</p></div>}
      <div className={`answer-grid mt-auto grid w-full grid-cols-2 gap-2 pt-5 sm:grid-cols-4 ${mixing ? 'answer-grid-mixing' : ''}`} aria-label="Opciones de respuesta">
        {choices.map((choice, index) => {
          const selected = chosen?.id === choice.id
          const resultClass = selected && screen === 'answer' ? (isCorrect ? 'game-button-correct' : 'game-button-incorrect') : ''
          return <button key={choice.id} disabled={screen === 'answer' || mixing} onClick={() => choose(choice)} style={{ animationDelay: mixing ? `${index * 55}ms` : undefined }} className={`game-button answer-button px-3 py-3 text-base font-bold text-white ${resultClass}`}>{choice.name}</button>
        })}
      </div>
    </section>}

    {screen === 'final' && <section className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-between overflow-hidden py-6 text-center">
      {score > 2 && <Sparks score={score} />}
      <Logo />
      <div className="relative z-10 space-y-6"><h2 className="text-3xl font-black text-white">Gracias por participar</h2><p className={`text-4xl font-black leading-tight ${score > 4 ? 'gold-text' : score > 2 ? 'silver-text' : 'text-white'}`}>{finalMessage}</p><div className="inline-flex items-center gap-2 rounded-full border-2 border-yellow-300 bg-blue-950/70 px-7 py-3 text-3xl font-black text-yellow-300"><Trophy size={28} /> {score}/{rounds.length}</div></div>
      <button onClick={finishGame} className="game-button relative z-10 flex items-center gap-2 px-7 py-4 text-xl font-bold text-white"><RotateCcw size={22} /> Reiniciar</button>
    </section>}
  </main>
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }
