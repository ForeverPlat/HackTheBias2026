import { useState } from 'react'
import { TenatBasicForm } from './components/TenatBasicForm'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TenantScore } from './components/TenantScore'

function App() {

  return (
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<TenatBasicForm />} />
            <Route path='/score' element={<TenantScore />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App
