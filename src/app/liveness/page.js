"use client";

import { useRouter } from "next/navigation";

export default function LivenessPage() {
  const router = useRouter();

  return (
    <main className="max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold">Liveness Check</h1>

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 space-y-3">
        <p className="text-sm text-[rgb(var(--muted))]">
          This is a placeholder page. Real liveness detection will be added later.
        </p>

        <div className="rounded-lg border border-[rgb(var(--border))] bg-white p-4">
          <div className="font-medium">Instructions</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-[rgb(var(--muted))] space-y-1">
            <li>Blink twice.</li>
            <li>Turn your head left, then right.</li>
            <li>Look at the camera and stay still for 2 seconds.</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/ballot")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            I passed
          </button>

          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-[rgb(var(--border))] px-4 py-2 text-sm hover:bg-white"
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
