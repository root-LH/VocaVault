import prisma from "./prisma";

export async function getFolderTopicIdsRecursive(folderId: string): Promise<string[]> {
  const folderIds = [folderId];
  let currentIds = [folderId];
  
  while (currentIds.length > 0) {
    const subFolders = await prisma.folder.findMany({
      where: {
        parentId: { in: currentIds }
      },
      select: { id: true }
    });
    
    currentIds = subFolders.map(f => f.id);
    folderIds.push(...currentIds);
  }
  
  const topics = await prisma.topic.findMany({
    where: {
      folderId: { in: folderIds }
    },
    select: { id: true }
  });
  
  return topics.map(t => t.id);
}
