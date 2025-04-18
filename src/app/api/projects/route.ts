import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createProject, getUserProjects, getProjectById } from '@/lib/services/projectService';

// GET /api/projects - Get all prototypes for the current user
export async function GET(request: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to view projects' },
        { status: 401 }
      );
    }
    
    // Get all projects for the current user
    const projects = await getUserProjects(user.id);
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new prototype
export async function POST(request: Request) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to create projects' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, description, notionPages, codeContent, userId } = body;
    
    if (!name || !notionPages || !codeContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Creating project for user ID:', user.id);
    console.log('User ID from request:', userId);
    
    // Create a new project using the user ID from the database
    const project = await createProject({
      name,
      description,
      notionPages,
      codeContent,
      userId: user.id, // Always use the ID from getCurrentUser
    });
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
} 