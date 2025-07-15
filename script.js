/**
 * -----------------------------------------------------------------------------
 * BLOC DE NOTAS MEJORADO
 * -----------------------------------------------------------------------------
 * Este script gestiona una herramienta de bloc de notas con plantillas y botones
 * de acción rápida para automatizar la entrada de texto.
 */

// =============================================================================
// --- 1. ELEMENTOS DEL DOM Y VARIABLES GLOBALES ---
// =============================================================================

const noteArea = document.getElementById('noteArea');
const mouseFollower = document.querySelector('.mouse-follower');
let isPhoneAlertShown = false;
let noteHistory = [];
let stats = {
    totalNotes: 0,
    notesToday: {
        date: new Date().toISOString().slice(0, 10),
        count: 0
    },
    buttonClicks: {}
};

// =============================================================================
// --- 2. PLANTILLAS DE TEXTO ---
// =============================================================================

const TEXT_TEMPLATES = {
    base: "Persona con la que tuvimos contacto:\nMotivo de contacto:\nOs:\nResolución de contacto:\n",
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

// =============================================================================
// --- 3. FUNCIONES PRINCIPALES ---
// =============================================================================

function renderHistory() {
    const historyContent = document.getElementById('historyContent');
    if (!historyContent) return;
    historyContent.innerHTML = '';
    if (noteHistory.length === 0) {
        historyContent.innerHTML = '<p>No hay historial todavía.</p>';
        return;
    }
    noteHistory.forEach(noteText => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.textContent = noteText;
        historyItem.addEventListener('click', () => {
            noteArea.value = noteText;
            noteArea.focus();
            noteArea.style.transition = 'transform 0.2s';
            noteArea.style.transform = 'scale(1.02)';
            setTimeout(() => { noteArea.style.transform = 'scale(1)'; }, 200);
        });
        historyContent.appendChild(historyItem);
    });
}

function formatDateOrToday(dateString) {
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateString === todayFormatted) {
        return "HOY";
    } else {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
}

function insertText(text) {
    noteArea.value += text;
    noteArea.focus();
}

function modifyLine(label, text, action = 'replace') {
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

function updateContactInfo({ motivo, resolucion }) {
    if (motivo) modifyLine('Motivo de contacto:', motivo);
    if (resolucion) modifyLine('Resolución de contacto:', resolucion);
}

function promptForHorario() {
    const horario = prompt("¿Cuál es el horario sugerido?");
    if (horario) insertText(`\nHorario Sugerido ${horario}\n`);
}

async function copyAndReset() {
    const originalText = noteArea.value;

    if (originalText.trim() !== '') {
        noteHistory.unshift(originalText);
        if (noteHistory.length > 2) {
            noteHistory.pop();
        }
        renderHistory();

        if (!originalText.startsWith("Persona con la que tuvimos contacto:\nMotivo de contacto:\nOs:\nResolución de contacto:\n")) {
            stats.totalNotes++;
            stats.notesToday.count++;
            saveStats();
        }
    }

    if (originalText.trim() === '') {
        noteArea.value = TEXT_TEMPLATES.base;
        noteArea.focus();
        return;
    }

    const lines = originalText.split('\n');
    const filteredLines = lines.filter(line => {
        const cleanLine = line.trim().toLowerCase();
        return !cleanLine.startsWith('direccion') && !cleanLine.startsWith('domicilio') && !cleanLine.startsWith('calle') && !cleanLine.startsWith('referencias') && !cleanLine.startsWith('colonia') && !cleanLine.startsWith('codigo postal');
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
    noteArea.style.height = '250px';
    noteArea.style.transform = 'scale(1)';
    noteArea.style.opacity = '1';
    noteArea.focus();
}

function promptForDateAndInsert({ motivo, resolucion }) {
    const datePicker = document.getElementById('datePicker');
    const dateChangeHandler = (event) => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;

        // --- INICIO DEL CÓDIGO DE VALIDACIÓN ---
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const partesFecha = selectedDate.split('-');
        const anio = parseInt(partesFecha[0]);
        const mes = parseInt(partesFecha[1]) - 1;
        const dia = parseInt(partesFecha[2]);
        const fechaSeleccionada = new Date(anio, mes, dia);

        const diferenciaTiempo = fechaSeleccionada.getTime() - hoy.getTime();
        const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));

        if (diferenciaDias > 5) {
            alert("¡EXCEDE LOS 5 DIAS, TIENES QUE OFRECER CANCELACION!");
        }
        // --- FIN DEL CÓDIGO DE VALIDACIÓN ---

        const dateText = formatDateOrToday(selectedDate);
        const isMorning = confirm("¿El turno es MATUTINO?\n\n(Aceptar = MATUTINO, Cancelar = VESPERTINO)");
        const shiftText = isMorning ? "MATUTINO" : "VESPERTINO";
        const parts = resolucion.split('/');
        const textBeforeSlash = parts[0].trim();
        const textAfterSlash = parts.length > 1 ? parts[1].trim() : '';
        const newResolutionText = `${textBeforeSlash} ${dateText} TURNO ${shiftText} / ${textAfterSlash}`;
        updateContactInfo({ motivo: motivo, resolucion: newResolutionText });
        datePicker.value = '';
    };
    datePicker.addEventListener('change', dateChangeHandler, { once: true });
    datePicker.showPicker();
}



