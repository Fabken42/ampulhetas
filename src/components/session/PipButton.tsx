import { createPortal } from 'react-dom'
import { usePictureInPicture } from '@/hooks/usePictureInPicture'
import { Button } from '@/components/common/Button'
import { MiniPanel } from './MiniPanel'

export function PipButton() {
  const { supported, pipWindow, open, close } = usePictureInPicture()
  if (!supported) return null

  return (
    <>
      <Button variant="ghost" onClick={() => (pipWindow ? close() : open())}>
        {pipWindow ? '⤢ Fechar janela' : '⤢ Janela flutuante'}
      </Button>
      {pipWindow && createPortal(<MiniPanel />, pipWindow.document.body)}
    </>
  )
}
