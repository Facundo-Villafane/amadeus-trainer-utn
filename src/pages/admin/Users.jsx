// src/pages/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { FiList, FiFileText, FiEdit2, FiUserCheck, FiUserX, FiSearch, FiFilter } from 'react-icons/fi';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import AuthProvider from '../../contexts/AuthProvider';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [commissions, setCommissions] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState('all');
  const { userRole, currentUser, logout } = useAuth();

  // Leer usuarios y comisiones de Firestore al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener comisiones
        const commissionsCol = collection(db, 'commissions');
        const commissionsSnapshot = await getDocs(commissionsCol);
        const commissionsList = commissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCommissions(commissionsList);

        // Obtener usuarios
        const usersCol = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCol);
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error al obtener datos:', error);
        toast.error('Error al cargar los datos');
      }
    };
    fetchData();
  }, []);

  // Acciones conectadas a Firestore
  const handleToggleActive = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', id), { active: !user.active });
      setUsers(users => users.map(u => u.id === id ? { ...u, active: !u.active } : u));
      toast.success(`Usuario ${!user.active ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      toast.error('Error al actualizar el estado del usuario');
    }
  };

  const handleEditCommission = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;

    const commissionCode = prompt('Ingrese el código de la nueva comisión:');
    if (!commissionCode) return;

    // Buscar la comisión por código
    const commission = commissions.find(c => c.code === commissionCode.toUpperCase());
    if (!commission) {
      toast.error('Código de comisión no válido');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', id), { 
        commissionId: commission.id,
        commissionName: commission.name,
        commissionCode: commission.code
      });
      
      setUsers(users => users.map(u => u.id === id ? { 
        ...u, 
        commissionId: commission.id,
        commissionName: commission.name,
        commissionCode: commission.code
      } : u));
      
      toast.success('Comisión actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar comisión:', error);
      toast.error('Error al actualizar la comisión');
    }
  };

  const handleViewHistory = (id) => {
    // TODO: Implementar navegación a historial de comandos del usuario
    alert(`Ver historial de comandos del usuario ${id}`);
  };

  const handleViewPNRs = (id) => {
    // TODO: Implementar navegación a PNRs del usuario
    alert(`Ver PNRs del usuario ${id}`);
  };

  const handleLogout = async () => {
    if (logout) await logout();
  };

  // Filtrado de usuarios por búsqueda y comisión
  const filteredUsers = users.filter(user => {
    const q = search.toLowerCase();
    const matchesSearch = (
      user.displayName?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.commissionName?.toLowerCase().includes(q) ||
      user.commissionCode?.toLowerCase().includes(q) ||
      user.role?.toLowerCase().includes(q)
    );

    const matchesCommission = selectedCommission === 'all' || user.commissionId === selectedCommission;

    return matchesSearch && matchesCommission;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      <DashboardSidebar userRole={userRole} />
      <div className="flex flex-col flex-1">
        <DashboardHeader user={currentUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Administración de Usuarios</h2>
          
          <div className="mb-4 flex gap-4">
            <div className="flex items-center flex-1 max-w-md">
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
            
            <div className="flex items-center">
              <FiFilter className="h-5 w-5 text-gray-400 mr-2" />
              <select
                value={selectedCommission}
                onChange={(e) => setSelectedCommission(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm"
              >
                <option value="all">Todas las comisiones</option>
                {commissions.map(commission => (
                  <option key={commission.id} value={commission.id}>
                    {commission.name} ({commission.code})
                  </option>
                ))}
              </select>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className={user.active === false ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.displayName || user.firstName + ' ' + user.lastName || 'Sin nombre'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.commissionName ? (
                        <div>
                          <div>{user.commissionName}</div>
                          <code className="text-xs bg-gray-100 px-1 rounded">{user.commissionCode}</code>
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin comisión</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role || 'student'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
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
                          title="Cambiar comisión"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`p-2 rounded ${
                            user.active !== false ? 'hover:bg-red-100 text-red-600' : 'hover:bg-green-100 text-green-600'
                          }`}
                          title={user.active !== false ? 'Desactivar usuario' : 'Activar usuario'}
                        >
                          {user.active !== false ? <FiUserX className="h-5 w-5" /> : <FiUserCheck className="h-5 w-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No se encontraron usuarios que coincidan con los criterios de búsqueda.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Users;