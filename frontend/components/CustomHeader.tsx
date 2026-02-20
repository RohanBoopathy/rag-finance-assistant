'use client'

import { Bell, CircleUserRound } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"

const CustomHeader = ({title}: {title: string}) => {
  const { data: session } = useSession()
  const initial = session?.user?.name

  return (
    <div className='flex w-full justify-between mx-10 text-2xl font-semibold'>
        <h1>{title}</h1>

        <div className='flex items-center gap-10'>
            <Bell />

            {/* <div className='flex items-center gap-2'>
              <CircleUserRound />
              {session?.user?.name && (
                <span className='text-sm font-medium'>{session.user.name}</span>
              )}
            </div> */}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className='text-black rounded-full text-xl px-2.5' variant="outline">{initial?.charAt(0) || "Profile"}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className='mr-4 p-0' aria-modal={false}>
                <DropdownMenuGroup>
                  <DropdownMenuItem className='p-1'>
                    <Button 
                      className='bg-transparent w-full text-black hover:text-white cursor-pointer'
                      onClick={() => signOut({ callbackUrl: '/sign-in' })}
                    >
                      Log Out
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
  )
}

export default CustomHeader