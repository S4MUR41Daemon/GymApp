import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import Image from 'next/image'

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 text-center px-6">
      <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
        Welcome to Ausin Gym
      </h1>
      <p className="text-zinc-400 text-lg">
        Sign up or sign in to continue.
      </p>
      <Image
        src="/images/logo.png"
        alt="Ausin Lifting"
        width={220}
        height={220}
        priority
      />
      <div className="flex gap-4 mt-2">
        <SignInButton mode="modal">
          <button className="px-6 py-2 rounded-full bg-zinc-100 text-zinc-900 font-medium hover:bg-white transition-colors">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="px-6 py-2 rounded-full border border-zinc-700 text-zinc-100 font-medium hover:border-zinc-500 transition-colors">
            Sign up
          </button>
        </SignUpButton>
      </div>
    </main>
  )
}
