import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, setDoc, getDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { useAuth } from '../hooks/useAuth';
import { FiAward, FiClock, FiCheckCircle, FiXCircle, FiPlay, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { evaluateChallengeSubmission } from '../services/challengeEvaluationService';
import xpEventBus from '../services/xpEventBus';

export default function StudentChallenges() {
    const { currentUser, userRole, logout } = useAuth();

    const [activeTab, setActiveTab] = useState('General');
    const [challenges, setChallenges] = useState([]);
    const [userSubmissions, setUserSubmissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [userCommissions, setUserCommissions] = useState([]);

    // Modal states
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [rlInput, setRlInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!currentUser) return;

            try {
                setLoading(true);
                // Obtener la comisión del usuario para filtrar
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                const commission = userDoc.exists() ? userDoc.data().commission : null;
                setUserCommissions([commission, 'ALL'].filter(Boolean));

                // 1. Cargar todas las entregas/submissions históricas de este usuario
                const subsQuery = query(collection(db, 'challenge_submissions'), where('userId', '==', currentUser.uid));
                const subsSnapshot = await getDocs(subsQuery);

                const subsMap = {};
                subsSnapshot.forEach(doc => {
                    const data = doc.data();
                    subsMap[data.challengeId] = { id: doc.id, ...data };
                });
                setUserSubmissions(subsMap);

                // 2. Cargar desafíos activos
                const chalQuery = query(collection(db, 'challenges'), where('isActive', '==', true));
                const chalSnapshot = await getDocs(chalQuery);

                const allChallenges = [];
                chalSnapshot.forEach(doc => {
                    const data = doc.data();
                    allChallenges.push({ id: doc.id, ...data });
                });

                setChallenges(allChallenges);
            } catch (error) {
                console.error('Error cargando desafíos:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [currentUser]);

    // Filtrar desafíos según la pestaña actual y la comisión del alumno
    const getFilteredChallenges = () => {
        return challenges.filter(c => {
            // 1. Verificar si aplica a su comisión
            const isForUser = Array.isArray(c.commissionCodes)
                ? c.commissionCodes.some(code => userCommissions.includes(code))
                : userCommissions.includes(c.commissionCodes);

            if (!isForUser) return false;

            // 2. Determinar estado
            const sub = userSubmissions[c.id];
            const isFinished = sub?.status === 'evaluated';

            // 3. Filtrar por pestaña
            if (activeTab === 'Finalizados') return isFinished;

            // Si el desafío no está terminado, verificar categoría
            if (isFinished) return false;
            return c.category === activeTab;
        });
    };

    const handleAcceptChallenge = async (challenge) => {
        try {
            const subRef = doc(collection(db, 'challenge_submissions'));
            const newSubData = {
                challengeId: challenge.id,
                userId: currentUser.uid,
                status: 'in_progress',
                startedAt: serverTimestamp(),
            };

            await setDoc(subRef, newSubData);

            // Update local state
            setUserSubmissions(prev => ({
                ...prev,
                [challenge.id]: { id: subRef.id, ...newSubData, startedAt: { toMillis: () => Date.now() } } // mock JS timestamp for immediate render
            }));

            toast.success('¡Desafío aceptado! Ve a la terminal para generar tu reserva. El tiempo corre.');
        } catch (error) {
            console.error('Error aceptando desafío:', error);
            toast.error('Error al iniciar el desafío');
        }
    };

    const handleSubmitRL = async (e) => {
        e.preventDefault();
        if (!rlInput || rlInput.length < 5) {
            toast.error('Localizador inválido');
            return;
        }

        try {
            setIsSubmitting(true);
            const sub = userSubmissions[selectedChallenge.id];

            // 1. Buscar PNR real
            const pnrQuery = query(collection(db, 'pnrs'), where('recordLocator', '==', rlInput.toUpperCase()));
            const pnrSnapshot = await getDocs(pnrQuery);

            if (pnrSnapshot.empty) {
                toast.error('No se encontró ninguna reserva con ese Localizador.');
                setIsSubmitting(false);
                return;
            }

            const pnrDoc = pnrSnapshot.docs[0];
            const pnrData = pnrDoc.data();

            // Validación ANTI-TRAMPA: El PNR no puede ser más viejo que cuando se aceptó el desafío
            const pnrCreatedAt = pnrData.createdAt?.toMillis() || 0;
            const challengeStartedAt = sub.startedAt?.toMillis() || Date.now();

            if (pnrCreatedAt < challengeStartedAt) {
                toast.error('⚠️ Este PNR es antiguo. Debes generar uno NUEVO luego de haber aceptado este desafío.');
                setIsSubmitting(false);
                return;
            }

            // Validar tiempo límite
            const minutesElapsed = (Date.now() - challengeStartedAt) / 60000;
            if (minutesElapsed > selectedChallenge.timeLimitMinutes) {
                toast.error(`⏳ Has excedido el tiempo límite de ${selectedChallenge.timeLimitMinutes} minutos para este desafío.`);
                setIsSubmitting(false);
                return;
            }

            toast.loading('La IA de Groq está evaluando tu reserva...', { id: 'eval' });

            // 2. Mandar a la IA a evaluar
            const aiResponse = await evaluateChallengeSubmission(selectedChallenge, pnrData);

            // 3. Guardar en Base de Datos
            const xpEarned = aiResponse.isPass ? (selectedChallenge.xpReward || 50) : 0;

            await setDoc(doc(db, 'challenge_submissions', sub.id), {
                ...sub,
                status: 'evaluated',
                recordLocator: rlInput.toUpperCase(),
                pnrDataSnapshot: pnrData,
                isPass: aiResponse.isPass,
                feedback: aiResponse.feedback,
                xpEarned: xpEarned,
                submittedAt: serverTimestamp()
            });

            // Update local state
            setUserSubmissions(prev => ({
                ...prev,
                [selectedChallenge.id]: {
                    ...prev[selectedChallenge.id],
                    status: 'evaluated',
                    feedback: aiResponse.feedback,
                    isPass: aiResponse.isPass,
                    xpEarned: xpEarned
                }
            }));

            toast.success(aiResponse.isPass ? '¡Desafío Aprobado!' : 'Desafío Fallido', { id: 'eval' });

            // Si aprobó, emitir evento de XP
            if (aiResponse.isPass) {
                xpEventBus.emit({
                    type: 'challenge',
                    title: `+${xpEarned} XP`,
                    subtitle: `Desafío superado: ${selectedChallenge.title}`,
                });
            }

        } catch (error) {
            console.error('Error enviando desafío:', error);
            toast.error('Error durante la evaluación', { id: 'eval' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderTimer = (startedAtMillis, limitMins) => {
        // Cálculo pasivo simplificado
        const elapsedMins = (Date.now() - startedAtMillis) / 60000;
        const remaining = Math.max(0, limitMins - elapsedMins);

        if (remaining === 0) return <span className="text-red-600 font-bold">Tiempo agotado</span>;
        return <span className="text-blue-600 font-bold">{Math.floor(remaining)} min restantes</span>;
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <DashboardSidebar userRole={userRole} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader user={currentUser} onLogout={() => logout()} />

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
                            <FiAward className="mr-2 text-amadeus-primary" /> Hub de Desafíos
                        </h1>

                        {/* Tabs */}
                        <div className="border-b border-gray-200 mb-6">
                            <nav className="-mb-px flex space-x-8">
                                {['General', 'Especial', 'Temporal', 'Finalizados'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`${activeTab === tab
                                                ? 'border-amadeus-primary text-amadeus-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amadeus-primary"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {getFilteredChallenges().map((challenge) => {
                                    const sub = userSubmissions[challenge.id];
                                    const isFinished = sub?.status === 'evaluated';
                                    const isInProgress = sub?.status === 'in_progress';

                                    return (
                                        <div key={challenge.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 flex flex-col">
                                            <div className="px-4 py-5 sm:p-6 flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{challenge.title}</h3>
                                                    <span className={`px-2 py-1 flex items-center text-xs font-bold rounded-full ${isFinished ? (sub.isPass ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800') :
                                                            isInProgress ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {isFinished ? (sub.isPass ? 'Completado' : 'Fallido') : isInProgress ? 'En Curso' : 'Pendiente'}
                                                    </span>
                                                </div>

                                                <p className="mt-2 text-sm text-gray-600 line-clamp-3 mb-4">
                                                    {challenge.description}
                                                </p>

                                                <div className="flex items-center space-x-4 text-xs font-medium text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                                                    <span className="flex items-center text-amadeus-primary">
                                                        <FiAward className="mr-1" size={14} /> +{challenge.xpReward} XP
                                                    </span>
                                                    <span className="flex items-center">
                                                        <FiClock className="mr-1" size={14} />
                                                        {isInProgress && sub.startedAt ?
                                                            renderTimer(sub.startedAt.toMillis(), challenge.timeLimitMinutes) :
                                                            `${challenge.timeLimitMinutes} min`
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 px-4 py-4 sm:px-6">
                                                <button
                                                    onClick={() => setSelectedChallenge(challenge)}
                                                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-amadeus-primary hover:bg-amadeus-secondary transition-colors"
                                                >
                                                    {isFinished ? 'Ver Resultado' : isInProgress ? 'Entregar RL' : 'Ver Caso para Aceptar'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {getFilteredChallenges().length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                        No hay desafíos en esta pestaña para tu comisión actual.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modal Interacción de Desafío */}
            {selectedChallenge && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setSelectedChallenge(null)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">

                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-xl leading-6 font-bold text-gray-900 border-b pb-3 mb-4">
                                            {selectedChallenge.title}
                                        </h3>

                                        <div className="bg-gray-50 rounded-md p-4 mb-6 border border-gray-200">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Descripción del Caso:</h4>
                                            <p className="text-base text-gray-800 whitespace-pre-wrap">{selectedChallenge.description}</p>
                                        </div>

                                        <div className="flex space-x-6 text-sm mb-6 pb-6 border-b border-gray-200">
                                            <div className="flex items-center text-gray-600">
                                                <FiClock className="mr-2 text-amadeus-primary" size={18} /> Tiempo Límite: <strong className="ml-1">{selectedChallenge.timeLimitMinutes} min</strong>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <FiAward className="mr-2 text-amadeus-primary" size={18} /> Recompensa: <strong className="ml-1 text-yellow-600">+{selectedChallenge.xpReward} XP</strong>
                                            </div>
                                        </div>

                                        {/* Flujo Dinámico basado en el estado (Pending / In Progress / Evaluated) */}
                                        {(() => {
                                            const sub = userSubmissions[selectedChallenge.id];

                                            // ESTADO 1: No iniciado
                                            if (!sub) {
                                                return (
                                                    <div className="text-center py-4">
                                                        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md mb-4 text-left border border-blue-200">
                                                            <strong>Instrucciones:</strong> Al hacer click en "Aceptar Desafío", el contador de tiempo comenzará. Debes ir a la pestaña "Terminal", crear una reserva desde cero respetando todas las reglas del caso, grabar con ER o ET, y volver aquí para ingresar tu localizador de reserva (RL).
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                handleAcceptChallenge(selectedChallenge);
                                                                setSelectedChallenge(null); // cierro modal para q vayan a la terminal
                                                            }}
                                                            className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                                                        >
                                                            <FiPlay className="mr-2" /> Aceptar Desafío y Comenzar
                                                        </button>
                                                    </div>
                                                );
                                            }

                                            // ESTADO 2: En curso (Aceptado y corriendo)
                                            if (sub.status === 'in_progress') {
                                                return (
                                                    <div className="py-2">
                                                        <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-t-md border-t border-l border-r border-yellow-200 mb-0">
                                                            <span className="text-sm font-bold text-yellow-800">Desafío en curso...</span>
                                                            <span className="text-sm font-mono text-yellow-800">Tiempo: {renderTimer(sub.startedAt.toMillis(), selectedChallenge.timeLimitMinutes)}</span>
                                                        </div>
                                                        <form onSubmit={handleSubmitRL} className="bg-white p-4 border border-gray-200 rounded-b-md shadow-inner">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ingresa el Localizador de Reserva (RL) generado:</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    maxLength={6}
                                                                    value={rlInput}
                                                                    onChange={(e) => setRlInput(e.target.value.toUpperCase())}
                                                                    className="uppercase font-mono flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amadeus-primary focus:ring focus:ring-amadeus-primary focus:ring-opacity-50 text-lg py-2 px-3 border"
                                                                    placeholder="Ej: X8TQW2"
                                                                    required
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={isSubmitting}
                                                                    className="inline-flex justify-center items-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50 transition-colors"
                                                                >
                                                                    {isSubmitting ? 'Evaluando...' : 'Entregar y Evaluar con IA'}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-2">La reserva será sometida a evaluación por la Inteligencia Artificial analizando los segmentos cargados.</p>
                                                        </form>
                                                    </div>
                                                );
                                            }

                                            // ESTADO 3: Evaluado (Corrección de la IA tipo Chat)
                                            if (sub.status === 'evaluated') {
                                                return (
                                                    <div className="mt-4">
                                                        <div className={`p-4 rounded-t-lg border-t border-l border-r ${sub.isPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} flex items-center`}>
                                                            {sub.isPass ? <FiCheckCircle className="text-green-600 mr-2" size={24} /> : <FiXCircle className="text-red-600 mr-2" size={24} />}
                                                            <h4 className={`text-lg font-bold ${sub.isPass ? 'text-green-800' : 'text-red-800'}`}>
                                                                {sub.isPass ? 'Desafío Completado con Éxito' : 'Desafío Fallido'}
                                                            </h4>
                                                            {sub.isPass && <span className="ml-auto font-bold text-yellow-600 bg-white px-2 py-1 rounded shadow-sm">+{sub.xpEarned} XP</span>}
                                                        </div>

                                                        {/* Chatbox style IA feedback */}
                                                        <div className="bg-white border rounded-b-lg p-5 shadow-inner">
                                                            <div className="flex items-start mb-4">
                                                                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 mr-3 border border-blue-200">
                                                                    <FiCpu className="text-blue-700" size={20} />
                                                                </div>
                                                                <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 w-full whitespace-pre-wrap leading-relaxed border border-gray-200 shadow-sm">
                                                                    <span className="font-bold text-xs text-gray-500 block mb-2 uppercase tracking-wide">Asistente Evaluador Groq</span>
                                                                    {sub.feedback}
                                                                </div>
                                                            </div>

                                                            <div className="text-right text-xs text-gray-400 font-mono mt-2">
                                                                RL Evaluado: <strong>{sub.recordLocator}</strong> - Entregado el {sub.submittedAt ? new Date(sub.submittedAt.toMillis()).toLocaleString() : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedChallenge(null);
                                        setRlInput('');
                                    }}
                                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
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