function promptForDateAndSetResolutionOnly({ resolucion }) {
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', event => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;

        // --- INICIO DEL CÓDIGO DE VALIDACIÓN ---
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const partesFecha = selectedDate.split('-');
        const anio = parseInt(partesFecha[0]);
        const mes = parseInt(partesFecha[1]) - 1;
        const dia = parseInt(partesFecha[2]);
        const fechaSeleccionada = new Date(anio, mes, dia);

        const diferenciaTiempo = fechaSeleccionada.getTime() - hoy.getTime();
        const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));

        if (diferenciaDias > 5) {
            alert("¡EXCEDE LOS 5 DIAS, TIENES QUE OFRECER CANCELACION!");
        }
        // --- FIN DEL CÓDIGO DE VALIDACIÓN ---

        const dateText = formatDateOrToday(selectedDate);
        const isMorning = confirm("¿El turno es MATUTINO?\n\n(Aceptar = MATUTINO, Cancelar = VESPERTINO)");
        const shiftText = isMorning ? "MATUTINO" : "VESPERTINO";
        const parts = resolucion.split('/');
        const textBeforeSlash = parts[0].trim();
        const textAfterSlash = parts.length > 1 ? parts[1].trim() : '';
        const newResolutionText = `${textBeforeSlash} ${dateText} TURNO ${shiftText} / ${textAfterSlash}`;
        modifyLine('Resolución de contacto:', newResolutionText);
    }, { once: true });
    datePicker.showPicker();
}


function promptForDateAndAppendAfterSlash(baseText) {
    const datePicker = document.getElementById('datePicker');
    datePicker.addEventListener('change', event => {
        const selectedDate = event.target.value;
        if (!selectedDate) return;

        // --- INICIO DEL CÓDIGO DE VALIDACIÓN ---
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const partesFecha = selectedDate.split('-');
        const anio = parseInt(partesFecha[0]);
        const mes = parseInt(partesFecha[1]) - 1;
        const dia = parseInt(partesFecha[2]);
        const fechaSeleccionada = new Date(anio, mes, dia);

        const diferenciaTiempo = fechaSeleccionada.getTime() - hoy.getTime();
        const diferenciaDias = Math.round(diferenciaTiempo / (1000 * 3600 * 24));

        if (diferenciaDias > 5) {
            alert("¡EXCEDE LOS 5 DIAS, TIENES QUE OFRECER CANCELACION!");
        }
        // --- FIN DEL CÓDIGO DE VALIDACIÓN ---

        const dateText = formatDateOrToday(selectedDate);
        const isMorning = confirm("¿El turno es MATUTINO?\n\n(Aceptar = MATUTINO, Cancelar = VESPERTINO)");
        const shiftText = isMorning ? "MATUTINO" : "VESPERTINO";
        const newText = `${baseText} ${dateText} TURNO ${shiftText}`;
        modifyLine('Resolución de contacto:', newText, 'replace_after_slash');
    }, { once: true });
    datePicker.showPicker();
}

