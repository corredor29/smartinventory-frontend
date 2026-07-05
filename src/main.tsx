import React from 'react'
import ReactDOM from 'react-dom/client'
import AppRouter from './routes/AppRoutes.tsx' 
import './styles/global.css'    

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>,
)