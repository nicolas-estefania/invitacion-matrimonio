
// =================================
// CONFIGURACIÓN DEL SISTEMA
// =================================

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbzygVF_u_cZl8dkYAGCkS16XfYqJooG9GDsmYOO1jEiCAQT1PihVwSjRjypEnnuIcpZuw/exec";

let datosInvitacionActual = null;
let enviandoConfirmacion = false;


// =================================
// CUENTA REGRESIVA DE LA BODA
// =================================

// Fecha provisional: 24 de abril de 2027
const fechaBoda = new Date("2027-04-24T16:00:00-05:00").getTime();

function actualizarContador() {

    const ahora = new Date().getTime();
    const diferencia = fechaBoda - ahora;

    if (diferencia <= 0) {
        document.querySelector(".contador").innerHTML =
            "<p>¡Hoy es nuestro gran día!</p>";
        return;
    }

    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    const horas = Math.floor(
        (diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    const minutos = Math.floor(
        (diferencia % (1000 * 60 * 60)) / (1000 * 60)
    );

    const segundos = Math.floor(
        (diferencia % (1000 * 60)) / 1000
    );

    document.getElementById("dias").textContent = dias;
    document.getElementById("horas").textContent = horas;
    document.getElementById("minutos").textContent = minutos;
    document.getElementById("segundos").textContent = segundos;
}

actualizarContador();
setInterval(actualizarContador, 1000);


// =================================
// MÚSICA DE FONDO
// =================================

const musicaBoda = document.getElementById("musicaBoda");
const botonMusica = document.getElementById("botonMusica");

if (musicaBoda && botonMusica) {

    botonMusica.addEventListener("click", async function () {

        if (musicaBoda.paused) {

            try {
                await musicaBoda.play();

                botonMusica.textContent = "Ⅱ";
                botonMusica.setAttribute("aria-label", "Pausar música");
                botonMusica.setAttribute("title", "Pausar música");

            } catch (error) {
                console.error("Error al reproducir la música:", error);
            }

        } else {

            musicaBoda.pause();

            botonMusica.textContent = "♫";
            botonMusica.setAttribute("aria-label", "Activar música");
            botonMusica.setAttribute("title", "Activar música");
        }
    });
}


// =================================
// ABRIR INVITACIÓN
// =================================

function abrirInvitacion() {

    document.getElementById("bienvenida").scrollIntoView({
        behavior: "smooth"
    });
}


// =================================
// CONSULTAR INVITACIÓN PERSONALIZADA
// =================================

function consultarInvitacion() {

    const parametros = new URLSearchParams(window.location.search);
    const codigo = parametros.get("codigo");

    if (!codigo) {
        console.log("La página se abrió sin código de invitación.");
        return;
    }

    window.respuestaInvitacion = function (respuesta) {

        console.log("Respuesta de Apps Script:", respuesta);

        if (!respuesta.exito) {

            mostrarMensajeInvitacion(
                respuesta.mensaje || "No fue posible consultar tu invitación."
            );

            return;
        }

        datosInvitacionActual = {
            codigo: codigo,
            invitado1: respuesta.invitado1,
            invitado2: respuesta.invitado2 || "",
            cupos: Number(respuesta.cupos),
            tipo: respuesta.tipo
        };

        mostrarDatosInvitacion(respuesta);
    };

    const script = document.createElement("script");

    script.src =
        URL_APPS_SCRIPT +
        "?codigo=" + encodeURIComponent(codigo) +
        "&callback=respuestaInvitacion";

    script.onerror = function () {

        mostrarMensajeInvitacion(
            "No fue posible conectar con el sistema de invitaciones. Inténtalo nuevamente."
        );
    };

    document.body.appendChild(script);
}


// =================================
// MOSTRAR DATOS DE LA INVITACIÓN
// =================================

function mostrarDatosInvitacion(datos) {

    const formulario = document.getElementById("formularioConfirmacion");

    if (!formulario) {
        console.error("No se encontró el espacio de confirmación.");
        return;
    }

    const esPareja = String(datos.tipo).toUpperCase() === "PAREJA";

    const nombres = datos.invitado2
        ? datos.invitado1 + " y " + datos.invitado2
        : datos.invitado1;

    const preguntaAsistencia = "¿Podrás acompañarnos?";

    const respuestaSi = esPareja
        ? "¡Sí, allí estaremos!"
        : "¡Sí, allí estaré!";

    const respuestaNo = esPareja
        ? "Lo sentimos, no podremos asistir."
        : "Lo siento, no podré asistir.";

    formulario.innerHTML = `
        <div class="mensaje-invitacion">
            <h3>¡Hola, ${escaparHTML(nombres)}!</h3>

            <p>Nos alegra compartir contigo este día tan especial.</p>

            <p>
                Tu invitación está registrada para
                <strong>${datos.cupos} ${datos.cupos === 1 ? "persona" : "personas"}</strong>.
            </p>
        </div>

        <form id="formularioRSVP" style="display: none;">

            <div class="campo-confirmacion">

                <p><strong>${preguntaAsistencia}</strong></p>

                <label>
                    <input
                        type="radio"
                        name="asistira"
                        value="SI"
                        required
                    >
                    ${respuestaSi}
                </label>

                <label>
                    <input
                        type="radio"
                        name="asistira"
                        value="NO"
                    >
                    ${respuestaNo}
                </label>

            </div>

            <div class="campo-confirmacion">

                <label for="observaciones">
                    Observaciones (opcional)
                </label>

                <textarea
                    id="observaciones"
                    name="observaciones"
                    rows="4"
                    maxlength="500"
                    placeholder="Si deseas dejarnos algún mensaje, puedes escribirlo aquí."
                ></textarea>

            </div>

            <button
                type="submit"
                class="boton-confirmacion"
                id="botonEnviarConfirmacion"
            >
                Enviar confirmación
            </button>

        </form>

        <p id="mensajeResultado" role="status" aria-live="polite"></p>
    `;

    formulario.style.display = "block";

    const formularioRSVP = document.getElementById("formularioRSVP");

    formularioRSVP.addEventListener("submit", enviarConfirmacion);
}




// =================================
// MOSTRAR MENSAJES DEL SISTEMA
// =================================

function mostrarMensajeInvitacion(mensaje) {

    const formulario = document.getElementById("formularioConfirmacion");

    if (!formulario) return;

    formulario.innerHTML = `
        <div class="mensaje-invitacion">
            <p>${escaparHTML(mensaje)}</p>
        </div>
    `;

    formulario.style.display = "block";
}


// =================================
// PROTEGER TEXTO MOSTRADO EN HTML
// =================================

function escaparHTML(texto) {

    return String(texto).replace(/[&<>"']/g, function (caracter) {

        const equivalencias = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return equivalencias[caracter];
    });
}


// =================================
// MOSTRAR FORMULARIO DE CONFIRMACIÓN
// =================================

function mostrarFormulario() {

    const formulario = document.getElementById("formularioConfirmacion");

    if (!formulario) return;

    formulario.style.display = "block";

    const formularioRSVP = document.getElementById("formularioRSVP");

    if (formularioRSVP) {
        formularioRSVP.style.display = "block";
    }

    formulario.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}


// =================================
// ENVIAR CONFIRMACIÓN A GOOGLE SHEETS
// =================================

async function enviarConfirmacion(evento) {

    evento.preventDefault();

    if (enviandoConfirmacion) return;

    if (!datosInvitacionActual) {
        mostrarResultado("No fue posible identificar tu invitación. Recarga la página e inténtalo nuevamente.");
        return;
    }

    const formulario = document.getElementById("formularioRSVP");
    const boton = document.getElementById("botonEnviarConfirmacion");
    const respuesta = new FormData(formulario);

    const asistira = respuesta.get("asistira");
    const observaciones = respuesta.get("observaciones") || "";

    if (!asistira) {
        mostrarResultado("Por favor, selecciona si podrás acompañarnos.");
        return;
    }

    if (observaciones.length > 500) {
        mostrarResultado("Las observaciones no pueden superar los 500 caracteres.");
        return;
    }

    enviandoConfirmacion = true;
    boton.disabled = true;
    boton.textContent = "Enviando confirmación...";

    mostrarResultado("Estamos registrando tu respuesta. Por favor, espera.");

    const solicitudId =
        "SOL-" + Date.now() + "-" +
        Math.random().toString(36).substring(2, 10);

    try {

        await enviarFormularioAppsScript({
            codigo: datosInvitacionActual.codigo,
            asistira: asistira,
            observaciones: observaciones,
            solicitudId: solicitudId
        });

        verificarConfirmacionRegistrada(
            datosInvitacionActual.codigo,
            solicitudId
        );

    } catch (error) {

        console.error("Error al enviar la confirmación:", error);

        mostrarResultado(
            "No fue posible enviar la confirmación. Verifica tu conexión e inténtalo nuevamente."
        );

        boton.disabled = false;
        boton.textContent = "Enviar confirmación";
        enviandoConfirmacion = false;
    }
}


// =================================
// ENVIAR DATOS MEDIANTE FORMULARIO POST
// =================================


function enviarFormularioAppsScript(datos) {

    return new Promise(function (resolve, reject) {

        const nombreIframe = "iframeConfirmacionBoda";

        let iframe = document.getElementById(nombreIframe);

        if (iframe) {
            iframe.remove();
        }

        iframe = document.createElement("iframe");
        iframe.id = nombreIframe;
        iframe.name = nombreIframe;
        iframe.style.display = "none";

        // Primero escuchamos la carga del iframe.
        // Así evitamos perder su primer evento.
        iframe.addEventListener("load", function prepararEnvio() {

            iframe.removeEventListener("load", prepararEnvio);

            const formularioPOST = document.createElement("form");

            formularioPOST.method = "POST";
            formularioPOST.action = URL_APPS_SCRIPT;
            formularioPOST.target = nombreIframe;
            formularioPOST.style.display = "none";

            Object.keys(datos).forEach(function (campo) {

                const input = document.createElement("input");

                input.type = "hidden";
                input.name = campo;
                input.value = datos[campo];

                formularioPOST.appendChild(input);
            });

            document.body.appendChild(formularioPOST);

            console.log("Enviando datos a Apps Script:", datos);
            console.log("URL de destino:", formularioPOST.action);
            console.log("Destino del formulario:", formularioPOST.target);

            iframe.addEventListener("load", function respuestaPOST() {

                iframe.removeEventListener("load", respuestaPOST);

                formularioPOST.remove();

                console.log("Respuesta del envío recibida.");

                resolve();

            }, { once: true });

            formularioPOST.submit();

        }, { once: true });

        // El iframe se agrega después de configurar el evento.
        document.body.appendChild(iframe);

    });
}



// =================================
// VERIFICAR QUE LA CONFIRMACIÓN QUEDÓ REGISTRADA
// =================================

function verificarConfirmacionRegistrada(codigo, solicitudId) {

    const callback = "respuestaVerificacion";

    let script = null;

    let tiempoEspera = setTimeout(function () {

        limpiarVerificacion();

        mostrarResultado(
            "La respuesta fue enviada, pero no pudimos verificar el registro. Por favor, vuelve a intentarlo más tarde."
        );

        finalizarEnvioConError();

    }, 20000);

    function limpiarVerificacion() {

        clearTimeout(tiempoEspera);

        if (script) {
            script.remove();
        }

        delete window[callback];
    }

    window[callback] = function (resultado) {

        limpiarVerificacion();

        console.log("Verificación de confirmación:", resultado);

        if (resultado.exito && resultado.existe) {

            const mensaje = resultado.asistira === "SI"
                ? "¡Gracias por confirmar! Nos alegra mucho que nos acompañes."
                : "Gracias por informarnos. Lamentamos que no puedas acompañarnos.";

            mostrarResultado(mensaje);

            const formulario = document.getElementById("formularioRSVP");

            if (formulario) {
                formulario.style.display = "none";
            }

            const boton = document.getElementById("botonEnviarConfirmacion");

            if (boton) {
                boton.disabled = true;
            }

            enviandoConfirmacion = false;

        } else {

            mostrarResultado(
                "No encontramos tu confirmación registrada. Por favor, inténtalo nuevamente."
            );

            finalizarEnvioConError();
        }
    };

    script = document.createElement("script");

    script.src =
        URL_APPS_SCRIPT +
        "?accion=verificarConfirmacion" +
        "&codigo=" + encodeURIComponent(codigo) +
        "&solicitudId=" + encodeURIComponent(solicitudId) +
        "&callback=" + callback;

    script.onerror = function () {

        limpiarVerificacion();

        mostrarResultado(
            "No fue posible verificar tu confirmación. Inténtalo nuevamente."
        );

        finalizarEnvioConError();
    };

    document.body.appendChild(script);
}


// =================================
// FINALIZAR ENVÍO CUANDO HAY ERROR
// =================================

function finalizarEnvioConError() {

    const boton = document.getElementById("botonEnviarConfirmacion");

    if (boton) {
        boton.disabled = false;
        boton.textContent = "Enviar confirmación";
    }

    enviandoConfirmacion = false;
}


// =================================
// MOSTRAR RESULTADO AL INVITADO
// =================================

function mostrarResultado(mensaje) {

    const elemento = document.getElementById("mensajeResultado");

    if (elemento) {
        elemento.textContent = mensaje;
    }
}


// =================================
// INICIAR CONSULTA AL CARGAR LA PÁGINA
// =================================

consultarInvitacion();

