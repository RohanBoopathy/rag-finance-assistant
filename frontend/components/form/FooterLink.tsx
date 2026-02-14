import Link from "next/link"

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <div className="text-center pt-4">
      <p>
        {text} {` `}
        <Link className="text-yellow-300 underline" href={href}>
          {linkText}
        </Link>
      </p>
    </div>
  )
}

export default FooterLink