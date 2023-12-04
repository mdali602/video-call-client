import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import RoomContextProvider from './context/RoomContext.tsx'
// import App from './App.tsx'
import Home from './pages/Home.tsx'
import Room from './pages/Room.tsx'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoomContextProvider>
        {/* <App /> */}
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/room/:id' element={<Room />} />
        </Routes>
      </RoomContextProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
