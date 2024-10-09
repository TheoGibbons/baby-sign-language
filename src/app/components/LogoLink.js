import Link from "next/link";
import Image from "next/image";

export default function LogoLink() {
  return (
    <Link href="/">
      <Image src="/static/images/logo.png" alt="Logo" width={50} height={50} priority={true}/>
    </Link>
  );
}