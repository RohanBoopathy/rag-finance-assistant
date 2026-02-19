'use client'

import { Bell, CircleUserRound } from 'lucide-react'
import { useSession } from 'next-auth/react'

const CustomHeader = ({title}: {title: string}) => {
  const { data: session } = useSession()

  console.log('Session data:', session?.user?.email)

  return (
    <div className='flex w-full justify-between mx-10 text-2xl font-semibold'>
        <h1>{title}</h1>

        <div className='flex items-center gap-10'>
            <Bell />

            <div className='flex items-center gap-2'>
              <CircleUserRound />
              {session?.user?.name && (
                <span className='text-sm font-medium'>{session.user.name}</span>
              )}
            </div>
        </div>
    </div>
  )
}

export default CustomHeader