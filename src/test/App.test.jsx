import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders auth screen when not authenticated', () => {
    render(<App />)
    expect(screen.getByText(/fundflow/i)).toBeInTheDocument()
  })
})
