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
        <SignInButton mode="modal">Sign in</SignInButton>
        <SignUpButton mode="modal">Sign up</SignUpButton>
      </div>
    </main>
  )
}
