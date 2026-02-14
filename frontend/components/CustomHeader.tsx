import { Bell, CircleUserRound } from 'lucide-react'

const CustomHeader = ({title}: {title: string}) => {
  return (
    <div className='flex w-full justify-between mx-10 text-2xl font-semibold'>
        <h1>{title}</h1>

        <div className='flex items-center gap-10'>
            <Bell />

            <CircleUserRound />
        </div>
    </div>
  )
}

export default CustomHeader