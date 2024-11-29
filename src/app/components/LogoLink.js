import Link from "next/link";
import Image from "next/image";

export default function LogoLink({href}) {
  return (
    <Link href={href ? href : "/"}>
      <Image src="/static/images/logo.png" alt="Logo" width={50} height={50} priority={true} className="min-w-6"/>
    </Link>
  );
}