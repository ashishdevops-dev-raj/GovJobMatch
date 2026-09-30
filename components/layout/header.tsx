"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Government Jobs" },
  { href: "/exams", label: "Exams" },
  { href: "/eligibility", label: "Eligibility Matcher" },
  { href: "/notifications", label: "Notifications" },
  { href: "/saved", label: "Saved Jobs" },
];

export function Header({
  userName,
  userMeta,
  unread,
  isAdmin,
}: {
  userName?: string | null;
  userMeta?: string | null;
  unread?: number;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    router.push(`/jobs?${params.toString()}`);
    setOpen(false);
  }

  return (
    <header className="fixed top-0 right-0 left-0 z-50 bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1440px] px-margin-sm md:px-margin">
        <div className="flex h-16 items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <Link href="/" className="flex items-center gap-space-sm">
              <Logo className="h-8 w-8" />
              <span className="font-headline-md text-headline-md tracking-tight text-primary">
                GovJobMatch
              </span>
            </Link>
            <nav className="hidden items-center gap-space-md xl:flex">
              {NAV.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "py-space-xs text-label-lg transition-colors",
                      active
                        ? "font-bold text-primary"
                        : "text-on-surface-variant hover:text-on-surface",
                    )}
                  >
                    {item.label}
                    {item.href === "/notifications" && unread ? (
                      <span className="ml-1 rounded-full bg-error px-1.5 py-0.5 text-label-sm leading-none text-on-error">
                        {unread}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
              {isAdmin ? (
                <Link href="/admin" className="py-space-xs text-label-lg text-on-surface-variant hover:text-on-surface">
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-space-sm">
            <form onSubmit={submitSearch} className="hidden md:block">
              <label className="flex w-56 items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 lg:w-64">
                <Search className="h-4 w-4 text-on-surface-variant" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search vacancies..."
                  className="w-full bg-transparent text-body-sm outline-none"
                />
              </label>
            </form>
            <Link
              href="/notifications"
              className="relative rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread ? (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
              ) : null}
            </Link>
            {userName ? (
              <Link href="/profile" className="hidden items-center gap-2 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-sm font-bold text-on-primary">
                  {userName.slice(0, 1).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-label-lg leading-tight text-on-surface">{userName}</div>
                  {userMeta ? (
                    <div className="rounded bg-surface-container-low px-1 text-label-sm text-secondary">
                      {userMeta}
                    </div>
                  ) : null}
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg bg-primary px-3 py-2 text-label-lg text-on-primary sm:inline-flex"
              >
                Sign in
              </Link>
            )}
            <button
              type="button"
              className="rounded-lg p-2 xl:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open ? (
          <div className="space-y-2 pb-4 xl:hidden">
            <form onSubmit={submitSearch} className="md:hidden">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search jobs, exams, departments..."
                className="h-11 w-full rounded-lg bg-surface-container-low px-3"
              />
            </form>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-2 py-2 text-label-lg hover:bg-surface-container-low"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href={userName ? "/profile" : "/login"} className="block px-2 py-2 text-label-lg">
              {userName ? "Profile" : "Sign in"}
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}
