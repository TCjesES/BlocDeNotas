/**
 * -----------------------------------------------------------------------------
 * BLOC DE NOTAS MEJORADO
 * -----------------------------------------------------------------------------
 * Este script gestiona una herramienta de bloc de notas con plantillas y botones
 * de acción rápida para automatizar la entrada de texto.
 */

// --- 1. ELEMENTOS DEL DOM Y VARIABLES GLOBALES ---

const noteArea = document.getElementById('noteArea');
const mouseFollower = document.querySelector('.mouse-follower');
let isPhoneAlertShown = false; // Flag para la alerta de datos sensibles.

// --- 2. PLANTILLAS DE TEXTO ---

const TEXT_TEMPLATES = {
    // ... (esta sección no cambia) ...
    base: `Persona con la que tuvimos contacto:\nMotivo de contacto:\nOs:\nResolución de contacto:\n`,
    unreachableClient: { motivo: "CLIENTE NO RESPONDE", resolucion: "ESAD COMENTA QUE CLIENTE NO RESPONDE POR NINGUN MEDIO / CLIENTE NO RESPONDE SE DESASIGNO LA ORDEN" },
    reagenda: { motivo: "CLIENTE REAGENDA", resolucion: "ESAD COMENTA QUE CLIENTE REAGENDA SU VISITA PARA / CLIENTE COMENTA QUE ES CORRECTO SE DESASIGNO LA ORDEN Y SE AGENDO" },
    clienteNoSeEncuentra: { motivo: "Cliente No Se Encuentra En El Domicilio", resolucion: "ESAD COMENTA QUE CLIENTE NO RESPONDE POR NINGUN MEDIO / CLIENTE NO RESPONDE SE DESASIGNO LA ORDEN" },
    clienteRetrasa: { motivo: "CLIENTE SOLICITA RETRASAR VISITA", resolucion: "ESAD COMENTA QUE CLIENTE DESEA RETRASAR SU VISITA PARA LAS /CLIENTE COMENTA QUE ES CORRECTO, SE DESASIGNO LA ORDEN Y SE LLENO FORMULARIO DEL DIA" },
    clienteNoDesea: { motivo: "CLIENTE NO DESEA EL SERVICIO", resolucion: "ESAD COMENTA QUE CLIENTE NO DESEA EL SERVICIO YA QUE /CLIENTE CONFIRMA LA INFORMACION SE DESASIGNO Y SE CANCELO" },
    ilocalizable: "ESAD COMENTA QUE CLIENTE NO RESPONDE POR NINGUN MEDIO /CLIENTE NO RESPONDE SE DESASIGNO LA ORDEN",
    reagendaCompleta: "ESAD COMENTA QUE CLIENTE REAGENDA SU VISITA PARA /CLIENTE COMENTA QUE ES CORRECTO SE DESASIGNO LA ORDEN Y SE AGENDO",
    clienteNoDeseaCompleta: "ESAD COMENTA QUE CLIENTE NO DESEA EL SERVICIO YA QUE /CLIENTE CONFIRMA LA INFORMACION SE DESASIGNO Y SE CANCELO",
    validarSupervisor: "ESAD SE COMUNICA POR ALERTA QUE NO CORRESPONDE A LA CELULA / SE LE COMENTA VALIDAR CON SUPERVISOR PARA CANALIZAR A AREA CORRECTA, SE HACE TICKET INFORMATIVO",
    clientReceives: "CLIENTE COMENTA QUE SI RECIBE, SE LIBERO PARA SEGUIR CON TRABAJO",
    clientReschedule: "CLIENTE SI RESPONDE PERO COMENTA QUE QUIERE REAGENDAR PARA",
    yaRecibe: "CLIENTE COMENTA QUE YA RECIBE, SE LIBERO PARA SEGUIR CON TRABAJO",
    noResponde: "NO SE LOGRO CONTACTAR A TITULAR SE DESASIGNO LA ORDEN",
    validacionAnterior: "ORDEN PREVIAMENTE VALIDADA ()",
    respondePeroReagenda: "CLIENTE RESPONDE PERO REAGENDA SU VISITA PARA",
    cancelacion4_4: "- SE CANCELO POR 4 VISITAS ILOCALIZABLE",
    respondeNoResponde: "NO SE LOGRO CONTACTAR A TITULAR SE DESASIGNO LA ORDEN",
    siLaDesea: "CLIENTE COMENTA QUE NO ES ASI , REFIERE QUE SI RECIBE, SE LIBERO PARA SEGUIR CON TRABAJO",
    noSeLogroContactar: "NO SE LOGRO CONTACTAR A TITULAR SE DESASIGNO LA ORDEN",
    cancelacion: "CLIENTE YA NO REQUIERE LA VIISITA SE DESASIGNO Y SE CANCELO LA ORDEN",
    sdpc: "SDPC",
    formularioLlenado: "SE LLENO FORMULARIO"
};


