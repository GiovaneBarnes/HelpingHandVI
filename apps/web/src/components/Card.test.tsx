import { render, screen } from '@testing-library/react'
import { Card } from '../components/Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <h1>Test Content</h1>
      </Card>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <Card className="custom-class">
        <span>Content</span>
      </Card>
    )

    const card = screen.getByText('Content').parentElement
    expect(card).toHaveClass('custom-class')
  })
})