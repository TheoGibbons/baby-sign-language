"use client";

import Image from "next/image";
import Link from "next/link";
import { FULL_FULL_WIDTH, FULL_GRID, FULL_NO_IMAGE, FULL_NO_TEXT } from "@/app/lists/[list_id]/views";

export default function SignView({ sign, view }) {
  return (
    <div key={sign.id} className="p-4 border rounded-lg bg-gray-50">
      <Link href={`/${sign.slug}`}>
        <div>
          {/* Render the image or alternate content based on the view */}
          {view !== FULL_NO_IMAGE && sign.image_url ? (
            <Image
              src={sign.image_url}
              alt={sign?.name}
              width={view === FULL_FULL_WIDTH ? 500 : 250} // Adjust width for grid and full-width
              height={view === FULL_FULL_WIDTH ? 500 : 250}
            />
          ) : (
            view !== FULL_NO_IMAGE && "No image available"
          )}
        </div>
        {/* Hide text for FULL_NO_TEXT view */}
        {view !== FULL_NO_TEXT && <h1>{sign.name}</h1>}
      </Link>
    </div>
  );
}