// --- 3. FUNCIONES PRINCIPALES ---
/**
 * Revisa si una fecha es hoy. Si lo es, devuelve "HOY".
 * Si no, la devuelve en formato DD/MM/YYYY.
 * @param {string} dateString - La fecha en formato 'YYYY-MM-DD'.
 * @returns {string} - "HOY" o la fecha formateada.
 */
function formatDateOrToday(dateString) {
    const today = new Date();
    // Formateamos la fecha de hoy a 'YYYY-MM-DD' para poder comparar
    const todayFormatted = today.getFullYear() + '-' + 
                           String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(today.getDate()).padStart(2, '0');

    if (dateString === todayFormatted) {
        return "HOY"; // ✅ ¡Es hoy!
    } else {
        // No es hoy, así que devolvemos la fecha normal
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
}
/**
 * Gestiona el clic en un botón de solo añadir texto.
 * La primera vez lo configura y las siguientes solo ejecuta la acción.
 * @param {Event} event - El evento del clic.
 */
function handleAppendOnlyButtonClick(event) {
    const button = event.currentTarget;

    // 1. Revisa si el botón ya fue configurado
    if (!button.dataset.text) {
        // --- Flujo de Configuración (primer clic) ---
        const buttonText = prompt(`Configurando "${button.textContent}":\n¿Qué texto quieres que este botón AGREGUE al final?`);

        if (buttonText && buttonText.trim() !== '') {
            // Guarda la configuración en el propio botón
            button.dataset.text = buttonText.trim();

            // Actualiza el texto visible del botón
            button.textContent = "✅ " + buttonText.trim().substring(0, 20) + '...';

            // Ejecuta la acción de AÑADIR inmediatamente
            // Usamos la acción 'append' que ya existe en tu función modifyLine
            modifyLine('Resolución de contacto:', " " + button.dataset.text, 'append');
        } else {
            alert("Configuración cancelada.");
        }
    } else {
        // --- Flujo de Acción (clics siguientes) ---
        // Simplemente añade el texto guardado al final
        modifyLine('Resolución de contacto:', " " + button.dataset.text, 'append');
    }
}

/** Inserta texto al final del área de notas. */
function insertText(text) {
   noteArea.value += text;
    noteArea.focus();
}

/** Modifica una línea específica del área de notas según una etiqueta. */
function modifyLine(label, text, action = 'replace') {
    // ... (esta función no cambia, ya incluye la lógica 'replace_before_slash') ...
    const lines = noteArea.value.split('\n');
    const lineIndex = lines.findIndex(line => line.trim().startsWith(label));

    if (lineIndex !== -1) {
        if (action === 'replace') {
            lines[lineIndex] = `${label} ${text}`;
        } else if (action === 'append') {
            lines[lineIndex] += ` ${text}`;
        } else if (action === 'replace_after_slash') {
            const slashIndex = lines[lineIndex].lastIndexOf('/');
            if (slashIndex !== -1) {
                lines[lineIndex] = lines[lineIndex].substring(0, slashIndex + 1) + ` ${text}`;
            } else {
                lines[lineIndex] += ` / ${text}`;
            }
        } else if (action === 'replace_before_slash') {
            const lineContent = lines[lineIndex].substring(label.length).trim();
            const slashIndexContent = lineContent.lastIndexOf('/');
            if (slashIndexContent !== -1) {
                const textAfter = lineContent.substring(slashIndexContent);
                lines[lineIndex] = `${label} ${text}${textAfter}`;
            } else {
                lines[lineIndex] = `${label} ${text} /`;
            }
        }
    } else {
        insertText(`\n${label} ${text}\n`);
    }
    noteArea.value = lines.join('\n');
    noteArea.focus();
}

/** Actualiza las líneas de "Motivo" y "Resolución" al mismo tiempo. */
function updateContactInfo({ motivo, resolucion }) {
    // ... (esta función no cambia) ...
    if (motivo) modifyLine('Motivo de contacto:', motivo);
    if (resolucion) modifyLine('Resolución de contacto:', resolucion);
}

// ... (El resto de funciones hasta llegar a la sección 5 no cambian: promptForHorario, copyAndReset, etc.)
/** Muestra un cuadro para pedir el horario sugerido al usuario y lo inserta. */
function promptForHorario() {
    const horario = prompt("¿Cuál es el horario sugerido?");
    if (horario) insertText(`\nHorario Sugerido ${horario}\n`);
}

/** Copia el texto (filtrado) y reinicia el área de notas con una animación. */
async function copyAndReset() {
    const originalText = noteArea.value;

    if (originalText.trim() === '') {
        noteArea.value = TEXT_TEMPLATES.base;
        noteArea.focus();
        return;
    }

    const lines = originalText.split('\n');
    const filteredLines = lines.filter(line => {
        const cleanLine = line.trim().toLowerCase();
        return !cleanLine.startsWith('direccion') &&
               !cleanLine.startsWith('domicilio') &&
               !cleanLine.startsWith('calle') &&
               !cleanLine.startsWith('referencias') &&
               !cleanLine.startsWith('colonia') &&
               !cleanLine.startsWith('codigo postal');
    });
    let textToProcess = filteredLines.join('\n');
    const phoneRegex = /\d{10,}/g;
    const textToCopy = textToProcess.replace(phoneRegex, '[NÚMERO ELIMINADO]');
    try {
        await navigator.clipboard.writeText(textToCopy);
    } catch (err) {
        console.error('Error al copiar el texto:', err);
    }

    noteArea.style.opacity = '0';
    noteArea.style.transform = 'scale(0.95)';

    await new Promise(resolve => setTimeout(resolve, 400));

    document.getElementById('datePicker').value = '';
    noteArea.value = TEXT_TEMPLATES.base;
    noteArea.style.height = 'auto';
    noteArea.style.height = '300px';
    noteArea.style.transform = 'scale(1)';
    noteArea.style.opacity = '1';
    noteArea.focus();
}

/** Abre selector de fecha, pregunta turno y actualiza Motivo y Resolución. */
function promptForDateAndInsert({ motivo, resolucion }) {
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', event => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;
        const dateText = formatDateOrToday(selectedDate); // ✨ Usamos la nueva función
        const isMorning = confirm("¿El turno es MATUTINO?\n\n(Aceptar = MATUTINO, Cancelar = VESPERTINO)");
        const shiftText = isMorning ? "MATUTINO" : "VESPERTINO";
        const parts = resolucion.split('/');
        const textBeforeSlash = parts[0].trim();
        const textAfterSlash = parts.length > 1 ? parts[1].trim() : '';
        const newResolutionText = `${textBeforeSlash} ${dateText} TURNO ${shiftText} / ${textAfterSlash}`; // ✨ Usamos la variable nueva

        updateContactInfo({ motivo: motivo, resolucion: newResolutionText });
    }, { once: true });
    datePicker.showPicker();
}

