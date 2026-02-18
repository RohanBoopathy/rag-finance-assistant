import React from "react"

const AuthLayout = ({ children }: {children: React.ReactNode}) => {
  return (
    <main className="flex justify-evenly items-center h-screen">
        <section className="flex flex-col">
            <h1 className="text-8xl"> <span className="text-title">Q</span>UERY <br /><span className="text-title">Fi</span></h1>
            <p className="mt-5">The best finance app powered by <span className="text-rag">Retrieval Augment Generation</span></p>
        </section>

        <section>{children}</section>
    </main>
  )
}

export default AuthLayout