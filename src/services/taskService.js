// src/services/taskService.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

// Colecciones
const TASKS_COLLECTION = 'tasks';
const USERS_COLLECTION = 'users';

// ===== FUNCIONES PARA TAREAS =====

// Escuchar cambios en tiempo real de las tareas (versión simple sin índices)
export const subscribeToTasksSimple = (callback) => {
  console.log('🔗 TaskService: Configurando listener de Firebase...');
  const tasksQuery = collection(db, TASKS_COLLECTION);

  return onSnapshot(tasksQuery, (snapshot) => {
    console.log('📡 TaskService: ¡Cambios detectados en Firebase!');
    console.log('📊 TaskService: Documentos recibidos:', snapshot.docs.length);
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      const task = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
      
      console.log(`📄 TaskService: Tarea ${doc.id}:`, {
        title: task.title,
        status: task.status,
        updatedAt: task.updatedAt
      });
      
      return task;
    });
    
    // Filtrar y ordenar en el cliente
    const filteredTasks = tasks.filter(task => task.teamId === 'team1');
    filteredTasks.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log('✅ TaskService: Enviando', filteredTasks.length, 'tareas al componente');
    console.log('🏷️ TaskService: Estados de tareas:', filteredTasks.map(t => `${t.title}: ${t.status}`));
    
    callback(filteredTasks);
  }, (error) => {
    console.error("❌ TaskService: Error en listener de Firebase:", error);
    callback([]);
  });
};

// Crear nueva tarea
export const createTask = async (taskData) => {
  console.log('📝 TaskService: Creando nueva tarea...');
  console.log('📊 TaskService: Datos recibidos:', taskData);
  
  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      ...taskData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ TaskService: Tarea creada exitosamente');
    console.log('🆔 TaskService: ID generado por Firebase:', docRef.id);
    console.log('🔄 TaskService: El listener debería detectar la nueva tarea...');
    
    return docRef.id; // Retornar el ID para debug
  } catch (error) {
    console.error('❌ TaskService: Error creando tarea:', error);
    throw error;
  }
};

// Actualizar tarea existente
export const updateTask = async (taskId, updates) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('Tarea actualizada');
  } catch (error) {
    console.error('Error actualizando tarea: ', error);
    throw error;
  }
};

// Eliminar tarea
export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    console.log('Tarea eliminada');
  } catch (error) {
    console.error('Error eliminando tarea: ', error);
    throw error;
  }
};

// ===== FUNCIONES PARA USUARIOS =====

// Escuchar cambios en tiempo real de los usuarios (versión simple)
export const subscribeToUsersSimple = (callback) => {
  const usersQuery = collection(db, USERS_COLLECTION);

  return onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filtrar en el cliente
    const filteredUsers = users.filter(user => user.teamId === 'team1');
    callback(filteredUsers);
  }, (error) => {
    console.error("Error en subscribeToUsersSimple:", error);
    callback([]);
  });
};

// Crear usuario
export const createUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, USERS_COLLECTION), {
      ...userData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creando usuario: ', error);
    throw error;
  }
};

// ===== DATOS INICIALES =====

// Función para poblar la base de datos con datos de ejemplo
export const seedInitialData = async () => {
  try {
    // Verificar si ya existen datos
    const tasksSnapshot = await getDocs(collection(db, TASKS_COLLECTION));
    if (!tasksSnapshot.empty) {
      console.log('Ya existen tareas, no se crearán datos de ejemplo');
      return;
    }

    // Crear usuarios de ejemplo
    const users = [
      { 
        name: 'Carlos López', 
        email: 'carlos@empresa.com', 
        avatar: '👨‍💻',
        teamId: 'team1'
      },
      { 
        name: 'Ana García', 
        email: 'ana@empresa.com', 
        avatar: '👩‍🎨',
        teamId: 'team1'
      },
      { 
        name: 'María Rodríguez', 
        email: 'maria@empresa.com', 
        avatar: '👩‍📝',
        teamId: 'team1'
      }
    ];

    const userPromises = users.map(user => createUser(user));
    await Promise.all(userPromises);

    // Crear tareas de ejemplo
    const tasks = [
      {
        title: 'Diseñar interfaz de usuario',
        description: 'Crear mockups para la nueva funcionalidad',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Ana García',
        createdBy: 'Carlos López',
        dueDate: '2025-03-15',
        teamId: 'team1'
      },
      {
        title: 'Implementar autenticación',
        description: 'Configurar sistema de login con Firebase Auth',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'Carlos López',
        createdBy: 'Ana García',
        dueDate: '2025-06-20',
        teamId: 'team1'
      },
      {
        title: 'Escribir documentación',
        description: 'Documentar la API y guías de usuario',
        status: 'completed',
        priority: 'medium',
        assignedTo: 'María Rodríguez',
        createdBy: 'Carlos López',
        dueDate: '2025-07-10',
        teamId: 'team1'
      }
    ];

    const taskPromises = tasks.map(task => createTask(task));
    await Promise.all(taskPromises);

    console.log('Datos iniciales creados exitosamente');
  } catch (error) {
    console.error('Error creando datos iniciales: ', error);
    throw error;
  }
};