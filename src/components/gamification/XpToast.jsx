// src/components/gamification/XpToast.jsx
// Animated reward notifications: XP gain/loss, level-up, achievement unlock, cooldown warning.
// Drop this component at the app root level (e.g. App.jsx) once.
// Usage: <XpToast events={xpEvents} onDismiss={clearEvents} />
// xpEvents is an array of event objects pushed by experienceService callers.

import { useEffect, useState, useRef } from 'react';
import {
    FiTrendingUp,
    FiTrendingDown,
    FiAward,
    FiAlertTriangle,
    FiClock,
    FiChevronUp,
    FiStar,
} from 'react-icons/fi';

// ── Icon resolver ─────────────────────────────────────────────────────────────
// Maps the string keys used in experienceService to react-icons components
import * as FiIcons from 'react-icons/fi';
export function resolveIcon(key, size = 20) {
    const Component = FiIcons[key] || FiIcons.FiStar;
    return <Component size={size} />;
}

// ── Individual toast ──────────────────────────────────────────────────────────
function Toast({ event, onDismiss }) {
    const [visible, setVisible] = useState(true);
    const timerRef = useRef(null);

    const DURATION = event.type === 'level_up' ? 5000 : 3000;

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
        }, DURATION);
        return () => clearTimeout(timerRef.current);
    }, []);

    const styles = {
        xp_gain: { bg: 'bg-green-900/90', border: 'border-green-500', text: 'text-green-300' },
        xp_loss: { bg: 'bg-red-900/90', border: 'border-red-500', text: 'text-red-300' },
        level_up: { bg: 'bg-amber-900/90', border: 'border-amber-400', text: 'text-amber-300' },
        achievement: { bg: 'bg-purple-900/90', border: 'border-purple-400', text: 'text-purple-300' },
        cooldown: { bg: 'bg-yellow-900/90', border: 'border-yellow-500', text: 'text-yellow-300' },
        spam: { bg: 'bg-red-900/90', border: 'border-red-500', text: 'text-red-300' },
    };

    const s = styles[event.type] || styles.xp_gain;

    const icons = {
        xp_gain: <FiTrendingUp size={16} />,
        xp_loss: <FiTrendingDown size={16} />,
        level_up: <FiChevronUp size={16} />,
        achievement: <FiAward size={16} />,
        cooldown: <FiClock size={16} />,
        spam: <FiAlertTriangle size={16} />,
    };

    return (
        <div
            className={`
        flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-xl
        font-mono text-sm max-w-sm w-full
        transition-all duration-300
        ${s.bg} ${s.border} ${s.text}
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
            style={{ fontFamily: "'Courier New', monospace" }}
        >
            <span className="mt-0.5 shrink-0">{icons[event.type]}</span>
            <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight">{event.title}</p>
                {event.subtitle && (
                    <p className="text-xs opacity-75 mt-0.5 leading-snug">{event.subtitle}</p>
                )}
            </div>
        </div>
    );
}

// ── Level-up modal ────────────────────────────────────────────────────────────
export function LevelUpModal({ levelData, onClose }) {
    if (!levelData) return null;
    const { newLevel, newTitle } = levelData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Card */}
            <div className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 rounded-2xl border border-amber-400/60 bg-gray-900/95 shadow-2xl shadow-amber-900/40 max-w-sm w-full text-center animate-bounce-once">
                {/* Stars decoration */}
                <div className="flex gap-3 text-amber-400">
                    <FiStar size={20} />
                    <FiStar size={28} />
                    <FiStar size={20} />
                </div>

                <div>
                    <p className="text-amber-400 text-xs uppercase tracking-widest font-bold mb-1">
                        Subiste de nivel
                    </p>
                    <p className="text-6xl font-bold text-white">{newLevel}</p>
                </div>

                <div className="text-center">
                    <p className="text-amber-300 text-xl font-semibold">{newTitle}</p>
                    <p className="text-gray-400 text-sm mt-1">Nuevo titulo desbloqueado</p>
                </div>

                <button
                    onClick={onClose}
                    className="mt-2 px-6 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
}

// ── Achievement unlock card ───────────────────────────────────────────────────
export function AchievementToast({ achievement, onDismiss }) {
    const [visible, setVisible] = useState(true);

    const rarityBorder = {
        COMMON: 'border-gray-400',
        UNCOMMON: 'border-green-400',
        RARE: 'border-blue-400',
        EPIC: 'border-purple-400',
        LEGENDARY: 'border-amber-400',
    };

    const rarityGlow = {
        COMMON: '',
        UNCOMMON: 'shadow-green-900/40',
        RARE: 'shadow-blue-900/40',
        EPIC: 'shadow-purple-900/40',
        LEGENDARY: 'shadow-amber-900/40',
    };

    const border = rarityBorder[achievement.rarity] || rarityBorder.COMMON;
    const glow = rarityGlow[achievement.rarity] || '';

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
        }, 5000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border-2 shadow-xl ${glow}
        bg-gray-900/95 ${border} max-w-sm w-full
        transition-all duration-300
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
      `}
        >
            <div className="shrink-0 text-amber-400">
                {resolveIcon(achievement.icon, 24)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Logro desbloqueado</p>
                <p className="text-white font-bold text-sm leading-tight">{achievement.name}</p>
                <p className="text-gray-300 text-xs mt-0.5 leading-snug">{achievement.description}</p>
                {achievement.xp > 0 && (
                    <p className="text-green-400 text-xs font-bold mt-1">+{achievement.xp} XP</p>
                )}
            </div>
        </div>
    );
}

// ── Toast container (renders all active toasts) ───────────────────────────────
export default function XpToastContainer({ events, achievements, onDismissEvent, onDismissAchievement }) {
    return (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse gap-2 items-end pointer-events-none">
            {events.map(ev => (
                <div key={ev.id} className="pointer-events-auto">
                    <Toast event={ev} onDismiss={() => onDismissEvent(ev.id)} />
                </div>
            ))}
            {achievements.map(ach => (
                <div key={ach.id} className="pointer-events-auto">
                    <AchievementToast achievement={ach} onDismiss={() => onDismissAchievement(ach.id)} />
                </div>
            ))}
        </div>
    );
}