/** Abre selector de fecha, pregunta turno y actualiza solo la Resolución. */
function promptForDateAndSetResolutionOnly({ resolucion }) {
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', event => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;
        const dateText = formatDateOrToday(selectedDate); // ✨ Usamos la nueva función
        const isMorning = confirm("¿El turno es MATUTINO?\n\n(Aceptar = MATUTINO, Cancelar = VESPERTINO)");
        const shiftText = isMorning ? "MATUTINO" : "VESPERTINO";
        const parts = resolucion.split('/');
        const textBeforeSlash = parts[0].trim();
        const textAfterSlash = parts.length > 1 ? parts[1].trim() : '';
        const newResolutionText = `${textBeforeSlash} ${dateText} TURNO ${shiftText} / ${textAfterSlash}`; // ✨ Usamos la variable nueva

        modifyLine('Resolución de contacto:', newResolutionText);
    }, { once: true });
    datePicker.showPicker();
}

/** Abre selector de fecha, pregunta turno y AÑADE el resultado después de la barra. */
function promptForDateAndAppendAfterSlash(baseText) {
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', event => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;
        const dateText = formatDateOrToday(selectedDate); // ✨ Usamos la nueva función
        const isMorning = confirm("¿El turno es MATUTINO?\n\n(Aceptar = MATUTINO, Cancelar = VESPERTINO)");
        const shiftText = isMorning ? "MATUTINO" : "VESPERTINO";
        const newText = `${baseText} ${dateText} TURNO ${shiftText}`; // ✨ Usamos la variable nueva

        modifyLine('Resolución de contacto:', newText, 'replace_after_slash');
    }, { once: true });
    datePicker.showPicker();
}

