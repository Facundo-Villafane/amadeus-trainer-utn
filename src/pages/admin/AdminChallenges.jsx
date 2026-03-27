import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DashboardSidebar from '../../components/dashboard/DashboardSidebar';
import DashboardHeader from '../../components/dashboard/DashboardHeader';
import { useAuth } from '../../hooks/useAuth';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiClock, FiStar, FiChevronDown, FiChevronUp, FiCpu, FiPlay, FiInbox, FiCheckCircle, FiXCircle, FiEye, FiAlertTriangle, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { generateChallengeContent } from '../../services/challengeGeneratorService';

export default function AdminChallenges() {
    const { currentUser, userRole, logout } = useAuth();

    // Main tab: 'challenges' | 'submissions'
    const [mainTab, setMainTab] = useState('challenges');

    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Submissions state
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [usersMap, setUsersMap] = useState({});
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [filterChallenge, setFilterChallenge] = useState('ALL');
    const [isOverriding, setIsOverriding] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [showPnrJson, setShowPnrJson] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // AI Assistant states
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');

    // Rules editor state
    const [newRuleType, setNewRuleType] = useState('segment_route');

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'General',
        commissionCodes: 'ALL',
        xpReward: 100,
        timeLimitMinutes: 30,
        validationRules: [],
        isActive: true
    });

    const RULE_TYPES = [
        { value: 'segment_route',        label: 'Segmento de vuelo (ruta)' },
        { value: 'segment_count',        label: 'Cantidad de segmentos' },
        { value: 'passenger_count',      label: 'Cantidad de pasajeros' },
        { value: 'ssr_exists',           label: 'Servicio especial (SSR)' },
        { value: 'passenger_has_document', label: 'Documento de identidad (FOID)' },
        { value: 'has_contact_phone',    label: 'Teléfono de contacto (AP)' },
        { value: 'has_contact_email',    label: 'Email de contacto (APE)' },
        { value: 'has_ticketing',        label: 'Elemento de ticketing (TK)' },
        { value: 'has_remark',           label: 'Observación (RM)' },
        { value: 'osi_exists',           label: 'Mensaje OSI' },
    ];

    const RULE_DEFAULTS = {
        segment_route:          { type: 'segment_route', origin: '', destination: '', date: '', description: '' },
        segment_count:          { type: 'segment_count', min: 1, max: 10, description: '' },
        passenger_count:        { type: 'passenger_count', min: 1, max: 9, passengerType: '', description: '' },
        ssr_exists:             { type: 'ssr_exists', code: '', description: '' },
        passenger_has_document: { type: 'passenger_has_document', docType: '', description: '' },
        has_contact_phone:      { type: 'has_contact_phone', description: 'Debe tener teléfono de contacto (AP)' },
        has_contact_email:      { type: 'has_contact_email', description: 'Debe tener email de contacto (APE)' },
        has_ticketing:          { type: 'has_ticketing', type_value: '', description: '' },
        has_remark:             { type: 'has_remark', description: 'Debe tener al menos una observación (RM)' },
        osi_exists:             { type: 'osi_exists', contains: '', description: '' },
    };

    const categories = ['General', 'Especial', 'Temporal'];

    // ── Challenges ─────────────────────────────────────────────────────────────

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, 'challenges'));
            const querySnapshot = await getDocs(q);

            const challengesData = [];
            querySnapshot.forEach((doc) => {
                challengesData.push({ id: doc.id, ...doc.data() });
            });

            challengesData.sort((a, b) => {
                if (!a.createdAt || !b.createdAt) return 0;
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });

            setChallenges(challengesData);
        } catch (error) {
            console.error('Error fetching challenges:', error);
            toast.error('Error al cargar la lista de desafíos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChallenges();
    }, []);

    // ── Submissions ────────────────────────────────────────────────────────────

    const fetchSubmissions = async () => {
        try {
            setSubmissionsLoading(true);

            // Load all submissions
            const subsSnap = await getDocs(query(collection(db, 'challenge_submissions')));
            const subsData = [];
            subsSnap.forEach(d => subsData.push({ id: d.id, ...d.data() }));

            // Load all users (for names)
            const usersSnap = await getDocs(query(collection(db, 'users')));
            const uMap = {};
            usersSnap.forEach(d => { uMap[d.id] = d.data(); });
            setUsersMap(uMap);

            // Sort by submittedAt desc (most recent first)
            subsData.sort((a, b) => {
                const aTime = a.submittedAt?.toMillis() || a.startedAt?.toMillis() || 0;
                const bTime = b.submittedAt?.toMillis() || b.startedAt?.toMillis() || 0;
                return bTime - aTime;
            });

            setSubmissions(subsData);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.error('Error al cargar las entregas');
        } finally {
            setSubmissionsLoading(false);
        }
    };

    useEffect(() => {
        if (mainTab === 'submissions') {
            fetchSubmissions();
        }
    }, [mainTab]);

    const handleManualOverride = async (newIsPass) => {
        if (!selectedSubmission) return;
        setIsOverriding(true);

        try {
            const wasPass = selectedSubmission.isPass;
            const challenge = challenges.find(c => c.id === selectedSubmission.challengeId);
            const xpReward = challenge?.xpReward || 0;
            const userId = selectedSubmission.userId;

            const updateData = {
                isPass: newIsPass,
                manualOverride: true,
                overriddenBy: currentUser.uid,
                overriddenAt: serverTimestamp(),
            };

            // Append admin note to feedback if provided
            if (adminNote.trim()) {
                updateData.feedback = (selectedSubmission.feedback || '') +
                    `\n\n---\n**Nota del docente:** ${adminNote.trim()}`;
            }

            // XP adjustment
            if (!wasPass && newIsPass && xpReward > 0) {
                // Fail → Pass: grant XP
                updateData.xpEarned = xpReward;
                await updateDoc(doc(db, 'users', userId), { xp: increment(xpReward) });
                toast.success(`+${xpReward} XP otorgados al alumno`);
            } else if (wasPass && !newIsPass && selectedSubmission.xpEarned > 0) {
                // Pass → Fail: revoke XP
                const toRevoke = selectedSubmission.xpEarned;
                updateData.xpEarned = 0;
                await updateDoc(doc(db, 'users', userId), { xp: increment(-toRevoke) });
                toast.success(`${toRevoke} XP revocados al alumno`);
            }

            await updateDoc(doc(db, 'challenge_submissions', selectedSubmission.id), updateData);

            // Update local state
            const updated = { ...selectedSubmission, ...updateData };
            setSubmissions(prev => prev.map(s => s.id === selectedSubmission.id ? updated : s));
            setSelectedSubmission(updated);
            setAdminNote('');

            toast.success(newIsPass ? 'Entrega aprobada manualmente' : 'Entrega rechazada manualmente');
        } catch (error) {
            console.error('Error en override:', error);
            toast.error('Error al aplicar la corrección manual');
        } finally {
            setIsOverriding(false);
        }
    };

    // ── Challenge CRUD ─────────────────────────────────────────────────────────

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked :
                (name === 'timeLimitMinutes' || name === 'xpReward') ? Number(value) : value
        });
    };

    const openAddModal = () => {
        setEditingChallenge(null);
        setFormData({
            title: '',
            description: '',
            category: 'General',
            commissionCodes: 'ALL',
            xpReward: 100,
            timeLimitMinutes: 30,
            validationRules: [],
            isActive: true
        });
        setAiPrompt('');
        setIsModalOpen(true);
    };

    const openEditModal = (challenge) => {
        setEditingChallenge(challenge);
        setFormData({
            title: challenge.title || '',
            description: challenge.description || '',
            category: challenge.category || 'General',
            commissionCodes: Array.isArray(challenge.commissionCodes) ? challenge.commissionCodes.join(', ') : (challenge.commissionCodes || 'ALL'),
            xpReward: challenge.xpReward || 100,
            timeLimitMinutes: challenge.timeLimitMinutes || 30,
            validationRules: Array.isArray(challenge.validationRules) ? challenge.validationRules : [],
            isActive: challenge.isActive !== false
        });
        setAiPrompt('');
        setIsModalOpen(true);
    };

    // ── Rules editor helpers ───────────────────────────────────────────────────

    const addRule = () => {
        setFormData(prev => ({
            ...prev,
            validationRules: [...prev.validationRules, { ...RULE_DEFAULTS[newRuleType] }]
        }));
    };

    const updateRule = (index, field, value) => {
        setFormData(prev => {
            const rules = [...prev.validationRules];
            rules[index] = { ...rules[index], [field]: value };
            return { ...prev, validationRules: rules };
        });
    };

    const removeRule = (index) => {
        setFormData(prev => ({
            ...prev,
            validationRules: prev.validationRules.filter((_, i) => i !== index)
        }));
    };

    const handleGenerateAI = async () => {
        if (!aiPrompt) {
            toast.error('Por favor, ingresa una idea para generar el desafío.');
            return;
        }

        try {
            setIsGeneratingAI(true);
            toast.loading('La IA de Groq está ideando tu desafío...', { id: 'ai-gen' });

            const result = await generateChallengeContent(aiPrompt);

            setFormData(prev => ({
                ...prev,
                title: result.title || prev.title,
                description: result.description || prev.description,
                validationRules: result.validationRules?.length > 0 ? result.validationRules : prev.validationRules
            }));

            toast.success('¡Desafío generado exitosamente!', { id: 'ai-gen' });
            setAiPrompt('');
        } catch (error) {
            console.error('AI Generation Error:', error);
            toast.error(error.message || 'Hubo un error al generar el desafío con IA.', { id: 'ai-gen' });
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            toast.error('Por favor completa el título y la descripción');
            return;
        }
        if (formData.validationRules.length === 0) {
            toast.error('Debes agregar al menos una regla de validación');
            return;
        }

        try {
            const commArray = formData.commissionCodes.split(',').map(c => c.trim()).filter(c => c);

            const challengeData = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                commissionCodes: commArray.length > 0 ? commArray : ['ALL'],
                xpReward: Number(formData.xpReward),
                timeLimitMinutes: Number(formData.timeLimitMinutes),
                validationRules: formData.validationRules,
                isActive: formData.isActive,
                updatedAt: serverTimestamp()
            };

            if (editingChallenge) {
                await updateDoc(doc(db, 'challenges', editingChallenge.id), challengeData);
                toast.success('Desafío actualizado correctamente');
            } else {
                const newChallengeRef = doc(collection(db, 'challenges'));
                await setDoc(newChallengeRef, {
                    ...challengeData,
                    createdBy: currentUser.uid,
                    createdAt: serverTimestamp()
                });
                toast.success('Desafío creado correctamente');
            }

            setIsModalOpen(false);
            fetchChallenges();
        } catch (error) {
            console.error('Error guardando el desafío:', error);
            toast.error('Error al guardar el desafío');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este desafío por completo? Las entregas asociadas podrían quedar huérfanas.')) {
            try {
                setIsDeleting(true);
                await deleteDoc(doc(db, 'challenges', id));
                toast.success('Desafío eliminado correctamente');
                fetchChallenges();
            } catch (error) {
                console.error('Error eliminando desafío:', error);
                toast.error('Error al eliminar el desafío');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    // ── Helpers ────────────────────────────────────────────────────────────────

    const getChallengeTitleById = (id) => {
        const c = challenges.find(c => c.id === id);
        return c ? c.title : id;
    };

    const getUserName = (userId) => {
        const u = usersMap[userId];
        if (!u) return userId;
        return u.displayName || u.name || u.email || userId;
    };

    const formatDate = (ts) => {
        if (!ts) return '—';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const filteredSubmissions = filterChallenge === 'ALL'
        ? submissions
        : submissions.filter(s => s.challengeId === filterChallenge);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="flex h-screen bg-gray-100">
            <DashboardSidebar userRole={userRole} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader user={currentUser} onLogout={() => logout()} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="max-w-7xl mx-auto">

                        {/* Page header */}
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-semibold text-gray-900">Gestor de Desafíos</h1>
                                <p className="text-sm text-gray-500 mt-1">Crea simulaciones de agencia para evaluar a los alumnos con IA.</p>
                            </div>
                            {mainTab === 'challenges' && (
                                <button
                                    onClick={openAddModal}
                                    className="flex items-center bg-amadeus-primary text-white px-4 py-2 rounded-md hover:bg-amadeus-secondary transition shadow-sm"
                                >
                                    <FiPlus className="mr-2" /> Nuevo Desafío
                                </button>
                            )}
                        </div>

                        {/* Main tabs */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setMainTab('challenges')}
                                    className={`${mainTab === 'challenges'
                                        ? 'border-amadeus-primary text-amadeus-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                                >
                                    <FiStar className="mr-2" /> Desafíos
                                </button>
                                <button
                                    onClick={() => setMainTab('submissions')}
                                    className={`${mainTab === 'submissions'
                                        ? 'border-amadeus-primary text-amadeus-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center`}
                                >
                                    <FiInbox className="mr-2" /> Entregas de Alumnos
                                    {submissions.length > 0 && (
                                        <span className="ml-2 bg-amadeus-primary text-white text-xs rounded-full px-2 py-0.5">
                                            {submissions.length}
                                        </span>
                                    )}
                                </button>
                            </nav>
                        </div>

                        {/* ── CHALLENGES TAB ── */}
                        {mainTab === 'challenges' && (
                            loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amadeus-primary"></div>
                                </div>
                            ) : challenges.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
                                    <div className="mx-auto w-16 h-16 bg-blue-50 text-amadeus-primary rounded-full flex items-center justify-center mb-4">
                                        <FiStar size={24} />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No hay desafíos creados</h3>
                                    <p className="text-gray-500 mb-4 text-sm max-w-md mx-auto">Comienza creando un caso práctico para que los alumnos lo resuelvan generando un PNR.</p>
                                    <button onClick={openAddModal} className="text-amadeus-primary font-medium hover:underline text-sm">
                                        Crear el primer desafío
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                                    <ul className="divide-y divide-gray-200">
                                        {challenges.map((challenge) => (
                                            <li key={challenge.id}>
                                                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 flex items-center justify-between">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-sm font-medium text-amadeus-primary truncate font-bold">
                                                                {challenge.title}
                                                            </p>
                                                            <div className="ml-2 flex-shrink-0 flex">
                                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${challenge.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                    {challenge.isActive ? 'Activo' : 'Inactivo'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 text-sm text-gray-700 truncate">
                                                            {challenge.description}
                                                        </div>

                                                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                                            <div className="flex items-center space-x-4">
                                                                <span className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                                    <FiStar className="mr-1" size={12} /> {challenge.category}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <FiUsers className="mr-1.5" />
                                                                    {Array.isArray(challenge.commissionCodes) ? challenge.commissionCodes.join(', ') : challenge.commissionCodes}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    <FiClock className="mr-1.5" />
                                                                    {challenge.timeLimitMinutes} min
                                                                </span>
                                                                <span className="flex items-center text-yellow-600 font-medium">
                                                                    +{challenge.xpReward} XP
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => openEditModal(challenge)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 transition"
                                                            title="Editar"
                                                        >
                                                            <FiEdit2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(challenge.id)}
                                                            disabled={isDeleting}
                                                            className="p-2 text-gray-400 hover:text-red-600 transition"
                                                            title="Eliminar"
                                                        >
                                                            <FiTrash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )
                        )}

                        {/* ── SUBMISSIONS TAB ── */}
                        {mainTab === 'submissions' && (
                            submissionsLoading ? (
                                <div className="flex justify-center py-20">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amadeus-primary"></div>
                                </div>
                            ) : (
                                <>
                                    {/* Filter by challenge */}
                                    <div className="mb-4 flex items-center gap-3">
                                        <label className="text-sm text-gray-600 font-medium">Filtrar por desafío:</label>
                                        <select
                                            value={filterChallenge}
                                            onChange={e => setFilterChallenge(e.target.value)}
                                            className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                                        >
                                            <option value="ALL">Todos</option>
                                            {challenges.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                        <span className="text-xs text-gray-400">{filteredSubmissions.length} entrega{filteredSubmissions.length !== 1 ? 's' : ''}</span>
                                    </div>

                                    {filteredSubmissions.length === 0 ? (
                                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
                                            <FiInbox size={40} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-gray-500 text-sm">No hay entregas todavía.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desafío</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RL</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resultado</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                                        <th className="px-4 py-3"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredSubmissions.map(sub => (
                                                        <tr key={sub.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                                                {getUserName(sub.userId)}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                                {getChallengeTitleById(sub.challengeId)}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                    {sub.recordLocator || '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {sub.status !== 'evaluated' ? (
                                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">En curso</span>
                                                                ) : sub.isPass ? (
                                                                    <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                                        <FiCheckCircle className="mr-1" /> Aprobado
                                                                        {sub.manualOverride && <FiAlertTriangle className="ml-1 text-yellow-500" title="Corrección manual" />}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                                        <FiXCircle className="mr-1" /> Reprobado
                                                                        {sub.manualOverride && <FiAlertTriangle className="ml-1 text-yellow-500" title="Corrección manual" />}
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-gray-500">
                                                                {formatDate(sub.submittedAt || sub.startedAt)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {sub.status === 'evaluated' && (
                                                                    <button
                                                                        onClick={() => { setSelectedSubmission(sub); setAdminNote(''); setShowPnrJson(false); }}
                                                                        className="inline-flex items-center text-xs text-amadeus-primary hover:underline"
                                                                    >
                                                                        <FiEye className="mr-1" /> Ver detalle
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )
                        )}
                    </div>
                </main>
            </div>

            {/* ── MODAL: Create/Edit Challenge ── */}
            {isModalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        {editingChallenge ? 'Editar Desafío' : 'Crear Nuevo Desafío'}
                                    </h3>

                                    {/* AI Assistant Box */}
                                    <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center mb-2">
                                            <FiCpu className="text-purple-600 mr-2" size={20} />
                                            <h4 className="font-bold text-purple-900 text-sm">Asistente IA (Generador de Casos)</h4>
                                        </div>
                                        <p className="text-xs text-purple-700 mb-3">
                                            Escribe una idea simple y Groq completará automáticamente el título, el caso práctico ficticio y las reglas técnicas de evaluación.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={aiPrompt}
                                                onChange={(e) => setAiPrompt(e.target.value)}
                                                disabled={isGeneratingAI}
                                                placeholder="Ej: Emisión vuelo MIA con silla de ruedas y un bebé..."
                                                className="flex-1 border border-purple-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm disabled:opacity-50"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleGenerateAI();
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGenerateAI}
                                                disabled={isGeneratingAI || !aiPrompt.trim()}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none disabled:opacity-50 shadow-sm"
                                            >
                                                {isGeneratingAI ? 'Generando...' : <><FiPlay className="mr-1" /> Auto-completar</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Título del Caso / Desafío</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary text-sm"
                                                placeholder="Ej: Emisión para Pasajero Solitary y Mascota"
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary text-sm"
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Comisiones permitidas</label>
                                                <input
                                                    type="text"
                                                    name="commissionCodes"
                                                    value={formData.commissionCodes}
                                                    onChange={handleInputChange}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary text-sm"
                                                    placeholder="ALL o ej: COM-2024-A, COM-2024-B"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Tiempo Límite (minutos)</label>
                                                <input
                                                    type="number"
                                                    name="timeLimitMinutes"
                                                    value={formData.timeLimitMinutes}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="120"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary text-sm"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Puntos de Experiencia (XP Reward)</label>
                                                <input
                                                    type="number"
                                                    name="xpReward"
                                                    value={formData.xpReward}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    step="10"
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary text-sm"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Descripción del Caso (Instrucciones para el alumno)</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary text-sm"
                                                placeholder="Redacta el caso práctico con todos los detalles que el alumno debe resolver en la terminal..."
                                                required
                                            />
                                        </div>

                                        {/* ── Rules Editor ── */}
                                        <div className="border border-indigo-200 rounded-lg overflow-hidden">
                                            <div className="bg-indigo-50 px-4 py-3 flex items-center justify-between border-b border-indigo-200">
                                                <div className="flex items-center">
                                                    <FiShield className="text-indigo-600 mr-2" size={16} />
                                                    <span className="text-sm font-bold text-indigo-900">Reglas de Validación</span>
                                                    <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                                                        {formData.validationRules.length}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-indigo-600">El motor verifica estas reglas automáticamente</p>
                                            </div>

                                            {/* Rule cards */}
                                            <div className="divide-y divide-gray-100">
                                                {formData.validationRules.length === 0 && (
                                                    <p className="text-xs text-gray-400 text-center py-4">
                                                        Sin reglas. Usá el Asistente IA o agregá una manualmente.
                                                    </p>
                                                )}
                                                {formData.validationRules.map((rule, i) => (
                                                    <div key={i} className="px-4 py-3 bg-white flex gap-3 items-start">
                                                        <div className="flex-1 grid grid-cols-2 gap-2">
                                                            {/* Type badge */}
                                                            <div className="col-span-2 flex items-center gap-2">
                                                                <span className="text-xs bg-indigo-100 text-indigo-800 font-mono px-2 py-0.5 rounded">
                                                                    {rule.type}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={rule.description || ''}
                                                                    onChange={e => updateRule(i, 'description', e.target.value)}
                                                                    placeholder="Descripción legible de la regla..."
                                                                    className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                                />
                                                            </div>

                                                            {/* Fields per type */}
                                                            {rule.type === 'segment_route' && (<>
                                                                <input type="text" maxLength={3} value={rule.origin || ''} onChange={e => updateRule(i, 'origin', e.target.value.toUpperCase())} placeholder="Origen (EZE)" className="text-xs border border-gray-200 rounded px-2 py-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                                                <input type="text" maxLength={3} value={rule.destination || ''} onChange={e => updateRule(i, 'destination', e.target.value.toUpperCase())} placeholder="Destino (CDG)" className="text-xs border border-gray-200 rounded px-2 py-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                                                <input type="text" maxLength={5} value={rule.date || ''} onChange={e => updateRule(i, 'date', e.target.value.toUpperCase())} placeholder="Fecha (03MAY) — opcional" className="col-span-2 text-xs border border-gray-200 rounded px-2 py-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                                            </>)}

                                                            {rule.type === 'segment_count' && (<>
                                                                <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Mín:</span><input type="number" min={1} value={rule.min ?? 1} onChange={e => updateRule(i, 'min', Number(e.target.value))} className="w-16 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" /></div>
                                                                <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Máx:</span><input type="number" min={1} value={rule.max ?? 10} onChange={e => updateRule(i, 'max', Number(e.target.value))} className="w-16 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" /></div>
                                                            </>)}

                                                            {rule.type === 'passenger_count' && (<>
                                                                <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Mín:</span><input type="number" min={1} value={rule.min ?? 1} onChange={e => updateRule(i, 'min', Number(e.target.value))} className="w-16 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" /></div>
                                                                <div className="flex items-center gap-1"><span className="text-xs text-gray-500">Máx:</span><input type="number" min={1} value={rule.max ?? 9} onChange={e => updateRule(i, 'max', Number(e.target.value))} className="w-16 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" /></div>
                                                                <div className="col-span-2 flex items-center gap-1"><span className="text-xs text-gray-500">Tipo:</span>
                                                                    <select value={rule.passengerType || ''} onChange={e => updateRule(i, 'passengerType', e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                                        <option value="">Cualquier tipo</option>
                                                                        <option value="ADT">ADT (Adulto)</option>
                                                                        <option value="CHD">CHD (Niño)</option>
                                                                        <option value="INF">INF (Infante)</option>
                                                                    </select>
                                                                </div>
                                                            </>)}

                                                            {rule.type === 'ssr_exists' && (<>
                                                                <input type="text" maxLength={4} value={rule.code || ''} onChange={e => updateRule(i, 'code', e.target.value.toUpperCase())} placeholder="Código SSR (WCHR)" className="text-xs border border-gray-200 rounded px-2 py-1 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                                                <div className="flex items-center gap-1"><span className="text-xs text-gray-500">PAX#:</span><input type="number" min={1} value={rule.passengerNumber || ''} onChange={e => updateRule(i, 'passengerNumber', e.target.value ? Number(e.target.value) : undefined)} placeholder="Opcional" className="w-20 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" /></div>
                                                            </>)}

                                                            {rule.type === 'passenger_has_document' && (
                                                                <div className="col-span-2 flex items-center gap-1"><span className="text-xs text-gray-500">Tipo doc:</span>
                                                                    <select value={rule.docType || ''} onChange={e => updateRule(i, 'docType', e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                                        <option value="">Cualquier tipo</option>
                                                                        <option value="PP">PP (Pasaporte)</option>
                                                                        <option value="NI">NI (DNI)</option>
                                                                    </select>
                                                                </div>
                                                            )}

                                                            {rule.type === 'has_ticketing' && (
                                                                <div className="col-span-2 flex items-center gap-1"><span className="text-xs text-gray-500">Tipo TK:</span>
                                                                    <select value={rule.type_value || ''} onChange={e => updateRule(i, 'type_value', e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                                                                        <option value="">Cualquier tipo</option>
                                                                        <option value="TL">TL (Límite de tiempo)</option>
                                                                        <option value="OK">OK (Emitir inmediato)</option>
                                                                        <option value="XL">XL (Cancelar)</option>
                                                                    </select>
                                                                </div>
                                                            )}

                                                            {rule.type === 'osi_exists' && (
                                                                <input type="text" value={rule.contains || ''} onChange={e => updateRule(i, 'contains', e.target.value)} placeholder="Texto que debe contener (opcional)" className="col-span-2 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                                            )}
                                                        </div>
                                                        <button type="button" onClick={() => removeRule(i)} className="text-gray-300 hover:text-red-500 transition mt-1 flex-shrink-0">
                                                            <FiTrash2 size={15} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add rule row */}
                                            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center gap-2">
                                                <select
                                                    value={newRuleType}
                                                    onChange={e => setNewRuleType(e.target.value)}
                                                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                                >
                                                    {RULE_TYPES.map(rt => (
                                                        <option key={rt.value} value={rt.value}>{rt.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={addRule}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
                                                >
                                                    <FiPlus className="mr-1" size={12} /> Agregar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center mt-2">
                                            <input
                                                id="isActive"
                                                name="isActive"
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-amadeus-primary focus:ring-amadeus-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                                                Desafío Activo (Visible para los alumnos)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amadeus-primary text-base font-medium text-white hover:bg-amadeus-secondary focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {editingChallenge ? 'Actualizar' : 'Crear'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Submission Detail ── */}
            {selectedSubmission && (
                <div className="fixed z-20 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setSelectedSubmission(null)}>
                            <div className="absolute inset-0 bg-gray-800 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">

                            {/* Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Entrega: {getChallengeTitleById(selectedSubmission.challengeId)}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        Alumno: <span className="font-medium text-gray-700">{getUserName(selectedSubmission.userId)}</span>
                                        {' · '}RL: <span className="font-mono font-medium">{selectedSubmission.recordLocator || '—'}</span>
                                        {' · '}{formatDate(selectedSubmission.submittedAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedSubmission.manualOverride && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
                                            <FiAlertTriangle className="mr-1" size={12} /> Override manual
                                        </span>
                                    )}
                                    {selectedSubmission.isPass ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center">
                                            <FiCheckCircle className="mr-1" /> Aprobado · {selectedSubmission.xpEarned || 0} XP
                                        </span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
                                            <FiXCircle className="mr-1" /> Reprobado
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 space-y-5 max-h-[65vh] overflow-y-auto">

                                {/* AI Feedback */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                        <FiCpu className="mr-2 text-purple-500" /> Devolución de la IA
                                    </h4>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {selectedSubmission.feedback || 'Sin feedback registrado.'}
                                    </div>
                                </div>

                                {/* PNR Snapshot */}
                                <div>
                                    <button
                                        onClick={() => setShowPnrJson(v => !v)}
                                        className="flex items-center text-sm font-semibold text-gray-700 hover:text-amadeus-primary transition"
                                    >
                                        {showPnrJson ? <FiChevronUp className="mr-2" /> : <FiChevronDown className="mr-2" />}
                                        PNR Completo (JSON snapshot)
                                    </button>
                                    {showPnrJson && (
                                        <pre className="mt-2 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto max-h-72 overflow-y-auto leading-relaxed">
                                            {JSON.stringify(selectedSubmission.pnrDataSnapshot, null, 2)}
                                        </pre>
                                    )}
                                </div>

                                {/* Manual Override */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Corrección manual del docente</h4>
                                    <div className="mb-3">
                                        <label className="block text-xs text-gray-500 mb-1">Nota adicional (opcional — se adjunta al feedback)</label>
                                        <textarea
                                            value={adminNote}
                                            onChange={e => setAdminNote(e.target.value)}
                                            rows={2}
                                            placeholder="Ej: El alumno olvidó agregar el SSR WCHR pero los vuelos eran correctos..."
                                            className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-amadeus-primary focus:border-amadeus-primary"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleManualOverride(true)}
                                            disabled={isOverriding || selectedSubmission.isPass}
                                            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            <FiCheckCircle className="mr-2" />
                                            {isOverriding ? 'Aplicando...' : 'Aprobar manualmente'}
                                        </button>
                                        <button
                                            onClick={() => handleManualOverride(false)}
                                            disabled={isOverriding || !selectedSubmission.isPass}
                                            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                                        >
                                            <FiXCircle className="mr-2" />
                                            {isOverriding ? 'Aplicando...' : 'Rechazar manualmente'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Al aprobar se otorgan los XP del desafío. Al rechazar se revocan si ya fueron otorgados.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={() => setSelectedSubmission(null)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