function handleCustomButtonClick(event) {
    const button = event.currentTarget;
    if (!button.dataset.text) {
        const buttonText = prompt(`Configurando "${button.textContent}":\n¿Qué quieres que este botón agregue?`);
        if (buttonText && buttonText.trim() !== '') {
            const isBefore = confirm("¿Dónde quieres que vaya el texto en 'Resolución de contacto:'?\n\n· Presiona 'Aceptar' para ponerlo ANTES de la '/'.\n· Presiona 'Cancelar' para ponerlo DESPUÉS de la '/'.");
            const position = isBefore ? 'before' : 'after';
            button.dataset.text = buttonText.trim();
            button.dataset.position = position;
            button.textContent = buttonText.trim().substring(0, 20) + '...';
            const action = position === 'before' ? 'replace_before_slash' : 'replace_after_slash';
            modifyLine('Resolución de contacto:', button.dataset.text, action);
            saveCustomButtons();
        } else {
            alert("Configuración cancelada.");
        }
    } else {
        const storedText = button.dataset.text;
        const storedPosition = button.dataset.position;
        const action = storedPosition === 'before' ? 'replace_before_slash' : 'replace_after_slash';
        modifyLine('Resolución de contacto:', storedText, action);
    }
}

function handleAppendOnlyButtonClick(event) {
    const button = event.currentTarget;
    if (!button.dataset.text) {
        const buttonText = prompt(`Configurando "${button.textContent}":\n¿Qué texto quieres que este botón AGREGUE al final?`);
        if (buttonText && buttonText.trim() !== '') {
            button.dataset.text = buttonText.trim();
            button.textContent = "✅ " + buttonText.trim().substring(0, 20) + '...';
            modifyLine('Resolución de contacto:', " " + button.dataset.text, 'append');
            saveCustomButtons();
        } else {
            alert("Configuración cancelada.");
        }
    } else {
        modifyLine('Resolución de contacto:', " " + button.dataset.text, 'append');
    }
}

function resetCustomButtons() {
    const confirmation = confirm("¿Estás seguro de que quieres borrar la configuración de todos tus botones personalizados? Esta acción no se puede deshacer.");
    if (confirmation) {
        localStorage.removeItem('customButtonConfig');
        alert("¡Configuración de botones reseteada! La página se recargará.");
        location.reload();
    }
}

// =============================================================================
// --- 4. CONFIGURACIÓN DE BOTONES Y TUTORIAL ---
// =============================================================================

