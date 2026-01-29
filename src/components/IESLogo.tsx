import Image from 'next/image'

export default function IESLogo() {
  return (
    <div className="flex items-center">
      <Image
        src="/ies-logo.svg"
        alt="IES Logo"
        width={60}
        height={60}
        className="h-12 w-12"
      />
    </div>
  )
}
