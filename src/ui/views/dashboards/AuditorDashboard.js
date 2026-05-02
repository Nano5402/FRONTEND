export class AuditorDashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.logs = [
            { time: '10:45 AM', event: 'Superadmin eliminó de raíz al usuario ID 105. Motivo: Retiro del programa.' },
            { time: '09:30 AM', event: 'Instructor Jhon asignó tarea "Bases de Datos" a Grupo 1.' },
            { time: '08:15 AM', event: 'Ana Isabella García Rozo cambió tarea #2 a En Progreso.' }
        ];
    }

    render() {
        this.container.innerHTML = `
            <div style="animation: slideUpFade 0.4s var(--ease-smooth);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <h2 style="color: var(--text-main);">Auditoría y Trazabilidad</h2>
                    <button class="btn btn--outline" style="border-color: var(--brand-primary); color: var(--brand-primary);">
                        <i class="ph ph-file-pdf"></i> Exportar Reporte Global
                    </button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 20px;">
                    <div class="card" style="background: var(--bg-card);">
                        <h3 style="color: var(--text-main); margin-bottom: 15px; font-size: 1.1rem;"><i class="ph ph-clock-counter-clockwise"></i> Actividad Reciente del Sistema</h3>
                        <div style="border-left: 2px solid var(--border-subtle); padding-left: 15px; margin-left: 10px;">
                            ${this.logs.map(log => `
                                <div style="margin-bottom: 15px; position: relative;">
                                    <div style="position: absolute; left: -21px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background: var(--brand-primary);"></div>
                                    <span style="font-size: 0.8rem; color: var(--brand-primary); font-weight: 600;">${log.time}</span>
                                    <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 3px;">${log.event}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}