"use client";

import Image from "next/image";
import {useContext} from "react";
import {AuthProviderContext} from "@/app/components/AuthProvider";

export default function Sign(params) {

  console.log(params);

  return JSON.stringify(params);

}
