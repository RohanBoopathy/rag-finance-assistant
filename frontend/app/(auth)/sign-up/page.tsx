'use client'

import FooterLink from "@/components/form/FooterLink"
import InputField from "@/components/form/InputField"
import { useRouter } from "next/navigation"
import { useState } from "react"

const SignUp = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);

    try{
      setError("")
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: (e.target as HTMLFormElement).fullname.value,
          email: (e.target as HTMLFormElement).email.value,
          password: (e.target as HTMLFormElement).password.value
        })
      })

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Failed to Sign Up")
        throw new Error("Failed to Sign Up")
      }

      router.push('/sign-in')

    } catch (error) {
        console.error("Unable to Sign Up", error)
    } finally {
        setLoading(false)
    }
  };

  return (
    <>
      <h1 className="text-xl text-center mb-10">Welcome to <span className="text-title">Query-Fi</span></h1>

      <form className="w-75 flex flex-col space-y-5" onSubmit={handleSubmit}>
        <InputField 
          name="fullname"
          label="Full Name"
          placeholder="Enter your full name"
          value=""
        />

        <InputField 
          name="email"
          label="Email"
          placeholder="Enter your email address"
          value=""
        />
        
        <InputField 
          name="password"
          label="Password"
          placeholder="Enter your password"
          value=""
          type="password"
        />

        <button type="submit" className="h-12 rounded-lg border-2 border-yellow-300 bg-yellow-400 px-3 text-black hover:bg-black hover:text-yellow-300 hover:font-semibold cursor-pointer">Sign Up</button>

        <FooterLink text="Don't have an account.?" linkText="Sign In" href="/sign-in" />
      </form>
    </>
  )
}

export default SignUp