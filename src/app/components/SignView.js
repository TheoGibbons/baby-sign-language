"use client";

import Image from "next/image";
import Link from "next/link";
import {FULL_FULL_WIDTH, FULL_NO_IMAGE, FULL_NO_TEXT, FULL_YOUTUBE, HALF_YOUTUBE,} from "@/app/components/views";
import {YouTubeEmbed} from "@/components/YouTubeEmbed";

export default function SignView({sign, view}) {
  return (
    <div key={sign.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-600">
      <Link href={`/${sign.slug}`}>
        <div className="flex justify-center dark:bg-gray-600">
          {/* Render the image or alternate content based on the view */}
          {([FULL_NO_IMAGE, FULL_YOUTUBE, HALF_YOUTUBE].indexOf(view) === -1) && sign?.thumbnailFile?.local_path ? (
            (view === FULL_FULL_WIDTH && sign?.imageFile?.local_path ?
                (
                  <Image
                    src={sign?.imageFile?.local_path}
                    alt={sign?.name}
                    width={500}
                    height={500}
                  />
                ) : (
                  <Image
                    src={sign?.thumbnailFile?.local_path}
                    alt={sign?.name}
                    width={250}
                    height={250}
                  />
                )
            )) : (
            ([FULL_NO_IMAGE, FULL_YOUTUBE, HALF_YOUTUBE].indexOf(view) === -1) && "No image available"
          )}
          {[FULL_YOUTUBE, HALF_YOUTUBE].indexOf(view) !== -1 &&
            <YouTubeEmbed url={sign?.youtube_url} title={`YouTube ${sign?.name}`}/>
          }
        </div>
        {/* Hide text for FULL_NO_TEXT view */}
        {[FULL_NO_TEXT, FULL_YOUTUBE, HALF_YOUTUBE].indexOf(view) === -1 && <h1>{sign.name}</h1>}
      </Link>
    </div>
  );
}
