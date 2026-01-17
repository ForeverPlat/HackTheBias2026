import { useState } from 'react'
import { TenantBasicForm } from './components/TenantBasicForm'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TenantScore } from './components/TenantScore'


function App() {

  return (
      <BrowserRouter>
        <Routes>
            <Route path='/' element={<TenantBasicForm />} />
            <Route path='/score' element={<TenantScore />} />

        </Routes>
      </BrowserRouter>
  )
}

export default App
