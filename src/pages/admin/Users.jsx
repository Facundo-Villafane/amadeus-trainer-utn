import React, { useState, useEffect } from 'react';
import { FiList, FiFileText, FiEdit2, FiUserCheck, FiUserX, FiSearch } from 'react-icons/fi';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const { userRole, currentUser, logout } = useAuth();

  // Leer usuarios de Firestore al montar
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCol);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      }
    };
    fetchUsers();
  }, []);

  // Acciones conectadas a Firestore
  const handleToggleActive = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', id), { active: !user.active });
      setUsers(users => users.map(u => u.id === id ? { ...u, active: !u.active } : u));
    } catch (error) {
      console.error('Error al actualizar estado:', error);
    }
  };

  const handleEditCommission = async (id) => {
    const newCommission = prompt('Nueva comisión para el usuario:');
    if (newCommission) {
      try {
        await updateDoc(doc(db, 'users', id), { commission: newCommission });
        setUsers(users => users.map(u => u.id === id ? { ...u, commission: newCommission } : u));
      } catch (error) {
        console.error('Error al actualizar comisión:', error);
      }
    }
  };

  const handleViewHistory = (id) => {
    alert(`Ver historial de comandos del usuario ${id}`);
  };

  const handleViewPNRs = (id) => {
    alert(`Ver PNRs del usuario ${id}`);
  };

  const handleLogout = async () => {
    if (logout) await logout();
  };

  // Filtrado de usuarios por búsqueda
  const filteredUsers = users.filter(user => {
    const q = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.commission?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />
      <div className="flex flex-col flex-1">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Administración de Usuarios</h2>
          <div className="mb-4 flex items-center max-w-md">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                className="pl-10 py-2 block w-full border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                placeholder="Buscar por nombre, email, comisión o rol..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className={user.active ? '' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.commission}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.role || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleViewHistory(user.id)}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          title="Ver historial de comandos"
                        >
                          <FiList className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleViewPNRs(user.id)}
                          className="p-2 rounded hover:bg-gray-100 text-gray-600"
                          title="Ver PNRs"
                        >
                          <FiFileText className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditCommission(user.id)}
                          className="p-2 rounded hover:bg-blue-100 text-blue-600"
                          title="Editar comisión"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`p-2 rounded ${user.active ? 'hover:bg-red-100 text-red-600' : 'hover:bg-green-100 text-green-600'}`}
                          title={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.active ? <FiUserX className="h-5 w-5" /> : <FiUserCheck className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Users;
