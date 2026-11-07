import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/backend/auth/auth";
import { listProjects, createProject } from "@/backend/services/projectService";
import { z } from "zod";

const createProjectSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  code: z.string().optional(),
  title: z.string().min(1, "Project title is required"),
  description: z.string().optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  milestones: z.array(
    z.object({
      code: z.string().optional(),
      title: z.string().min(1, "Milestone title is required"),
      description: z.string().min(1, "Deliverable description is required"),
      amount: z.number().positive("Milestone amount must be positive"),
      dueDate: z.string(),
    })
  ).min(1, "At least one milestone is required"),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await listProjects(session.userId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("List projects error:", error);
    return NextResponse.json({ error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const project = await createProject(session.userId, result.data);
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create project" },
      { status: 500 }
    );
  }
}
