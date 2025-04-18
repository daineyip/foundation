import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getProjectById, updateProjectCode } from '@/lib/services/projectService';

// Get a specific project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to view projects' },
        { status: 401 }
      );
    }
    
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Get the project
    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to view this project' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// Update a specific project
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to update projects' },
        { status: 401 }
      );
    }
    
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }
    
    // Get the project to check ownership
    const project = await getProjectById(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // Check ownership
    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this project' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { codeContent } = body;
    
    if (!codeContent) {
      return NextResponse.json(
        { error: 'Code content is required' },
        { status: 400 }
      );
    }
    
    // Update the project code
    const updatedProject = await updateProjectCode(projectId, codeContent);
    
    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
} 