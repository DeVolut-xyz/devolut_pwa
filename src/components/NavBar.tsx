import { Link, useLocation } from 'react-router-dom'
import { Home, Settings, User } from 'lucide-react'

const navItems = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Profile', to: '/profile', icon: User },
]

export function NavBar() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = location.pathname.startsWith(item.to)
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`bottom-nav-item${active ? ' active' : ''}`}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
