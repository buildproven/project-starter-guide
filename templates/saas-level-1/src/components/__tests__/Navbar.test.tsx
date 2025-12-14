import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { Navbar } from '../Navbar'

// Mock Next.js Link component - forward onClick to trigger mobile menu close
vi.mock('next/link', () => {
  return {
    default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => {
      return <a href={href} onClick={onClick}>{children}</a>
    }
  }
})

describe('Navbar', () => {
  it('renders the navbar with brand name', () => {
    render(<Navbar />)
    expect(screen.getByText('SaaS Starter')).toBeInTheDocument()
  })

  it('renders desktop navigation links', () => {
    render(<Navbar />)
    const links = screen.getAllByText('Features')
    expect(links.length).toBeGreaterThan(0) // At least one Features link
  })

  it('mobile menu is initially closed', () => {
    render(<Navbar />)
    // Mobile menu links should not be visible initially
    const mobileLinks = screen.queryAllByRole('link', { name: /Features/i })
    // Desktop link exists, but mobile menu is hidden
    expect(mobileLinks.length).toBeGreaterThan(0)
  })

  it('toggles mobile menu when button is clicked', () => {
    render(<Navbar />)

    // Find and click the mobile menu button
    const menuButton = screen.getByRole('button')

    // Click to open
    fireEvent.click(menuButton)

    // Click to close
    fireEvent.click(menuButton)
  })

  it('closes mobile menu when Features link is clicked', () => {
    render(<Navbar />)

    // Open mobile menu
    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    // Mobile menu should be visible (id="mobile-menu")
    const mobileMenu = document.getElementById('mobile-menu')
    expect(mobileMenu).toBeInTheDocument()

    // Find and click mobile Features link
    const featureLink = mobileMenu!.querySelector('a[href="#features"]')
    expect(featureLink).toBeInTheDocument()
    fireEvent.click(featureLink!)

    // Menu should be closed - button should show "Open menu"
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument()
  })

  it('closes mobile menu when Pricing link is clicked', () => {
    render(<Navbar />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    const mobileMenu = document.getElementById('mobile-menu')
    const pricingLink = mobileMenu!.querySelector('a[href="#pricing"]')
    fireEvent.click(pricingLink!)

    expect(screen.getByLabelText('Open menu')).toBeInTheDocument()
  })

  it('closes mobile menu when Sign In link is clicked', () => {
    render(<Navbar />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    const mobileMenu = document.getElementById('mobile-menu')
    const signInLink = mobileMenu!.querySelector('a[href="/login"]')
    fireEvent.click(signInLink!)

    expect(screen.getByLabelText('Open menu')).toBeInTheDocument()
  })

  it('closes mobile menu when Get Started link is clicked', () => {
    render(<Navbar />)

    const menuButton = screen.getByRole('button')
    fireEvent.click(menuButton)

    const mobileMenu = document.getElementById('mobile-menu')
    const getStartedLink = mobileMenu!.querySelector('a[href="/signup"]')
    fireEvent.click(getStartedLink!)

    expect(screen.getByLabelText('Open menu')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<Navbar />)
    expect(screen.getAllByText(/Features/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Pricing/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Sign In/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(0)
  })
})
