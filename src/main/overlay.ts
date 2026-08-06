import { BrowserWindow, Rectangle, screen } from 'electron'
import { join } from 'node:path'

// Built by `bun run build:native` (see native/), copied next to the other packaged
// resources so it stays outside the asar and is loadable in both dev and prod.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- .node binaries load by path
const lib: AddonExports = require(join(__dirname, '../../resources/overlay_window.node'))

interface AddonExports {
  start(targetWindowTitle: string, cb: (e: OverlayEvent) => void): void
  focusTarget(): void
  findEditControls(): ControlsResult
  inputTextToEdit(editIndex: number, text: string): boolean
  findButtonsWithImages(): ControlsResult
  clickButtonWithImage(buttonIndex: number): boolean
}

export interface ControlsResult {
  found: boolean
  count: number
}

// Must match `enum ow_event_type` in native/src/overlay_window.h
const enum EventType {
  ATTACH = 1,
  FOCUS = 2,
  BLUR = 3,
  DETACH = 4,
  MOVERESIZE = 5
}

interface OverlayEvent {
  type: EventType
  // only on ATTACH / MOVERESIZE
  x: number
  y: number
  width: number
  height: number
}

export interface AttachOptions {
  /** Shrink the overlay by a percentage of the target window on each side. */
  marginPercent?: {
    top?: number
    bottom?: number
    left?: number
    right?: number
  }
}

/** Leading + trailing edge throttle. */
function throttle(delayMs: number, fn: () => void): () => void {
  let lastCall = 0
  let timer: NodeJS.Timeout | null = null

  return () => {
    const remaining = delayMs - (Date.now() - lastCall)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastCall = Date.now()
      fn()
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null
        lastCall = Date.now()
        fn()
      }, remaining)
    }
  }
}

class OverlayControllerGlobal {
  private isInitialized = false
  private electronWindow?: BrowserWindow
  /** Current bounds of the target, in screen physical pixels. */
  targetBounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 }
  targetHasFocus = false
  private isPaused = false
  private focusingTarget = false
  private attachOptions: AttachOptions = {}
  private dispatchMoveresize = throttle(34 /* 30fps */, () => this.updateOverlayBounds())

  private handler(e: OverlayEvent): void {
    switch (e.type) {
      case EventType.ATTACH:
        this.targetHasFocus = true
        this.targetBounds = e
        if (!this.isPaused) {
          this.electronWindow?.showInactive()
          this.electronWindow?.setAlwaysOnTop(true, 'screen-saver')
          this.updateOverlayBounds()
        }
        break

      case EventType.FOCUS:
        this.focusingTarget = false
        this.targetHasFocus = true
        if (this.electronWindow && !this.isPaused && !this.electronWindow.isVisible()) {
          this.electronWindow.showInactive()
          this.electronWindow.setAlwaysOnTop(true, 'screen-saver')
        }
        break

      case EventType.BLUR:
        this.targetHasFocus = false
        if (this.electronWindow && !this.isPaused && !this.electronWindow.isFocused()) {
          this.electronWindow.hide()
        }
        break

      case EventType.DETACH:
        this.targetHasFocus = false
        if (!this.isPaused) this.electronWindow?.hide()
        break

      case EventType.MOVERESIZE:
        this.targetBounds = e
        if (!this.isPaused) this.dispatchMoveresize()
        break
    }
  }

  private applyMargin(bounds: Rectangle): Rectangle {
    const margin = this.attachOptions.marginPercent
    if (!margin) return bounds

    const next = { ...bounds }
    if (margin.top) {
      const reduce = Math.round((bounds.height / 100) * margin.top)
      next.y += reduce
      next.height -= reduce
    }
    if (margin.bottom) {
      next.height -= Math.round((bounds.height / 100) * margin.bottom)
    }
    if (margin.left) {
      const reduce = Math.round((bounds.width / 100) * margin.left)
      next.x += reduce
      next.width -= reduce
    }
    if (margin.right) {
      next.width -= Math.round((bounds.width / 100) * margin.right)
    }
    return next
  }

  private updateOverlayBounds(): void {
    if (this.isPaused) return
    if (!this.electronWindow) return
    if (this.targetBounds.width === 0 || this.targetBounds.height === 0) return

    this.electronWindow.setBounds(
      this.applyMargin(screen.screenToDipRect(this.electronWindow, this.targetBounds))
    )
    // if moved to a screen with a different DPI, a 2nd setBounds correctly resizes the
    // window - the dip rect has to be recalculated as well
    this.electronWindow.setBounds(
      this.applyMargin(screen.screenToDipRect(this.electronWindow, this.targetBounds))
    )
  }

  attachByTitle(
    electronWindow: BrowserWindow,
    targetWindowTitle: string,
    options: AttachOptions = {}
  ): void {
    if (this.isInitialized) {
      throw new Error('Library can be initialized only once.')
    }
    this.isInitialized = true
    this.electronWindow = electronWindow
    this.attachOptions = options

    electronWindow.on('blur', () => {
      if (!this.targetHasFocus && !this.focusingTarget && !this.isPaused) {
        electronWindow.hide()
      }
    })

    electronWindow.on('focus', () => {
      this.focusingTarget = false
    })

    lib.start(targetWindowTitle, this.handler.bind(this))
  }

  focusTarget(): void {
    if (this.isPaused) {
      throw new Error('Cannot focus target while paused. Resume attachment first.')
    }
    this.focusingTarget = true
    lib.focusTarget()
  }

  /**
   * Pause the attachment, so the overlay window can be used as a normal window. It no
   * longer follows the target window's position, size or focus.
   */
  pause(): void {
    if (!this.isInitialized) {
      throw new Error('Cannot pause before attachment is initialized')
    }
    if (this.isPaused) return

    this.isPaused = true
    this.electronWindow?.setIgnoreMouseEvents(false)
    this.electronWindow?.setAlwaysOnTop(false)
    this.electronWindow?.hide()
  }

  /** Resume following the target window's position, size and focus. */
  resume(): void {
    if (!this.isInitialized) {
      throw new Error('Cannot resume before attachment is initialized')
    }
    if (!this.isPaused) return

    this.isPaused = false
    if (this.electronWindow && this.targetHasFocus) {
      this.electronWindow.showInactive()
      this.electronWindow.setAlwaysOnTop(true, 'screen-saver')
      this.updateOverlayBounds()
    }
  }

  get paused(): boolean {
    return this.isPaused
  }

  /** Re-apply the overlay position from the target window's current bounds. */
  resetPosition(): void {
    if (!this.isInitialized) {
      throw new Error('Cannot reset position before attachment is initialized')
    }
    this.updateOverlayBounds()
  }

  /** Find the Edit controls (login/password fields) in the target window. */
  findEditControls(): ControlsResult {
    return lib.findEditControls()
  }

  /** Set the text of an Edit control found by the last `findEditControls` call. */
  inputTextToEdit(editIndex: number, text: string): boolean {
    return lib.inputTextToEdit(editIndex, text)
  }

  /** Find the Buttons with an Image child (the Riot Client's icon buttons). */
  findButtonsWithImages(): ControlsResult {
    return lib.findButtonsWithImages()
  }

  /** Click a button found by the last `findButtonsWithImages` call. */
  clickButtonWithImage(buttonIndex: number): boolean {
    return lib.clickButtonWithImage(buttonIndex)
  }
}

export const OverlayController = new OverlayControllerGlobal()
