import { useMemo, type MouseEvent } from 'react'
import { marked } from 'marked'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime.js'
import guideMarkdown from '../guide.md?raw'

function Guide() {
  // guide.md is bundled with the app, so rendering it as HTML is safe
  const html = useMemo(() => marked.parse(guideMarkdown, { async: false }), [])

  // Links would otherwise navigate the app window away; open them in the system browser
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('a')
    if (link?.href.startsWith('http')) {
      e.preventDefault()
      BrowserOpenURL(link.href)
    }
  }

  return (
    <div className="guide max-w-3xl mx-auto px-6 py-6" onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />
  )
}

export default Guide
