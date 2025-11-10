import JSZip from 'jszip';
import { saveAs } from 'file-saver';
//import { setGlobalUser } from './useUser';
import { User } from 'oidc-client-ts';

type Doc = {
  id: string;
  name: string;
  size: number;
  createdDate?: string;
  type?: string;
  parentId?: string;
  blob?: Blob;
};

type Folder = {
  id: string;
  name: string;
  parentId?: string;
  studyGroupIds?: string;
  createdDate?: string;
  subfolders: string[];
  documents: string[];
};

// token to test role functionality
const fakePayload = {
  realm_access: {
    roles: [
      'Area-2.Team-7.ReadUpdateDelete.readwrite-document',
      'Area-2.Team-7.Read.read-document',
    ], // either ['Area-2.Team-7.Read.read-document'] or ['Area-2.Team-7.ReadUpdateDelete.readwrite-document', 'Area-2.Team-7.Read.read-document']
  },
};
// JWT consists of header.payload.signature - all base64 encoded
const fakeHeader = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
const fakeBody = btoa(JSON.stringify(fakePayload));
const fakeSignature = 'mocksignature';

const fakeToken = `${fakeHeader}.${fakeBody}.${fakeSignature}`;

const mockUser: User = {
  profile: {
    sub: '123',
    given_name: 'Max',
    family_name: 'Mustermann',
    name: 'Max Mustermann',
    email: 'max@example.com',
  },
  access_token: fakeToken,
  id_token: '',
  session_state: '',
  scope: '',
  expires_in: 3600,
  token_type: 'Bearer',
  refresh_token: '',
  state: '',
} as User;

setGlobalUser(mockUser);

