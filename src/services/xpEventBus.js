// src/services/xpEventBus.js
// Lightweight singleton event bus for XP notifications.
// commandParser / pnrTransaction push events here.
// App.jsx subscribes and forwards them to XpToastContainer.
// No React dependency — works from any module.

let _listeners = [];
let _idCounter = 0;

const xpEventBus = {
    /** Push an XP event to all subscribers */
    emit(event) {
        const ev = { ...event, id: ++_idCounter };
        _listeners.forEach(fn => fn(ev));
    },

    /** Subscribe to XP events. Returns an unsubscribe function. */
    subscribe(fn) {
        _listeners.push(fn);
        return () => {
            _listeners = _listeners.filter(l => l !== fn);
        };
    },

    // ── Helper emitters ──────────────────────────────────────────────────────

    /** +XP for a successful command */
    emitCommandSuccess(xpGained) {
        if (!xpGained || xpGained <= 0) return;
        this.emit({
            type: 'xp_gain',
            title: `+${xpGained} XP`,
            subtitle: 'Comando exitoso',
        });
    },

    /** –XP for an error, with the error message shown */
    emitCommandError(xpLost, errorReason) {
        if (!xpLost || xpLost >= 0) return;
        this.emit({
            type: 'xp_loss',
            title: `${xpLost} XP`,  // already negative
            subtitle: errorReason ? `Error: ${errorReason}` : 'Comando inválido',
        });
    },

    /** XP for completing a PNR */
    emitPNRCompleted(xpGained) {
        if (!xpGained || xpGained <= 0) return;
        this.emit({
            type: 'xp_gain',
            title: `+${xpGained} XP`,
            subtitle: 'PNR completado',
        });
    },

    /** Cooldown when PNR created too fast */
    emitPNRCooldown(secsRemaining) {
        this.emit({
            type: 'cooldown',
            title: 'Esperá un momento',
            subtitle: `Próximo PNR con XP disponible en ${Math.ceil(secsRemaining)} seg`,
        });
    },

    /** Spam penalty */
    emitPNRSpam() {
        this.emit({
            type: 'spam',
            title: '−5 XP',
            subtitle: 'PNR creado demasiado rápido',
        });
    },

    /** Level-up event (handled by LevelUpModal, not Toast) */
    emitLevelUp(oldLevel, newLevel, newTitle) {
        this.emit({
            type: 'level_up',
            title: `¡Nivel ${newLevel}!`,
            subtitle: newTitle,
            data: { oldLevel, newLevel, newTitle },
        });
    },

    /** Achievement unlocked */
    emitAchievement(achievement) {
        this.emit({
            type: 'achievement',
            title: achievement.name,
            subtitle: achievement.description,
            achievement,
        });
    },

    /** Daily streak */
    emitDailyStreak(day, xpGained) {
        this.emit({
            type: 'xp_gain',
            title: `+${xpGained} XP`,
            subtitle: `Racha diaria — día ${day}`,
        });
    },
};

export default xpEventBus;
