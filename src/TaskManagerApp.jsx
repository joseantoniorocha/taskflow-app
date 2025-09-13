import React, { useState, useEffect } from 'react';
import { Plus, Users, Clock, CheckCircle2, Circle, Trash2, Edit3, User, Calendar, Database, AlertCircle } from 'lucide-react';

// Importar funciones de Firebase con manejo de errores
import * as taskService from './services/taskService';

// Datos de respaldo si Firebase no funciona
const mockData = {
  tasks: [
    {
      id: '1',
      title: 'Diseñar interfaz de usuario',
      description: 'Crear mockups para la nueva funcionalidad',
      status: 'pending',
      priority: 'high',
      assignedTo: 'Ana García',
      createdBy: 'Carlos López',
      dueDate: '2024-12-15',
      teamId: 'team1',
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01')
    },
    {
      id: '2',
      title: 'Implementar autenticación',
      description: 'Configurar sistema de login con Firebase Auth',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'Carlos López',
      createdBy: 'Ana García',
      dueDate: '2024-12-20',
      teamId: 'team1',
      createdAt: new Date('2024-12-02'),
      updatedAt: new Date('2024-12-08')
    },
    {
      id: '3',
      title: 'Escribir documentación',
      description: 'Documentar la API y guías de usuario',
      status: 'completed',
      priority: 'medium',
      assignedTo: 'María Rodríguez',
      createdBy: 'Carlos López',
      dueDate: '2024-12-10',
      teamId: 'team1',
      createdAt: new Date('2024-11-28'),
      updatedAt: new Date('2024-12-07')
    }
  ],
  users: [
    { id: '1', name: 'Carlos López', email: 'carlos@empresa.com', avatar: '👨‍💻' },
    { id: '2', name: 'Ana García', email: 'ana@empresa.com', avatar: '👩‍🎨' },
    { id: '3', name: 'María Rodríguez', email: 'maria@empresa.com', avatar: '👩‍📝' }
  ]
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser] = useState({ 
    name: 'Jose Rocha', 
    email: 'jose@empresa.com', 
    avatar: '👨‍💻' 
  });
  const [filter, setFilter] = useState('all');
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFirebase, setUseFirebase] = useState(true);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: '',
    dueDate: ''
  });

  // Configurar datos y listeners
  useEffect(() => {
    let unsubscribeTasks = null;
    let unsubscribeUsers = null;

    const initializeData = async () => {
      try {
        if (taskService && useFirebase) {
          // Intentar usar Firebase
          console.log('Intentando conectar con Firebase...');
          
          unsubscribeTasks = taskService.subscribeToTasksSimple((tasksData) => {
            console.log('Tareas recibidas de Firebase:', tasksData);
            setTasks(tasksData);
            setLoading(false);
            setError(null);
          });

          unsubscribeUsers = taskService.subscribeToUsersSimple((usersData) => {
            console.log('Usuarios recibidos de Firebase:', usersData);
            setUsers(usersData);
          });
          
        } else {
          // Usar datos mock
          console.log('Usando datos de respaldo...');
          setTimeout(() => {
            setTasks(mockData.tasks);
            setUsers(mockData.users);
            setLoading(false);
            setError('Usando datos temporales - Firebase no configurado');
          }, 500);
        }
      } catch (err) {
        console.error('Error inicializando datos:', err);
        // Si Firebase falla, usar datos mock
        setTasks(mockData.tasks);
        setUsers(mockData.users);
        setLoading(false);
        setError('Error conectando con Firebase - usando datos temporales');
        setUseFirebase(false);
      }
    };

    initializeData();

    // Cleanup
    return () => {
      if (unsubscribeTasks) unsubscribeTasks();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [useFirebase]);

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;

   const taskData = {
    title: newTask.title,
    description: newTask.description,
    priority: newTask.priority,
    assignedTo: newTask.assignedTo,
    dueDate: newTask.dueDate,
    status: 'pending',
    createdBy: currentUser.name,
    teamId: 'team1'
  };

    try {
      if (taskService && useFirebase) {
        await taskService.createTask(taskData);
      } else {
        // Agregar a datos locales
        setTasks(prev => [...prev, taskData]);
      }

      setNewTask({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        assignedTo: '', 
        dueDate: '' 
      });
      setShowNewTaskForm(false);
    } catch (error) {
      console.error('Error creando tarea:', error);
      alert('Error creando la tarea. Inténtalo de nuevo.');
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      if (taskService && useFirebase) {
        await taskService.updateTask(taskId, updates);
      } else {
        // Actualizar datos locales
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        ));
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      
      // Si el error es que no existe el documento, actualizar localmente
      if (error.code === 'not-found' || error.message.includes('No document to update')) {
        console.log('Documento no existe en Firebase, actualizando localmente');
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        ));
      } else {
        alert('Error actualizando la tarea. Inténtalo de nuevo.');
      }
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      try {
        if (taskService && useFirebase) {
          await taskService.deleteTask(taskId);
        } else {
          // Eliminar de datos locales
          setTasks(prev => prev.filter(task => task.id !== taskId));
        }
      } catch (error) {
        console.error('Error eliminando tarea:', error);
        alert('Error eliminando la tarea. Inténtalo de nuevo.');
      }
    }
  };

  const handleSeedData = async () => {
    if (window.confirm('¿Quieres crear datos de ejemplo?')) {
      try {
        if (taskService && useFirebase) {
          await taskService.seedInitialData();
          alert('Datos de ejemplo creados exitosamente');
        } else {
          // Ya tenemos datos mock
          alert('Datos de ejemplo ya disponibles (modo local)');
        }
      } catch (error) {
        console.error('Error creando datos de ejemplo:', error);
        alert('Error creando datos de ejemplo');
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    switch (filter) {
      case 'pending': return task.status === 'pending';
      case 'in-progress': return task.status === 'in-progress';
      case 'completed': return task.status === 'completed';
      case 'my-tasks': return task.assignedTo === currentUser.name;
      default: return true;
    }
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando con Firebase...</p>
          <p className="text-sm text-gray-500 mt-2">Si tarda mucho, verificar configuración</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {/* Opción 1: Usando una imagen desde public/ */}
              <div className="flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="TaskFlow Logo" 
                  className="w-10 h-10 rounded-lg object-contain"
                  onError={(e) => {
                    // Si la imagen no existe, mostrar el ícono por defecto
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
                <p className="text-sm text-gray-600">
                  {useFirebase && !error ? 'Conectado a Firebase' : '💾 Modo local'} • {tasks.length} tareas
                  {useFirebase && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Firebase activo
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-full">
                <span className="text-2xl">{currentUser.avatar}</span>
                <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
              {error.includes('Firebase no configurado') && (
                <p className="text-xs text-yellow-600 mt-1">
                  Para usar Firebase: configura src/firebase.js con tus credenciales reales
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros y acciones */}
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas', count: tasks.length },
              { key: 'pending', label: 'Pendientes', count: tasks.filter(t => t.status === 'pending').length },
              { key: 'in-progress', label: 'En progreso', count: tasks.filter(t => t.status === 'in-progress').length },
              { key: 'completed', label: 'Completadas', count: tasks.filter(t => t.status === 'completed').length },
              { key: 'my-tasks', label: 'Mis tareas', count: tasks.filter(t => t.assignedTo === currentUser.name).length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === key
                    ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            {tasks.length === 0 && useFirebase && !error && (
              <button
                onClick={handleSeedData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Database className="w-4 h-4" />
                <span className="text-sm">Datos ejemplo</span>
              </button>
            )}
            
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Nueva Tarea</span>
            </button>
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleUpdateTask(task.id, { 
                        status: task.status === 'completed' ? 'pending' : 'completed' 
                      })}
                      className="hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-gray-900 ${
                        task.status === 'completed' ? 'line-through opacity-60' : ''
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border mt-2 ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => verifyFirebaseState(task.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Verificar en Firebase"
                    >
                      🔍
                    </button>
                  </div>
                </div>

                {task.description && (
                  <p className="text-gray-600 text-sm mb-4">{task.description}</p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <User className="w-4 h-4" />
                      <span>{task.assignedTo || 'No asignado'}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString('es-ES')}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Por {task.createdBy}</span>
                      <span>{task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('es-ES') : ''}</span>
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <div className="pt-2">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in-progress">En progreso</option>
                        <option value="completed">Completada</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Formulario nueva tarea */}
        {showNewTaskForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Tarea</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Título de la tarea"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-20"
                    placeholder="Descripción opcional"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map(user => (
                      <option key={user.id} value={user.name}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Crear Tarea
                </button>
                <button
                  onClick={() => {
                    setShowNewTaskForm(false);
                    setNewTask({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tareas</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' ? 'Comienza creando tu primera tarea o carga datos de ejemplo' : `No hay tareas ${filter === 'my-tasks' ? 'asignadas a ti' : filter}`}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => setShowNewTaskForm(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mr-3"
              >
                <Plus className="w-5 h-5" />
                <span>Crear primera tarea</span>
              </button>
              <button
                onClick={handleSeedData}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Database className="w-5 h-5" />
                <span>Cargar datos de ejemplo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}