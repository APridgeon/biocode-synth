import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import NavBarBottom from './navbar.tsx'
import SynthInput from './manual_input/synth_input.tsx'
import GeneInfoRetrieval from './api_input/gene_info_retrieval.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GeneInfoRetrieval />
    <SynthInput />
    <NavBarBottom />
  </StrictMode>,
)