//mocked setGlobalUser because it was revomed in useUser.ts
function setGlobalUser(user: User | null) {
  return user;
}

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
  // Neue Mock-Struktur: Informatik Studiengänge (Telekom) > BIN-T22/T23/T24 > F1-F4/F3
  const folders = new Map<string, Folder>();
  const documents = new Map<string, Doc>();

  // Root-Ordner
  const root: Folder = {
    id: 'XRoot',
    name: 'Home',
    parentId: undefined,
    createdDate: nowIso(),
    subfolders: [],
    documents: [],
  };
  folders.set(root.id, root);

  // Hauptordner
  const infId = 'inf';
  const infFolder: Folder = {
    id: infId,
    name: 'Informatik Studiengänge (Telekom)',
    parentId: 'XRoot',
    createdDate: nowIso(),
    subfolders: [],
    documents: [],
  };
  folders.set(infId, infFolder);
  root.subfolders.push(infId);

  // BIN-TXX Ordner und Unterordner
  const binDefs = [
    { name: 'BIN-T22', jahr: '22', fCount: 4 },
    { name: 'BIN-T23', jahr: '23', fCount: 4 },
    { name: 'BIN-T24', jahr: '24', fCount: 3 },
  ];

  binDefs.forEach((bin) => {
    const binId = `bin-${bin.jahr}`;
    const binFolder: Folder = {
      id: binId,
      name: bin.name,
      parentId: infId,
      createdDate: nowIso(),
      subfolders: [],
      documents: [],
    };
    folders.set(binId, binFolder);
    infFolder.subfolders.push(binId);

    // Wirtschaftstrends.pptx und ETFs_explained.docx nur für BIN-T23
    if (bin.jahr === '23') {
      const wirtschaftId = 'pptx-23';
      const wirtschaftDoc: Doc = {
        id: wirtschaftId,
        name: 'Wirtschaftstrends.pptx',
        size: 500000,
        createdDate: nowIso(),
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        parentId: binId,
      };
      documents.set(wirtschaftId, wirtschaftDoc);
      binFolder.documents.push(wirtschaftId);

      const etfsId = 'docx-etfs-23';
      const etfsDoc: Doc = {
        id: etfsId,
        name: 'ETFs_explained.docx',
        size: 42000,
        createdDate: nowIso(),
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        parentId: binId,
      };
      documents.set(etfsId, etfsDoc);
      binFolder.documents.push(etfsId);
    }

    // F1-FX Unterordner und PDF-Dokumente
    for (let f = 1; f <= bin.fCount; f++) {
      const fId = `bin-${bin.jahr}-f${f}`;
      const fFolder: Folder = {
        id: fId,
        name: `F${f}`,
        parentId: binId,
        createdDate: nowIso(),
        subfolders: [],
        documents: [],
      };
      folders.set(fId, fFolder);
      binFolder.subfolders.push(fId);

      // PDF-Dokument für F-Ordner
      const pdfId = `pdf-${bin.jahr}-f${f}`;
      const pdfDoc: Doc = {
        id: pdfId,
        name: `Stundenplan_${bin.name}-F${f}_SoSe25.pdf`,
        size: 1048576,
        createdDate: nowIso(),
        type: 'application/pdf',
        parentId: fId,
      };
      documents.set(pdfId, pdfDoc);
      fFolder.documents.push(pdfId);

      // Verschachtelte Unterordner für F2 nur in BIN-T23
      if (f === 2 && bin.jahr === '23') {
        const subfolderNames = [
          'Wie',
          'ist',
          'das',
          'eigentlich',
          'mit',
          'ganz',
          'vielen',
          'Unterordnern',
        ];
        let parentSubId = fId;
        subfolderNames.forEach((name, idx) => {
          const subId = `${fId}-sub${idx}`;
          const subFolder: Folder = {
            id: subId,
            name,
            parentId: parentSubId,
            createdDate: nowIso(),
            subfolders: [],
            documents: [],
          };
          folders.set(subId, subFolder);
          const parentFolder = folders.get(parentSubId);
          if (parentFolder) parentFolder.subfolders.push(subId);
          parentSubId = subId;
        });
        // Test-Ordner im letzten Unterordner anlegen und Datei hineinlegen
        const lastSubId = `${fId}-sub${subfolderNames.length - 1}`;
        const testFolderId = `${lastSubId}-test`;
        const testFolder: Folder = {
          id: testFolderId,
          name: 'Test',
          parentId: lastSubId,
          createdDate: nowIso(),
          subfolders: [],
          documents: [],
        };
        folders.set(testFolderId, testFolder);
        const lastSubFolder = folders.get(lastSubId);
        if (lastSubFolder) lastSubFolder.subfolders.push(testFolderId);

        // Scrum-Ordner im Test-Ordner anlegen
        const scrumFolderId = `${testFolderId}-design`;
        const scrumFolder: Folder = {
          id: scrumFolderId,
          name: 'Design',
          parentId: testFolderId,
          createdDate: nowIso(),
          subfolders: [],
          documents: [],
        };
        folders.set(scrumFolderId, scrumFolder);
        testFolder.subfolders.push(scrumFolderId);

        // Datei im Test-Ordner anlegen
        const falschId = `csv-${bin.jahr}-f2-falsch`;
        const falschDoc: Doc = {
          id: falschId,
          name: 'falsch_benannt.csv',
          size: 1234,
          createdDate: nowIso(),
          type: 'text/csv',
          parentId: testFolderId,
        };
        documents.set(falschId, falschDoc);
        testFolder.documents.push(falschId);
      }
    }
  });

  // sample docs from public/
  const dPdf: Doc = {
    id: 'pdf-1',
    name: 'Example PDF.pdf',
    size: 12345,
    createdDate: nowIso(),
    type: 'application/pdf',
    parentId: 'XRoot',
  };

  const dSvg: Doc = {
    id: 'svg-1',
    name: 'Vector Graphic.svg',
    size: 2345,
    createdDate: nowIso(),
    type: 'image/svg+xml',
    parentId: 'XRoot',
  };

  const dPng: Doc = {
    id: 'png-1',
    name: 'Picture.png',
    size: 54321,
    createdDate: nowIso(),
    type: 'image/png',
    parentId: 'r981723a129387',
  };

  const dJpg: Doc = {
    id: 'jpg-1',
    name: 'Photo.jpg',
    size: 65432,
    createdDate: nowIso(),
    type: 'image/jpeg',
    parentId: 'XRoot',
  };

  const dTxt: Doc = {
    id: 'txt-1',
    name: 'Notes.txt',
    size: 1024,
    createdDate: nowIso(),
    type: 'text/plain',
    parentId: 'XRoot',
  };
  documents.set(dPdf.id, dPdf);
  documents.set(dSvg.id, dSvg);
  documents.set(dPng.id, dPng);
  documents.set(dJpg.id, dJpg);
  documents.set(dTxt.id, dTxt);
  root.documents.push(dPdf.id, dSvg.id, dPng.id, dJpg.id, dTxt.id);

  async function getFolder(id: string) {
    if (id === 'root') id = 'XRoot';
    const f = folders.get(id);
    if (!f) throw new Error('Folder not found');
    return {
      folders: {
        id: f.id,
        name: f.name,
        parentId: f.parentId,
        studyGroupIds: f.studyGroupIds,
        createdDate: f.createdDate,
      },
      subfolders: f.subfolders.map((sid) => {
        const sf = folders.get(sid)!;
        return {
          id: sf.id,
          name: sf.name,
          parentId: sf.parentId,
          studyGroupIds: sf.studyGroupIds,
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
      parentId: parentId ?? 'XRoot',
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
      blob: file, // Store the actual file blob
    };
    documents.set(id, d);
    const parent = folders.get(folderId);
    if (parent) parent.documents.unshift(id);
    return { id: d.id, name: d.name, size: d.size, createdDate: d.createdDate };
  }

  async function downloadDocument(id: string) {
    const doc = documents.get(id);
    if (!doc) throw new Error('Document not found');

    // If document has a blob (uploaded file), use it
    if (doc.blob) {
      const url = URL.createObjectURL(doc.blob);
      return {
        url,
        name: doc.name,
        type: doc.type || 'application/octet-stream',
      };
    }

    // Otherwise, use example files from public/mock-files (for pre-populated data)
    const publicBase = '/mock-files';
    if (id === 'pdf-1')
      return {
        url: `${publicBase}/example.pdf`,
        name: doc.name,
        type: 'application/pdf',
      };
    if (id === 'svg-1')
      return {
        url: `${publicBase}/example.svg`,
        name: doc.name,
        type: 'image/svg+xml',
      };
    if (id === 'png-1')
      return {
        url: `${publicBase}/example.png`,
        name: doc.name,
        type: 'image/png',
      };
    if (id === 'jpg-1')
      return {
        url: `${publicBase}/example.jpg`,
        name: doc.name,
        type: 'image/jpeg',
      };
    if (id === 'txt-1')
      return {
        url: `${publicBase}/example.txt`,
        name: doc.name,
        type: 'text/plain',
      };

    // fallback: create dummy blob
    const content = `Mock file content for ${doc.name}`;
    const blob = new Blob([content], {
      type: doc.type ?? 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);

    return {
      url,
      name: doc.name,
      type: doc.type ?? 'application/octet-stream',
    };
  }

  async function downloadAsZip(
    docs: { url: string; name: string; path: string }[],
    folderName?: string
  ) {
    if (!docs || docs.length === 0) {
      throw new Error('No documents to zip');
    }
    const zip = new JSZip();

    for (const doc of docs) {
      const response = await fetch(doc.url);
      const blob = await response.blob();
      const fullPath = doc.path ? `${doc.path}/${doc.name}` : doc.name;
      zip.file(fullPath, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const folder = folderName || 'mock-folder';
    saveAs(content, `${folder}.zip`);
  }

  async function moveDocument(id: string, parentId?: string) {
    const d = documents.get(id);
    if (!d) throw new Error('Document not found');
    // remove from old parent
    for (const [, folder] of folders) {
      folder.documents = folder.documents.filter((x) => x !== id);
    }
    const destId = parentId ?? 'XRoot';
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
    const destId = parentId ?? 'XRoot';
    const dest = folders.get(destId);
    if (!dest) throw new Error('Destination folder not found');
    dest.subfolders.unshift(id);
    f.parentId = destId;
    return { id: f.id };
  }

  const getStudyGroups = async () => {
    // Mock study groups response
    return {
      group_count: 3,
      groups: [
        { name: 'BIN-T22', students_count: 25, students: null },
        { name: 'BIN-T23', students_count: 30, students: null },
        { name: 'BIN-T24', students_count: 28, students: null },
      ],
    };
  };

  const updateFolderStudyGroups = async (id: string, studyGroupIds: string[]) => {
    const f = folders.get(id);
    if (!f) throw new Error('Folder not found');
    
    // In a real implementation, this would update the folder's studyGroupIds
    // For the mock, we just acknowledge the update
    return { id: f.id, studyGroupIds };
  };

  return {
    getFolder,
    getStudyGroups,
    renameDocument,
    renameFolder,
    deleteDocument,
    deleteFolder,
    uploadDocument,
    downloadDocument,
    downloadAsZip,
    createFolder,
    updateFolderStudyGroups,
    moveDocument,
    moveFolder,
  };
}