const BUTTON_CONFIG = {
    'templateBtn': { action: () => insertText(TEXT_TEMPLATES.base) },
    'resetBtn': { action: copyAndReset },
    'unreachableClientBtn': { action: () => updateContactInfo(TEXT_TEMPLATES.unreachableClient) },
    'templateBtn2': { action: () => promptForDateAndInsert(TEXT_TEMPLATES.reagenda) },
    'templateBtn3': { action: () => updateContactInfo(TEXT_TEMPLATES.clienteNoSeEncuentra) },
    'templateBtn4': { action: () => updateContactInfo(TEXT_TEMPLATES.clienteRetrasa) },
    'templateBtn5': { action: () => updateContactInfo(TEXT_TEMPLATES.clienteNoDesea) },
    'templateBtn6': { action: () => updateContactInfo({ motivo: "EL PLAN DE SERVICIO NO FUE LO QUE CONTRATO", resolucion: TEXT_TEMPLATES.clienteNoDesea.resolucion }) },
    'ilocalizableBtn': { action: () => modifyLine('Resolución de contacto:', TEXT_TEMPLATES.ilocalizable) },
    'reagendaBtn': { action: () => promptForDateAndSetResolutionOnly({ resolucion: TEXT_TEMPLATES.reagendaCompleta }) },
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

const tutorialGroups = [
    { title: "Los botones que se encuentran en la parte superior, son las alertas, y se agrupan con sus respectivas causas, lo que esta arriba es la alerta, lo que se encuentra abajo de ellas son las posibles causa", buttons: { 'unreachableClientBtn': '', 'templateBtn3': '' , 'templateBtn2': '' , 'templateBtn4': '', 'templateBtn5': '', 'templateBtn6': ''}},
    { title: "Principal", buttons: { 'templateBtn': '<b>Plantilla:</b> Inserta un texto, en este caso agrega la plantilla unica de documentacion.<b>PARA EMPEZAR NECESITAS OPRIMIR ESTE BOTON PARA USAR LOS BOTONES, DE LO CONTRARIO NO SE PODRAN USAR<b/>', 'resetBtn': '<b>Copiar y Borrar:</b> Copia todo el texto al portapapeles y limpia el área de notas.'} },
    { title: "Cliente no contesta", buttons: { 'unreachableClientBtn': '<b>Cliente No Contesta:</b> Usar cuando tecnico manda esta aleta, en automatico se estaria rellenando el "motivo" y "resolucion de contacto".', 'clientReceivesBtn': '<b>Cliente Sí Recibe:</b> Usar el boton en el caso que la alerta sea "Cliente No Contesta" pero cliente si responde y recibe en el momento.', 'clientRescheduleBtn': '<b>Cliente Reagenda:</b> Usar si el cliente contesta pero solicita un cambio.' } },
    { title: "Cliente No Se Encuentra En El Domicilio", buttons: { 'templateBtn3': '<b>Cliente No Se Encuentra:</b> Usar cuando tecnico manda esta aleta, en automatico se estaria rellenando el "motivo" y "resolucion de contacto.', 'unreachableClientBtn3': '<b>Ya Recibe:</b> El cliente que no se encontraba, ahora sí está disponible.', 'clientReceivesBtn3': '<b>Responde Pero Reagenda:</b> Te comunicas y te pide reagendar.', 'clientRescheduleBtn3': '<b>Cancelación 4/4:</b> Se usa para marcar una cancelación por intentos- fallidos 4 visitas. <b>"Puedes utilizar este boton para todas las alertas en caso de necesitarlo"<b/>' } },
    { title: "Opciones de Reagenda ", buttons: { 'templateBtn2': '<b>Reagenda:</b> Al usar este boton te mostrara un calendario, en el podras seleccionar una fecha, despues de hacerlo te mostrara un anuncion, leelo para poner el matutino y/o vespertino.', 'unreachableClientBtn2': '<b>Ya Recibe:</b> Si el cliente que había reagendado ahora confirma la visita en este momento.', 'clientReceivesBtn2': '<b>No Responde:</b> Si intentas contactar para confirmar la reagenda y no contesta.', 'clientRescheduleBtn2': '<b>Validación Anterior:</b> Notas sobre una validación previa.' } },
    { title: "Retraso de visita", buttons: { 'templateBtn4': '<b>Cliente Retrasa:</b> Usar este boton cuando esad mande esta alerta y termina de rellenar el script antes del "/" poniendo la hora a la que recibe titular.', 'unreachableClientBtn4': '<b>Ya Recibe:</b> El cliente que estaba retrasado ya está disponible y recibe en este momento.', 'clientReceivesBtn4': '<b>No Responde:</b> No contesta al intentar confirmar.', 'clientRescheduleBtn4': '<b>Validación Anterior:</b> Notas de una validación previa.' } },
    { title: "Cliente no desea el servicio", buttons: { 'templateBtn5': '<b>Cliente No Desea:</b> Usar cuando esad manda esta alerta y terminar de rellenar el escrit.', 'unreachableClientBtn5': '<b>Sí la Desea:</b> El cliente que no deseaba, cambia de opinión.', 'clientReceivesBtn5': '<b>No Responde:</b> Usar cuando se mando dicha alerta pero el clinete no responde.' } },
    { title: "El plan de servicio no fue lo que contrato", buttons: { 'templateBtn6': '<b>No Fue Lo Que Contrato:</b> Usar cuando esad manda esta alerta y terminar de rellenar el escrit, El cliente argumenta que lo ofrecido no coincide con el acuerdo.', 'unreachableClientBtn6': '<b>Sí la Desea:</b> El cliente que no deseaba, cambia de opinión.', 'clientReceivesBtn6': '<b>No Responde:</b> Usar cuando se mando dicha alerta pero el clinete no responde.' } },
    { title: "Plantillas Personalizadas ", buttons: { 'customBtn1': '<b>Personalizado 1:</b> Etos botones, guardan lo que tu quieras que agregue, puede ser antes o despues del "/" <b>PON ATENCION A LO QUE DICE PARA QUE SE AGREGUE JUSTO DONDE LO QUIERES.<b/>', 'addOnlyBtn1': '<b>Agregar Texto 1:</b> Agrega un fragmento de texto sin borrar lo existente.<b>EL TEXTO QUE AGREGUES AQUI SE PONDRA AL ULTIMO DEL ESCRIPT' } },
    { title: "Usa estos 3 botones en estos casos ", buttons: {'ilocalizableBtn': '<b>Ilocalizable:</b> Estos 3 botones solo modifiacan la "RESOLUCION DE CONTACTO: " funcional cuando los tecnicos mandan una alerta erronea, por ejemplo necesitas que el motivo sea de "reagenda" pero la resolucion necesitas sea de "cliente no responde".', 'reagendaBtn': '<b>Reagenda:</b> Al igual que la de arriba sirve para modificar solo la "Resolucion de contacto: ".', 'clienteNoDeseaBtn': '<b>Cliente No Desea:</b> Modifica igual solo la "Resolucion de contacto: ".' } },
    { title: "Adicionales ", buttons: {'horarioSugeridoBtn': '<b>Horario Sugerido:</b> Al usar este boton, te pedira una hora y la agregara a la documentacion hasta el ultimo.', 'validarSupervisorBtn': '<b>Validar con Supervisor:</b> Al usar modifica "Resolucion de contacto con "ESAD SE COMUNICA POR ALERTA QUE NO CORRESPONDE A LA CELULA / SE LE COMENTA VALIDAR CON SUPERVISOR PARA CANALIZAR A AREA CORRECTA, SE HACE TICKET INFORMATIVO"" .', 'cancelacionBtn': '<b>CANCELACIÓN:</b> Al usar el boton modifica todo lo que esta despues del "/" agragando lo siguiente "/ CLIENTE YA NO REQUIERE LA VIISITA SE DESASIGNO Y SE CANCELO LA ORDEN" sirve para absolutamente todas las alertas.','sdpcBtn': '<b>SDPC: </b> Usar solo en contigencia.', 'formularioBtn': '<b>FORMULARIO: </b> Agrega a la documentacion "SE LLENO FORMULARIO" .', 'noRespondeBtn': '<b>NO RESPONDE: </b> Sirve para todos los botones, usalo cuando el cliente no responda, modifica despues del "/" con "NO SE LOGRO CONTACTAR A TITULAR SE DESASIGNO LA ORDEN".'} }
];

// --- FUNCIONES DE GUARDADO Y CARGA ---

function saveCustomButtons() {
    const buttonsToSave = ['customBtn1', 'customBtn2', 'customBtn3', 'addOnlyBtn1', 'addOnlyBtn2', 'addOnlyBtn3'];
    const config = {};
    buttonsToSave.forEach(id => {
        const button = document.getElementById(id);
        if (button && button.dataset.text) {
            config[id] = {
                text: button.dataset.text,
                position: button.dataset.position
            };
        }
    });
    localStorage.setItem('customButtonConfig', JSON.stringify(config));
}

function loadCustomButtons() {
    const savedConfig = localStorage.getItem('customButtonConfig');
    if (savedConfig) {
        const config = JSON.parse(savedConfig);
        for (const id in config) {
            const button = document.getElementById(id);
            const buttonData = config[id];
            if (button) {
                button.dataset.text = buttonData.text;
                if (buttonData.position) {
                    button.dataset.position = buttonData.position;
                }
                if (id.startsWith('addOnly')) {
                    button.textContent = "✅ " + buttonData.text.substring(0, 20) + '...';
                } else {
                    button.textContent = buttonData.text.substring(0, 20) + '...';
                }
            }
        }
    }
}

// --- FUNCIONES DE ESTADÍSTICAS ---

function loadStats() {
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
    const today = new Date().toISOString().slice(0, 10);
    if (stats.notesToday.date !== today) {
        stats.notesToday.date = today;
        stats.notesToday.count = 0;
        saveStats();
    }
}

function saveStats() {
    localStorage.setItem('userStats', JSON.stringify(stats));
}

function trackButtonClick(buttonId) {
    if (buttonId === 'resetBtn') {
        return;
    }

    if (!stats.buttonClicks[buttonId]) {
        stats.buttonClicks[buttonId] = 0;
    }
    stats.buttonClicks[buttonId]++;
    saveStats();
}

function displayStats() {
    document.getElementById('statsNotesToday').textContent = stats.notesToday.count;
    document.getElementById('statsTotalNotes').textContent = stats.totalNotes;
    let mostUsedBtn = 'Ninguno';
    let maxClicks = 0;
    for (const buttonId in stats.buttonClicks) {
        if (stats.buttonClicks[buttonId] > maxClicks) {
            maxClicks = stats.buttonClicks[buttonId];
            const buttonElement = document.getElementById(buttonId);
            mostUsedBtn = buttonElement ? buttonElement.textContent : buttonId;
        }
    }
    document.getElementById('statsMostUsedBtn').textContent = mostUsedBtn;
    document.getElementById('statsMostUsedBtnClicks').textContent = maxClicks;
    document.getElementById('statsModal').style.display = 'flex';
}

// --- MODO OSCURO ---
function toggleModoOscuro() {
    const body = document.body;
    body.classList.toggle("modo-oscuro");
    const esOscuro = body.classList.contains("modo-oscuro");
    document.getElementById("modoBtn").textContent = esOscuro ? "☀️ Modo Claro" : "🌙 Modo Oscuro";
    localStorage.setItem("modoOscuro", esOscuro);
}

// =============================================================================
// --- 5. INICIALIZACIÓN Y EVENT LISTENERS ---
// =============================================================================

// Listener para cargar el modo oscuro al inicio
window.addEventListener("DOMContentLoaded", () => {
    const modoGuardado = localStorage.getItem("modoOscuro") === "true";
    if (modoGuardado) {
        document.body.classList.add("modo-oscuro");
        document.getElementById("modoBtn").textContent = "☀️ Modo Claro";
    }
});

// Listener principal que se ejecuta cuando el HTML está listo
document.addEventListener('DOMContentLoaded', () => {
    // Carga las estadísticas y las configuraciones al inicio
    loadStats();
    loadCustomButtons();

    // --- Variables para la Lógica del Tutorial ---
    let highlightedElements = [];

    // --- Función para limpiar el resaltado de los botones ---
    function clearSpotlight() {
        highlightedElements.forEach(el => el.classList.remove('spotlight-active'));
        highlightedElements = [];
    }

    // --- ASIGNACIÓN DE ACCIONES A BOTONES ---
    for (const buttonId in BUTTON_CONFIG) {
        const buttonElement = document.getElementById(buttonId);
        if (buttonElement) {
            const originalAction = BUTTON_CONFIG[buttonId].action;
            buttonElement.addEventListener('click', () => {
                trackButtonClick(buttonId);
                originalAction();
            });
        }
    }
    const customButtons = ['customBtn1', 'customBtn2', 'customBtn3'];
    customButtons.forEach(id => {
        document.getElementById(id)?.addEventListener('click', (event) => {
            trackButtonClick(id);
            handleCustomButtonClick(event);
        });
    });
    const addOnlyButtons = ['addOnlyBtn1', 'addOnlyBtn2', 'addOnlyBtn3'];
    addOnlyButtons.forEach(id => {
        document.getElementById(id)?.addEventListener('click', (event) => {
            trackButtonClick(id);
            handleAppendOnlyButtonClick(event);
        });
    });
    document.getElementById('resetCustomButtonsBtn')?.addEventListener('click', resetCustomButtons);

    // --- LISTENER PARA EL ÁREA DE TEXTO ---
    noteArea.addEventListener('input', () => {
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
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('Os:')) {
                const prefix = 'Os:';
                let content = lines[i].substring(prefix.length).trim();
                if (content && !content.startsWith('OS-') && !isNaN(content)) {
                    lines[i] = `${prefix} OS-${content}`;
                    noteArea.value = lines.join('\n');
                    const positionAfterLine = lines.slice(0, i + 1).join('\n').length;
                    noteArea.setSelectionRange(positionAfterLine, positionAfterLine);
                    break;
                }
            }
        }
    });

    // --- LÓGICA DEL HISTORIAL ---
    const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
    const historyContainer = document.querySelector('.container-history');
    if (toggleHistoryBtn && historyContainer) {
        toggleHistoryBtn.addEventListener('click', () => {
            historyContainer.classList.toggle('history-collapsed');
            const isCollapsed = historyContainer.classList.contains('history-collapsed');
            toggleHistoryBtn.textContent = isCollapsed ? 'Mostrar' : 'Ocultar';
        });
    }
    renderHistory();

    // --- LÓGICA DEL MODAL DEL TUTORIAL ---
    const tutorialModal = document.getElementById('tutorialModal');
    const tutorialOpenBtn = document.getElementById('tutorialBtn');
    const spotlightOverlay = document.getElementById('spotlight-overlay');
    
    // Ocultar al inicio
    tutorialModal.style.display = 'none';
    spotlightOverlay.style.display = 'none';

    if (tutorialModal && tutorialOpenBtn && spotlightOverlay) {
        tutorialOpenBtn.onclick = () => {
            const tutorialNextBtn = document.getElementById('tutorialNextBtn');
            const tutorialExitBtn = document.getElementById('tutorialExitBtn');
            const tutorialList = document.getElementById('tutorial-list');
            let currentGroupIndex = 0;

            function showGroup(index) {
                clearSpotlight();
                tutorialList.innerHTML = '';
                const group = tutorialGroups[index];
                const titleH3 = document.createElement('h3');
                titleH3.className = 'tutorial-group-title';
                titleH3.innerHTML = group.title;
                tutorialList.appendChild(titleH3);
                for (const id in group.buttons) {
                    const originalButton = document.getElementById(id);
                    if (originalButton) {
                        originalButton.classList.add('spotlight-active');
                        highlightedElements.push(originalButton);
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'tutorial-item';
                        const buttonClone = originalButton.cloneNode(true);
                        buttonClone.disabled = true;
                        buttonClone.classList.remove('spotlight-active');
                        const descriptionP = document.createElement('p');
                        descriptionP.innerHTML = group.buttons[id];
                        itemDiv.appendChild(buttonClone);
                        itemDiv.appendChild(descriptionP);
                        tutorialList.appendChild(itemDiv);
                    }
                }
            }

            function closeTutorial() {
                tutorialModal.style.display = "none";
                spotlightOverlay.style.display = "none";
                clearSpotlight();
            }

            showGroup(currentGroupIndex);
            tutorialModal.style.display = "flex";
            spotlightOverlay.style.display = "block";

            tutorialNextBtn.onclick = () => {
                currentGroupIndex = (currentGroupIndex + 1) % tutorialGroups.length;
                showGroup(currentGroupIndex);
            };
            tutorialExitBtn.onclick = closeTutorial;
        };
    }
    
    // --- LÓGICA DEL MODAL DE ESTADÍSTICAS ---
    const statsModal = document.getElementById('statsModal');
    const statsOpenBtn = document.getElementById('statsBtn');
    const statsCloseBtn = document.getElementById('statsCloseBtn');
    if (statsModal && statsOpenBtn && statsCloseBtn) {
        statsOpenBtn.onclick = displayStats;
        statsCloseBtn.onclick = () => { statsModal.style.display = 'none'; };
    }

    // --- LISTENER GENERAL PARA CERRAR MODALES AL HACER CLIC AFUERA ---
    window.addEventListener('click', (event) => {
        if (event.target == tutorialModal || event.target == spotlightOverlay) {
            tutorialModal.style.display = 'none';
            spotlightOverlay.style.display = 'none';
            clearSpotlight(); // <-- LA LÍNEA CLAVE AÑADIDA
        }
        if (event.target == statsModal) {
            statsModal.style.display = 'none';
        }
    });

    // --- ANIMACIÓN DE CARGA INICIAL ---
    const elementsToAnimate = document.querySelectorAll('textarea, button');
    elementsToAnimate.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('loaded');
        }, index * 75);
    });
});



// --- Listeners para efectos visuales (fuera de DOMContentLoaded) ---

document.addEventListener('mousemove', (e) => {
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

window.addEventListener('load', () => {
    setTimeout(() => {
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(button => {
            button.classList.add('stop-breathing');
        });
    }, 5000);
});

// --- INICIO DEL CÓDIGO AÑADIDO ---
const hoy = new Date();
const fechaSeleccionada = new Date(selectedDate);

// Normalizamos las horas para comparar solo las fechas
hoy.setHours(0, 0, 0, 0);
fechaSeleccionada.setHours(0, 0, 0, 0);

const diferenciaTiempo = fechaSeleccionada.getTime() - hoy.getTime();
const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

if (diferenciaDias > 5) {
    alert("¡EXCEDE LOS 5 DIAS, TIENES QUE OFRECER CANCELACION!");
}
// --- FIN DEL CÓDIGO AÑADIDO ---