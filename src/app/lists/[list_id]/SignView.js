"use client";

import Image from "next/image";
import Link from "next/link";

export default function SignView({sign}) {
  return (
    <div>
      <Link href={`/${sign.slug}`}>
        <div>
          {sign.image_url ?
            <Image src={sign.image_url} alt={sign?.name} width={500} height={500}></Image> :
            "No image available"
          }
        </div>
        <h1>{sign.name}</h1>
      </Link>
    </div>
  )
}