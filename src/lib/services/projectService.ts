import prisma from '@/lib/db/prisma';

/**
 * Create a new project in the database with generated code
 */
export async function createProject(data: {
  name: string;
  description?: string;
  notionPages: string[];
  codeContent: string;
  userId: string;
}) {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description || '',
      status: 'draft',
      notionPages: data.notionPages,
      codeContent: data.codeContent,
      userId: data.userId,
    },
  });
}

/**
 * Get all projects for a specific user
 */
export async function getUserProjects(userId: string) {
  return prisma.project.findMany({
    where: {
      userId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

/**
 * Get a specific project by ID
 */
export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      deployments: true,
    },
  });
}

/**
 * Update a project's code content
 */
export async function updateProjectCode(projectId: string, codeContent: string) {
  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      codeContent,
      updatedAt: new Date(),
    },
  });
}

/**
 * Deploy a project (create a deployment record)
 */
export async function deployProject(projectId: string) {
  // First update the project status
  const project = await prisma.project.update({
    where: {
      id: projectId,
    },
    data: {
      status: 'deployed',
    },
  });
  
  // Get the count of existing deployments to determine version
  const deploymentCount = await prisma.deployment.count({
    where: {
      projectId,
    },
  });
  
  // Create a new deployment record
  return prisma.deployment.create({
    data: {
      projectId,
      version: deploymentCount + 1,
      status: 'deployed',
      url: `https://prototype-${projectId.substring(0, 8)}.foundation.app`,
    },
  });
} 