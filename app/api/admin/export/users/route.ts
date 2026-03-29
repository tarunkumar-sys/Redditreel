import { prisma, auth } from "@/auth";
import Papa from "papaparse";

export async function GET() {
  const session = await auth();
  
  if (session?.user?.role !== 'ADMIN') {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        suspended: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const csvData = users.map(u => ({
      id: u.id,
      name: u.name || 'N/A',
      email: u.email || 'N/A',
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      isBanned: u.suspended ? 'Yes' : 'No',
    }));

    const csv = Papa.unparse(csvData);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="users-export.csv"',
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
