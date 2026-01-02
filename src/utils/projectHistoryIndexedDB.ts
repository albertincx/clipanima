// Project history management utility using IndexedDB
const DB_NAME = 'AnimationProjectsDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

interface Project {
  id?: string;
  name: string;
  frames: string[];
  timestamp: number;
  frameCount: number;
}

// Initialize IndexedDB
let db: IDBDatabase | null = null;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
};

// Load project history from IndexedDB
export const loadProjectHistory = async (): Promise<Project[]> => {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      if (!db) {
        reject('Database not initialized');
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      
      // Get all projects and sort by timestamp (newest first)
      const request = index.openCursor(null, 'prev');
      const projects: Project[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          projects.push(cursor.value);
          cursor.continue();
        } else {
          // Limit to 5 most recent projects
          resolve(projects.slice(0, 5));
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading project history:', error);
    return [];
  }
};

// Save project to IndexedDB history
export const saveProjectToHistory = async (frames: string[], projectName: string = ''): Promise<void> => {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      if (!db) {
        reject('Database not initialized');
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      // Create new project entry
      const newProject: Project = {
        name: projectName || `Project ${new Date().toLocaleDateString()}`,
        frames: [...frames], // Copy the frames array
        timestamp: Date.now(),
        frameCount: frames.length
      };
      
      const request = store.add(newProject);

      request.onsuccess = async () => {
        // After adding, ensure we only keep the 5 most recent projects
        try {
          const allProjects = await loadAllProjects();
          if (allProjects.length > 5) {
            // Sort by timestamp (oldest first) and remove excess
            const sortedProjects = allProjects.sort((a, b) => a.timestamp - b.timestamp);
            const projectsToDelete = sortedProjects.slice(0, sortedProjects.length - 5);
            
            for (const project of projectsToDelete) {
              if (project.id) {
                const deleteRequest = store.delete(project.id);
                deleteRequest.onerror = () => {
                  console.error('Error deleting old project:', deleteRequest.error);
                };
              }
            }
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error saving project to history:', error);
  }
};

// Load all projects (helper function)
const loadAllProjects = (): Promise<Project[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject('Database not initialized');
      return;
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Delete a project from IndexedDB history
export const deleteProjectFromHistory = async (projectId: string): Promise<void> => {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      if (!db) {
        reject('Database not initialized');
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.delete(projectId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error deleting project from history:', error);
  }
};

// Clear all project history from IndexedDB
export const clearProjectHistory = async (): Promise<void> => {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      if (!db) {
        reject('Database not initialized');
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error clearing project history:', error);
  }
};

// Load a specific project by ID from IndexedDB
export const loadProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    await initDB();
    
    return new Promise((resolve, reject) => {
      if (!db) {
        reject('Database not initialized');
        return;
      }

      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error loading project by ID:', error);
    return null;
  }
};