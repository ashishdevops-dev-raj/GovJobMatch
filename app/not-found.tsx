import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl bg-surface-container-lowest p-space-xl text-center">
      <h1 className="font-headline-xl text-primary">Page not found</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">
        That route does not exist. Browse published government job listings instead.
      </p>
      <Link href="/jobs" className="mt-4 inline-block text-primary underline">
        Government Jobs
      </Link>
    </div>
  );
}
