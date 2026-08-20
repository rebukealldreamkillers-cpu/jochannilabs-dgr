"use client";

export default function EngagementError({ error }: { error: Error }) {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-lg font-semibold text-red-700">Error loading engagement</h2>
      <p className="font-mono text-sm bg-red-50 border border-red-200 rounded p-4 text-red-900 whitespace-pre-wrap">
        {error.message}
      </p>
    </div>
  );
}
