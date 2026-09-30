"use client";

export function MarkRead({ id, read }: { id: string; read: boolean }) {
  if (read) return null;
  return (
    <form
      action={async () => {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, is_read: true }),
        });
      }}
    >
      <button type="submit" className="mt-2 text-label-sm text-primary underline">
        Mark read
      </button>
    </form>
  );
}
