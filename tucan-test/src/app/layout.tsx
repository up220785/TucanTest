"use client";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React, { useEffect, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [members, setMembers] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/members")
      .then((res) => res.json())
      .then((data) => setMembers(data.members))
      .catch((err) => console.error(err));
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Example usage: */}
        <div>
          <h2>Members:</h2>
          <ul>
            {members.map((member) => (
              <li key={member}>{member}</li>
            ))}
          </ul>
        </div>
        {children}
      </body>
    </html>
  );
}
