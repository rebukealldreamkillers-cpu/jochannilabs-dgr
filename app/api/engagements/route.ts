import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getEngagements } from "@/lib/engagements";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getEngagements();
  return NextResponse.json(data);
}
