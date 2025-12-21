"use client"
import * as React from "react"

type IconProps = {
  size?: number
  mood?: string
  className?: string
}

export function DogIcon({ size = 48, mood = "happy", className = "" }: IconProps) {
  const eye = mood === "loved" ? (
    <g fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M-4 0c1-2 4-2 6 0" transform="translate(8 18)" />
      <path d="M4 0c1-2 4-2 6 0" transform="translate(8 18)" />
    </g>
  ) : (
    <g fill="currentColor">
      <circle cx="14" cy="18" r="2" />
      <circle cx="22" cy="18" r="2" />
    </g>
  )

  const mouth = mood === "hungry" ? (
    <path d="M12 26c3 3 9 3 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  ) : mood === "happy" ? (
    <path d="M12 24c3 4 9 4 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  ) : (
    <path d="M18 24c-1.5 0-3 1.5-3 1.5s1.5 1.5 3 1.5 3-1.5 3-1.5S19.5 24 18 24z" fill="currentColor" />
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="36" height="36" rx="9" fill="transparent" />
      <g transform="translate(0 0)" fill="currentColor">
        <path d="M6 14c0-4 4-8 12-8s12 4 12 8v6c0 4-4 6-12 6S6 24 6 20v-6z" opacity="0.06" />
      </g>
      <g fill="currentColor" stroke="none">
        <path d="M8 12c2-3 5-4 10-4s8 1 10 4" opacity="0.08" />
      </g>
      {eye}
      {mouth}
    </svg>
  )
}

export function CatIcon({ size = 48, mood = "happy", className = "" }: IconProps) {
  const ears = (
    <g fill="currentColor">
      <path d="M8 12 L12 6 L14 12 Z" />
      <path d="M28 12 L24 6 L22 12 Z" />
    </g>
  )

  const eyes = mood === "loved" ? (
    <g fill="currentColor">
      <path d="M12 18c0-2 4-3 6 0" />
      <path d="M24 18c0-2 4-3 6 0" />
    </g>
  ) : (
    <g fill="currentColor">
      <circle cx="14" cy="18" r="2" />
      <circle cx="22" cy="18" r="2" />
    </g>
  )

  const mouth = mood === "hungry" ? (
    <path d="M18 26c0 0 2-3 6-3" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  ) : (
    <path d="M16 24c2 2 4 2 6 0" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  )

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="36" height="36" rx="9" fill="transparent" />
      {ears}
      <path d="M6 16c0-4 4-8 12-8s12 4 12 8v4c0 4-4 6-12 6S6 24 6 20v-4z" opacity="0.06" fill="currentColor" />
      {eyes}
      {mouth}
    </svg>
  )
}

export default DogIcon