// === INICIO DE CAMBIOS: Nueva función para manejar los botones personalizados ===
/**
 * Gestiona el clic en un botón personalizado.
 * Si es el primer clic, lo configura.
 * Si ya está configurado, ejecuta la acción.
 * @param {Event} event - El evento del clic.
 */
function handleCustomButtonClick(event) {
    const button = event.currentTarget;

    // Revisa si el botón ya fue configurado (si tiene texto guardado)
    if (!button.dataset.text) {
        // --- Flujo de Configuración (primer clic) ---
        const buttonText = prompt(`Configurando "${button.textContent}":\n¿Qué quieres que este botón agregue?`);

        if (buttonText && buttonText.trim() !== '') {
            const isBefore = confirm(
                "¿Dónde quieres que vaya el texto en 'Resolución de contacto:'?\n\n" +
                "· Presiona 'Aceptar' para ponerlo ANTES de la '/'.\n" +
                "· Presiona 'Cancelar' para ponerlo DESPUÉS de la '/'."
            );
            const position = isBefore ? 'before' : 'after';

            // Guarda la configuración en el propio botón
            button.dataset.text = buttonText.trim();
            button.dataset.position = position;

            // Actualiza el texto visible del botón
            button.textContent = buttonText.trim().substring(0, 20) + '...';

            // Ejecuta la acción inmediatamente después de configurar
            const action = position === 'before' ? 'replace_before_slash' : 'replace_after_slash';
            modifyLine('Resolución de contacto:', button.dataset.text, action);

        } else {
            alert("Configuración cancelada. El botón no realizará ninguna acción hasta que se configure.");
        }
    } else {
        // --- Flujo de Acción (clics siguientes) ---
        const storedText = button.dataset.text;
        const storedPosition = button.dataset.position;
        const action = storedPosition === 'before' ? 'replace_before_slash' : 'replace_after_slash';

        modifyLine('Resolución de contacto:', storedText, action);
    }
}
// === FIN DE CAMBIOS ===


// --- 4. CONFIGURACIÓN DE BOTONES ---

const BUTTON_CONFIG = {
    // ... (esta sección no cambia) ...
    'templateBtn': { action: () => insertText(TEXT_TEMPLATES.base) },
    'resetBtn': { action: copyAndReset },
    'unreachableClientBtn': { action: () => updateContactInfo(TEXT_TEMPLATES.unreachableClient) },
    'templateBtn2': { action: () => promptForDateAndInsert(TEXT_TEMPLATES.reagenda) },
    'templateBtn3': { action: () => updateContactInfo(TEXT_TEMPLATES.clienteNoSeEncuentra) },
    'templateBtn4': { action: () => updateContactInfo(TEXT_TEMPLATES.clienteRetrasa) },
    'templateBtn5': { action: () => updateContactInfo(TEXT_TEMPLATES.clienteNoDesea) },
    'templateBtn6': { action: () => updateContactInfo({ motivo: "EL PLAN DE SERVICIO NO FUE LO QUE CONTRATO", resolucion: TEXT_TEMPLATES.clienteNoDesea.resolucion }) },

    'ilocalizableBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.ilocalizable) },
    'reagendaBtn': { action: () => promptForDateAndSetResolutionOnly(TEXT_TEMPLATES.reagenda) },
    'clienteNoDeseaBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.clienteNoDeseaCompleta) },
    'validarSupervisorBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.validarSupervisor) },
    'clientReceivesBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.clientReceives, 'replace_after_slash') },
    'clientRescheduleBtn': { action: () => promptForDateAndAppendAfterSlash(TEXT_TEMPLATES.clientReschedule) },
    'unreachableClientBtn2': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.yaRecibe, 'replace_after_slash') },
    'clientReceivesBtn2': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.noResponde, 'replace_after_slash') },
    'clientRescheduleBtn2': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.validacionAnterior, 'replace_after_slash') },
    'unreachableClientBtn3': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.yaRecibe, 'replace_after_slash') },
    'clientReceivesBtn3': { action: () => promptForDateAndAppendAfterSlash(TEXT_TEMPLATES.respondePeroReagenda) },
    'clientRescheduleBtn3': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.cancelacion4_4, 'replace_after_slash') },
    'unreachableClientBtn4': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.yaRecibe, 'replace_after_slash') },
    'clientReceivesBtn4': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.respondeNoResponde, 'replace_after_slash') },
    'clientRescheduleBtn4': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.validacionAnterior, 'replace_after_slash') },
    'unreachableClientBtn5': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.siLaDesea, 'replace_after_slash') },
    'clientReceivesBtn5': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.respondeNoResponde, 'replace_after_slash') },
    'unreachableClientBtn6': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.siLaDesea, 'replace_after_slash') },
    'clientReceivesBtn6': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.noSeLogroContactar, 'replace_after_slash') },
    'cancelacionBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.cancelacion, 'replace_after_slash') },
    'noRespondeBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.noResponde, 'replace_after_slash') },
    'sdpcBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.sdpc, 'replace_after_slash') },
    'horarioSugeridoBtn': { action: promptForHorario },
    'formularioBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.formularioLlenado, 'append') }
};


