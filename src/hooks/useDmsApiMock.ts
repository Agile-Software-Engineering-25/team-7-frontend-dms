type Doc = {
  id: string;
  name: string;
  size: number;
  createdDate?: string;
  type?: string;
  parentId?: string;
};

type Folder = {
  id: string;
  name: string;
  parentId?: string;
  createdDate?: string;
  subfolders: string[];
  documents: string[];
};

function nowIso() {
  return new Date().toISOString();
}

function genId() {
  return `mock-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * In-memory mock API for DMS. Intentionally naive and synchronous-ish for
 * simple local development and tests. Data is not persisted across reloads.
 *
 * Use via `useDmsApiSelector()` when mock mode is enabled.
 */
export default function createMockApi() {
  // initial data based on the sampleItems used in the FileExplorer
  const folders = new Map<string, Folder>();
  const documents = new Map<string, Doc>();

  const root: Folder = {
    id: 'root',
    name: 'Home',
    parentId: undefined,
    createdDate: nowIso(),
    subfolders: [],
    documents: [],
  };
  folders.set(root.id, root);

  // sample docs
  const d1: Doc = {
    id: '1',
    name: 'Project Plan.docx',
    size: 23456,
    createdDate: '2025-08-01T10:23:00Z',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    parentId: 'root',
  };
  const d2: Doc = {
    id: '2',
    name: 'Designs.pdf',
    size: 1048576,
    createdDate: '2025-07-28T08:12:00Z',
    type: 'application/pdf',
    parentId: 'root',
  };
  documents.set(d1.id, d1);
  documents.set(d2.id, d2);
  root.documents.push(d1.id, d2.id);

  // sample folder
  const f1: Folder = {
    id: '3',
    name: 'Archives',
    parentId: 'root',
    createdDate: '2025-06-15T12:00:00Z',
    subfolders: [],
    documents: [],
  };
  folders.set(f1.id, f1);
  root.subfolders.push(f1.id);

  async function getFolder(id: string) {
    const f = folders.get(id);
    if (!f) throw new Error('Folder not found');
    return {
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      createdDate: f.createdDate,
      subfolders: f.subfolders.map((sid) => {
        const sf = folders.get(sid)!;
        return {
          id: sf.id,
          name: sf.name,
          parentId: sf.parentId,
          createdDate: sf.createdDate,
        };
      }),
      documents: f.documents.map((did) => {
        const dd = documents.get(did)!;
        return {
          id: dd.id,
          name: dd.name,
          type: dd.type ?? 'application/octet-stream',
          size: dd.size,
          createdDate: dd.createdDate,
          downloadUrl: undefined,
        };
      }),
    };
  }

  async function createFolder(name: string, parentId?: string) {
    const id = genId();
    const folder: Folder = {
      id,
      name,
      parentId: parentId ?? 'root',
      createdDate: nowIso(),
      subfolders: [],
      documents: [],
    };
    folders.set(id, folder);
    const parent = folders.get(folder.parentId!);
    if (parent) parent.subfolders.unshift(id);
    return {
      id: folder.id,
      name: folder.name,
      createdDate: folder.createdDate,
    };
  }

  async function renameFolder(id: string, name: string) {
    const f = folders.get(id);
    if (!f) throw new Error('Folder not found');
    f.name = name;
    return { id: f.id, name: f.name };
  }

  async function deleteFolder(id: string) {
    // recursive deletion
    const toDelete: string[] = [];
    function gather(fid: string) {
      const ff = folders.get(fid);
      if (!ff) return;
      toDelete.push(fid);
      ff.subfolders.forEach(gather);
      ff.documents.forEach((d) => toDelete.push(`doc:${d}`));
    }
    gather(id);
    // remove docs and folders
    for (const key of toDelete) {
      if (key.startsWith('doc:')) {
        const did = key.slice(4);
        documents.delete(did);
      } else {
        folders.delete(key);
      }
    }
    // remove from parent's subfolders
    for (const [, folder] of folders) {
      folder.subfolders = folder.subfolders.filter((s) => s !== id);
    }
    return;
  }

  async function renameDocument(id: string, name: string) {
    const d = documents.get(id);
    if (!d) throw new Error('Document not found');
    d.name = name;
    return { id: d.id, name: d.name };
  }

  async function deleteDocument(id: string) {
    documents.delete(id);
    for (const [, folder] of folders) {
      folder.documents = folder.documents.filter((d) => d !== id);
    }
  }

  async function uploadDocument(file: File, folderId: string) {
    const id = genId();
    const d: Doc = {
      id,
      name: file.name,
      size: file.size,
      createdDate: nowIso(),
      type: file.type || 'application/octet-stream',
      parentId: folderId,
    };
    documents.set(id, d);
    const parent = folders.get(folderId);
    if (parent) parent.documents.unshift(id);
    return { id: d.id, name: d.name, size: d.size, createdDate: d.createdDate };
  }

  async function downloadDocument(id: string) {
    const doc = documents.get(id);
    if (!doc) throw new Error('Document not found');

    // create dummy blob
    const content = `Mock file content for ${doc.name}`;
    const blob = new Blob([content], {type: doc.type ?? 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    return { url, name: doc.name };
  }

  async function moveDocument(id: string, parentId?: string) {
    const d = documents.get(id);
    if (!d) throw new Error('Document not found');
    // remove from old parent
    for (const [, folder] of folders) {
      folder.documents = folder.documents.filter((x) => x !== id);
    }
    const destId = parentId ?? 'root';
    const dest = folders.get(destId);
    if (!dest) throw new Error('Destination folder not found');
    dest.documents.unshift(id);
    d.parentId = destId;
    return { id: d.id };
  }

  async function moveFolder(id: string, parentId?: string) {
    const f = folders.get(id);
    if (!f) throw new Error('Folder not found');
    // remove from old parent
    for (const [, folder] of folders) {
      folder.subfolders = folder.subfolders.filter((x) => x !== id);
    }
    const destId = parentId ?? 'root';
    const dest = folders.get(destId);
    if (!dest) throw new Error('Destination folder not found');
    dest.subfolders.unshift(id);
    f.parentId = destId;
    return { id: f.id };
  }

  return {
    getFolder,
    renameDocument,
    renameFolder,
    deleteDocument,
    deleteFolder,
    uploadDocument,
    downloadDocument,
    createFolder,
    moveDocument,
    moveFolder,
  };
}
