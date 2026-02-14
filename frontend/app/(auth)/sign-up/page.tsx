'use client'

import FooterLink from "@/components/form/FooterLink"
import InputField from "@/components/form/InputField"
import { useRouter } from "next/navigation"

const SignUp = () => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
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