// --- 5. INICIALIZACIÓN Y LISTENERS ---

// Asigna las acciones a todos los botones configurados.
for (const buttonId in BUTTON_CONFIG) {
    const buttonElement = document.getElementById(buttonId);
    if (buttonElement) {
        buttonElement.addEventListener('click', BUTTON_CONFIG[buttonId].action);
    } else {
        console.warn(`Advertencia: El botón con id "${buttonId}" no fue encontrado en el HTML.`);
    }
}

// === INICIO DE CAMBIOS: Asigna el manejador a cada botón personalizado ===
document.getElementById('customBtn1').addEventListener('click', handleCustomButtonClick);
document.getElementById('customBtn2').addEventListener('click', handleCustomButtonClick);
document.getElementById('customBtn3').addEventListener('click', handleCustomButtonClick);
document.getElementById('addOnlyBtn1').addEventListener('click', handleAppendOnlyButtonClick);
document.getElementById('addOnlyBtn2').addEventListener('click', handleAppendOnlyButtonClick);
document.getElementById('addOnlyBtn3').addEventListener('click', handleAppendOnlyButtonClick);

// === FIN DE CAMBIOS ===

// Listeners para el área de texto (detección de datos y auto-formato).
noteArea.addEventListener('input', () => {
    // ... (esta sección no cambia) ...
    const currentText = noteArea.value;
    const phoneRegex = /\d{10,}/;

    if (phoneRegex.test(currentText) && !isPhoneAlertShown) {
        alert("¡Cuidado, Recuerda No Compartir, Ni Documentar Datos Sensibles!");
        isPhoneAlertShown = true;
    } else if (!phoneRegex.test(currentText)) {
        isPhoneAlertShown = false;
    }

    const cursorPosition = noteArea.selectionStart;
    const lines = currentText.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('Os:')) {
            const prefix = 'Os:';
            let content = lines[i].substring(prefix.length).trim();
            if (content && !content.startsWith('OS-') && !isNaN(content)) {
                lines[i] = `${prefix} OS-${content}`;
                modified = true;
                break;
            }
        }
    }

    if (modified) {
        noteArea.value = lines.join('\n');
        noteArea.setSelectionRange(cursorPosition + 4, cursorPosition + 4);
    }
});

// Listeners para el efecto visual del cursor.
document.addEventListener('mousemove', (e) => {
    // ... (esta sección no cambia) ...
    mouseFollower.style.left = `${e.clientX}px`;
    mouseFollower.style.top = `${e.clientY}px`;
    mouseFollower.style.opacity = 1;
});

document.addEventListener('mouseleave', () => {
    mouseFollower.style.opacity = 0;
});

document.querySelectorAll('button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        mouseFollower.classList.add('active');
        const rect = button.getBoundingClientRect();
        mouseFollower.style.left = `${rect.left + rect.width / 2}px`;
        mouseFollower.style.top = `${rect.top + rect.height / 2}px`;
    });
    button.addEventListener('mouseleave', () => {
        mouseFollower.classList.remove('active');
    });
});