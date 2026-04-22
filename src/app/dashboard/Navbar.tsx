'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Bloques', href: '/dashboard/blocks' },
  ]

  return (
    <header className="flex items-center gap-4 px-5 h-12 border-b border-white/10 shrink-0">
      <Link href="/dashboard" className="flex items-center gap-2 mr-2">
        <Image src="/images/icon.png" alt="AusinLifting" width={28} height={28} className="rounded-[6px]" />
        <span className="text-[13px] font-semibold tracking-tight text-zinc-100">AusinLifting</span>
      </Link>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1 rounded-md text-[12px] transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-7 h-7',
            },
          }}
        />
      </div>
    </header>
  )
}
