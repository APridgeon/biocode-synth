import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import GeneInfoRetrieval from './api_input/gene_info_retrieval.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GeneInfoRetrieval />
    {/* <NavBarBottom /> */}
  </StrictMode>,
)
