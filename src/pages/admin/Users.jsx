// src/pages/admin/Users.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiList, FiFileText, FiEdit2, FiUserCheck, FiUserX, FiSearch, 
  FiFilter, FiAward, FiUserPlus, FiPlus 
} from 'react-icons/fi';
import { useNavigate } from 'react-router';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useAuth } from '../../hooks/useAuth';
import { db } from '../../services/firebase';
import { collection, getDocs, updateDoc, doc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [commissions, setCommissions] = useState([]);
  const [selectedCommission, setSelectedCommission] = useState('all');
  const { userRole, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estados para los modales
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showXpModal, setShowXpModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [xpAmount, setXpAmount] = useState(0);
  const [xpNote, setXpNote] = useState('');
  const [newRole, setNewRole] = useState('');

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

  // Función para abrir el modal de cambio de rol
  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role || 'student');
    setShowRoleModal(true);
  };

  // Función para cambiar el rol del usuario
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await updateDoc(doc(db, 'users', selectedUser.id), { 
        role: newRole,
        updatedAt: serverTimestamp()
      });
      
      // Actualizar el estado local
      setUsers(users => users.map(u => u.id === selectedUser.id ? { 
        ...u, 
        role: newRole
      } : u));
      
      toast.success(`Rol de ${selectedUser.displayName || selectedUser.email} actualizado a ${newRole}`);
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      toast.error('Error al actualizar el rol del usuario');
    }
  };

  // Función para abrir el modal de agregar XP
  const handleOpenXpModal = (user) => {
    setSelectedUser(user);
    setXpAmount(0);
    setXpNote('');
    setShowXpModal(true);
  };

  // Función para agregar XP a un usuario
  const handleAddXp = async () => {
    if (!selectedUser || xpAmount <= 0 || !xpNote.trim()) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    try {
      const userRef = doc(db, 'users', selectedUser.id);
      
      // Calcular el nivel actual y el nuevo nivel (suponiendo que cada nivel requiere 100*nivel XP)
      const currentXp = selectedUser.xp || 0;
      const newXp = currentXp + xpAmount;
      const currentLevel = selectedUser.level || 1;
      
      // Calcular el nuevo nivel basado en la XP total
      let newLevel = 1;
      let xpForNextLevel = 100;
      while (newXp >= xpForNextLevel) {
        newLevel++;
        xpForNextLevel += 100 * newLevel;
      }
      
      const updates = { 
        xp: increment(xpAmount),
        updatedAt: serverTimestamp(),
        // Agregar un registro de la bonificación de XP
        xpHistory: arrayUnion({
          amount: xpAmount,
          reason: xpNote,
          addedAt: new Date().toISOString(),
          addedBy: currentUser.uid,
          type: 'admin_bonus'
        })
      };
      
      // Si el usuario subió de nivel, actualizar también el nivel
      if (newLevel > currentLevel) {
        updates.level = newLevel;
      }
      
      await updateDoc(userRef, updates);
      
      // Actualizar el estado local
      setUsers(users => users.map(u => u.id === selectedUser.id ? { 
        ...u, 
        xp: newXp,
        level: newLevel > currentLevel ? newLevel : u.level
      } : u));
      
      toast.success(`Se añadieron ${xpAmount} XP a ${selectedUser.displayName || selectedUser.email}`);
      
      // Si el usuario subió de nivel, mostrar una notificación adicional
      if (newLevel > currentLevel) {
        toast.success(`¡${selectedUser.displayName || selectedUser.email} ha subido al nivel ${newLevel}!`);
      }
      
      setShowXpModal(false);
    } catch (error) {
      console.error('Error al agregar XP:', error);
      toast.error('Error al agregar XP al usuario');
    }
  };

  const handleViewHistory = (id) => {
    // Navegar a la página de historial de comandos de usuario
    navigate(`/admin/users/${id}/commands`);
  };

  const handleViewPNRs = (userId) => {
    // Navegar a la página de PNRs del usuario
    navigate(`/admin/users/${userId}/pnrs`);
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel/XP</th>
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
                      <span 
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:bg-opacity-80 ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}
                        onClick={() => handleOpenRoleModal(user)}
                        title="Clic para cambiar rol"
                      >
                        {user.role || 'student'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex items-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          Nivel {user.level || 1}
                        </span>
                        <span className="ml-2">{user.xp || 0} XP</span>
                        <button 
                          onClick={() => handleOpenXpModal(user)}
                          className="ml-2 p-1 bg-amber-100 rounded-full hover:bg-amber-200"
                          title="Añadir XP"
                        >
                          <FiPlus className="h-4 w-4 text-amber-600" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
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
                          onClick={() => handleOpenXpModal(user)}
                          className="p-2 rounded hover:bg-amber-100 text-amber-600"
                          title="Añadir XP"
                        >
                          <FiAward className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditCommission(user.id)}
                          className="p-2 rounded hover:bg-blue-100 text-blue-600"
                          title="Cambiar comisión"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenRoleModal(user)}
                          className="p-2 rounded hover:bg-purple-100 text-purple-600"
                          title="Cambiar rol"
                        >
                          <FiUserPlus className="h-5 w-5" />
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

      {/* Modal para cambiar rol */}
      {showRoleModal && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiUserPlus className="h-6 w-6 text-purple-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Cambiar rol de usuario
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Estás modificando el rol de <span className="font-medium">{selectedUser.displayName || selectedUser.email}</span>
                      </p>
                      <div className="mt-4">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                          Rol
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary sm:text-sm rounded-md"
                        >
                          <option value="student">Estudiante</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleChangeRole}
                >
                  Guardar cambios
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar XP */}
      {showXpModal && selectedUser && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAward className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Añadir XP a usuario
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Estás añadiendo XP a <span className="font-medium">{selectedUser.displayName || selectedUser.email}</span>
                      </p>
                      
                      <div className="mb-4">
                        <label htmlFor="xp-amount" className="block text-sm font-medium text-gray-700">
                          Cantidad de XP
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <input
                            type="number"
                            name="xp-amount"
                            id="xp-amount"
                            min="1"
                            step="1"
                            value={xpAmount}
                            onChange={(e) => setXpAmount(parseInt(e.target.value) || 0)}
                            className="focus:ring-amadeus-primary focus:border-amadeus-primary block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                            placeholder="0"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">XP</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="xp-note" className="block text-sm font-medium text-gray-700">
                          Motivo
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="xp-note"
                            name="xp-note"
                            rows={3}
                            value={xpNote}
                            onChange={(e) => setXpNote(e.target.value)}
                            className="shadow-sm focus:ring-amadeus-primary focus:border-amadeus-primary block w-full sm:text-sm border border-gray-300 rounded-md"
                            placeholder="Explique el motivo de la bonificación de XP..."
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Esta nota será visible para el usuario en su historial de XP.
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex items-start">
                          <div className="text-yellow-700">
                            <p className="text-sm">
                              Esta acción otorgará {xpAmount} XP al usuario. 
                              {xpAmount > 0 && (
                                <>
                                  <br />
                                  <span className="font-medium">
                                    XP actual: {selectedUser.xp || 0} (Nivel {selectedUser.level || 1})
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={xpAmount <= 0 || !xpNote.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:hover:bg-amber-600"
                  onClick={handleAddXp}
                >
                  Añadir XP
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amadeus-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowXpModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;