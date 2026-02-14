import Sidebar from "@/components/Sidebar"
import React from "react"

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
        <Sidebar />
        <main className="flex-1">
            {children}
        </main>
    </div>
  )
}

export default RootLayout