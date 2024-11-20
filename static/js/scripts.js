document.addEventListener("DOMContentLoaded", function () {
    const socket = io();

    // Eventos WebSocket
    socket.on("connect", () => {
        appendToTerminal("Conectado ao servidor WebSocket");
    });

    socket.on("output", (data) => {
        appendToTerminal(data.data);
    });

    // Inicializa a lista de dispositivos ao carregar a página
    listarDispositivos();

    // Eventos de Troca de Tema
    const themeSelector = document.getElementById("theme-selector");
    themeSelector?.addEventListener("change", changeTheme);
});

// Função para atualizar o terminal
function appendToTerminal(message) {
    const terminal = document.getElementById("terminal");
    
    // Obtém o texto atual do terminal
    const terminalContent = terminal.value.trim();

    // Adiciona a mensagem apenas se for diferente da última linha
    if (terminalContent.split("\n").pop() !== message.trim()) {
        terminal.value += (terminalContent ? "\n" : "") + message.trim();
    }
    terminal.scrollTop = terminal.scrollHeight;
}

// Função para trocar tema
function changeTheme() {
    const selectedTheme = document.getElementById("theme-selector").value;
    const themeLink = document.getElementById("theme-link");

    const themes = {
        burp: "/static/css/burp.css",
        hacker: "/static/css/hacker.css",
        cyber_punk: "/static/css/cyber_punk.css",
        linux_mint: "/static/css/linux_mint.css",
        suave: "/static/css/suave.css",
        tech: "/static/css/tech.css",
        win7: "/static/css/win7.css",
        matrix: "/static/css/matrix.css",
        blue: "/static/css/blue.css",

    };

    themeLink.href = themes[selectedTheme] || themes["hacker"];
}

// Função para listar dispositivos
async function listarDispositivos() {
    try {
        const response = await fetch("/listar_dispositivos");
        const dispositivos = await response.json();
        atualizarSelectDispositivos(dispositivos);
    } catch (error) {
        appendToTerminal(`Erro ao listar dispositivos: ${error.message}`);
    }
}

// Atualiza os selects com dispositivos
// Atualiza os selects com dispositivos
function atualizarSelectDispositivos(dispositivos) {
    const selectDispositivos = document.getElementById("dispositivos");
    const selectDispositivosUpload = document.getElementById("dispositivos_upload");

    [selectDispositivos, selectDispositivosUpload].forEach((select) => {
        select.innerHTML = "";
        const defaultOption = document.createElement("option");
        defaultOption.textContent = "Selecionar dispositivo";
        defaultOption.value = "";
        select.appendChild(defaultOption);

        dispositivos.forEach((dispositivo) => {
            const option = document.createElement("option");
            option.value = dispositivo;
            option.textContent = dispositivo;
            select.appendChild(option);
        });
    });

    // Adiciona evento para listar pacotes ao selecionar um dispositivo
    selectDispositivos.addEventListener("change", listarPacotes);

    appendToTerminal(`Dispositivos listados: ${dispositivos.join(", ")}`);
}

// Função para listar pacotes
async function listarPacotes() {
    const dispositivo = document.getElementById("dispositivos").value;
    if (!dispositivo) {
        appendToTerminal("Nenhum dispositivo selecionado");
        return;
    }

    try {
        const response = await fetch("/listar_pacotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const pacotes = await response.json();
        atualizarSelectPacotes(pacotes);
    } catch (error) {
        appendToTerminal(`Erro ao listar pacotes: ${error.message}`);
    }
}

// Atualiza o select de pacotes
function atualizarSelectPacotes(pacotes) {
    const selectPacotes = document.getElementById("pacotes");
    selectPacotes.innerHTML = "";

    pacotes.forEach((pacote) => {
        const option = document.createElement("option");
        option.value = pacote;
        option.textContent = pacote;
        selectPacotes.appendChild(option);
    });

    appendToTerminal("Pacotes listados com sucesso");
}

// Função para executar scripts Frida
async function executarFrida() {
    const dispositivo = document.getElementById("dispositivos").value;
    const pacote = document.getElementById("pacotes").value;
    const scripts = [];

    if (document.getElementById("chk_anti_root").checked) scripts.push("frida-anti-root.js");
    if (document.getElementById("chk_bypass_ssl").checked) scripts.push("frida-multiple-unpinning.js");
    if (document.getElementById("chk_full_crypto").checked) scripts.push("new-full-crypto.js");
    if (document.getElementById("chk_bypass_fingerprint").checked) scripts.push("biometric-bypass.js");

    if (!dispositivo || !pacote) {
        appendToTerminal("Por favor, selecione um dispositivo e um pacote.");
        return;
    }

    try {
        const response = await fetch("/executar_frida", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo, pacote, scripts }),
        });
        const result = await response.json();
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao executar Frida: ${error.message}`);
    }
}

// Função para limpar o console (Terminal)
function clearOutput() {
    const terminal = document.getElementById("terminal");
    terminal.value = ""; // Limpa o conteúdo do terminal
}

// Função para listar arquivos no dispositivo
async function adbShellLs() {
    const dispositivo = document.getElementById("dispositivos").value;
    if (!dispositivo) {
        appendToTerminal("Nenhum dispositivo selecionado");
        return;
    }

    try {
        const response = await fetch("/adb_shell_ls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        appendToTerminal(result.join("\n")); // Exibe os arquivos no terminal
    } catch (error) {
        appendToTerminal(`Erro ao listar arquivos: ${error.message}`);
    }
}

// Outras funções auxiliares para ações de dispositivos
async function rebootDevice() {
    await executarAcaoDispositivo("/reboot_device", "Reiniciar dispositivo");
}

async function adbReverse() {
    await executarAcaoDispositivo("/adb_reverse", "ADB Reverse");
}

async function executarAcaoDispositivo(endpoint, acao) {
    const dispositivo = document.getElementById("dispositivos").value;

    if (!dispositivo) {
        appendToTerminal(`Nenhum dispositivo selecionado para ${acao}`);
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao executar ${acao}: ${error.message}`);
    }
}

// Função para limpar o cache de um pacote
async function limparPacote() {
    const dispositivo = document.getElementById("dispositivos").value;
    const pacote = document.getElementById("pacotes").value;

    if (!dispositivo || !pacote) {
        appendToTerminal("Por favor, selecione um dispositivo e um pacote.");
        return;
    }

    try {
        const response = await fetch("/limpar_pacote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo, pacote }),
        });

        const result = await response.json();
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao limpar pacote: ${error.message}`);
    }
}

// Função para remover um aplicativo
async function removerApp() {
    const dispositivo = document.getElementById("dispositivos").value;
    const pacote = document.getElementById("pacotes").value;

    if (!dispositivo || !pacote) {
        appendToTerminal("Por favor, selecione um dispositivo e um pacote.");
        return;
    }

    try {
        const response = await fetch("/remover_app", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo, pacote }),
        });

        const result = await response.json();
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao remover app: ${error.message}`);
    }
}

// Função para instalar um APK
async function instalarAPK() {
    const dispositivo = document.getElementById("dispositivos_upload").value;
    const arquivo = document.getElementById("apk_file").files[0];

    if (!dispositivo || !arquivo) {
        appendToTerminal("Por favor, selecione um dispositivo e um arquivo APK.");
        return;
    }

    const formData = new FormData();
    formData.append("dispositivo", dispositivo);
    formData.append("arquivo", arquivo);

    try {
        const response = await fetch("/instalar_apk", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao instalar APK: ${error.message}`);
    }
}

// Função para definir proxy
async function definirProxy() {
    const dispositivo = document.getElementById("dispositivos").value;
    const host = document.getElementById("proxy_host").value;
    const port = document.getElementById("proxy_port").value;

    if (!dispositivo || !host || !port) {
        appendToTerminal("Por favor, preencha todos os campos.");
        return;
    }

    try {
        const response = await fetch("/definir_proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo, host, port }),
        });
        const result = await response.json();
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao definir proxy: ${error.message}`);
    }
}

// RemoverProxy
async function removerProxy() {
    const dispositivo = document.getElementById("dispositivos").value;

    if (!dispositivo) {
        appendToTerminal("Por favor, selecione um dispositivo.");
        return;
    }

    try {
        const response = await fetch("/remover_proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });

        const result = await response.json();

        if (response.ok) {
            appendToTerminal("Proxy removido com sucesso.");
        } else {
            appendToTerminal(`Erro ao remover proxy: ${result.error}`);
            if (result.details) {
                appendToTerminal(`Detalhes do erro: ${result.details.join(", ")}`);
            }
        }
    } catch (error) {
        appendToTerminal(`Erro ao remover proxy: ${error.message}`);
    }
}


// VerificarProxy
async function verificarProxy() {
    const dispositivo = document.getElementById("dispositivos").value;

    if (!dispositivo) {
        appendToTerminal("Por favor, selecione um dispositivo.");
        return;
    }

    try {
        const response = await fetch("/verificar_proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });

        const result = await response.json();

        if (response.ok) {
            appendToTerminal("Configurações de Proxy:");
            appendToTerminal(`HTTP Proxy: ${result.http_proxy}`);
            appendToTerminal(`Host Proxy: ${result.global_http_proxy_host}`);
            appendToTerminal(`Porta Proxy: ${result.global_http_proxy_port}`);
            appendToTerminal(`Exclusões Proxy: ${result.global_http_proxy_exclusion_list}`);
        } else {
            appendToTerminal(`Erro ao verificar proxy: ${result.error || "Erro desconhecido"}`);
        }
    } catch (error) {
        appendToTerminal(`Erro ao verificar proxy: ${error.message}`);
    }
}



// Função para capturar a tela
async function captureScreen() {
    const dispositivo = document.getElementById("dispositivos").value;
    if (!dispositivo) {
        appendToTerminal("Por favor, selecione um dispositivo.");
        return;
    }

    try {
        const response = await fetch("/adb_screencap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });

        const result = await response.json();
        appendToTerminal("Captura de tela realizada com sucesso.");
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao capturar a tela: ${error.message}`);
    }
}

// Função para iniciar gravação da tela
async function startScreenRecording() {
    const dispositivo = document.getElementById("dispositivos").value;
    if (!dispositivo) {
        appendToTerminal("Por favor, selecione um dispositivo.");
        return;
    }

    try {
        const response = await fetch("/adb_screenrecord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });

        const result = await response.json();
        appendToTerminal("Gravação da tela iniciada com sucesso.");
        appendToTerminal(JSON.stringify(result));
    } catch (error) {
        appendToTerminal(`Erro ao iniciar gravação da tela: ${error.message}`);
    }
}

async function executeSelectedScript() {
    const scriptFile = document.getElementById("custom_script").files[0];
    const dispositivo = document.getElementById("dispositivos").value;
    const pacote = document.getElementById("pacotes").value; // Seleção do pacote

    if (!scriptFile) {
        appendToTerminal("Por favor, selecione um script para executar.");
        return;
    }

    if (!dispositivo || !pacote) {
        appendToTerminal("Por favor, selecione um dispositivo e um pacote antes de executar o script.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
        const scriptContent = event.target.result;

        try {
            const response = await fetch("/execute_script", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dispositivo, pacote, script: scriptContent }),
            });

            const result = await response.json();

            if (response.ok) {
                appendToTerminal(`Script executado com sucesso.`);
                appendToTerminal(JSON.stringify(result));
            } else {
                appendToTerminal(`Erro ao executar script: ${result.error || "Erro desconhecido"}`);
            }
        } catch (error) {
            appendToTerminal(`Erro ao executar script: ${error.message}`);
        }
    };

    reader.readAsText(scriptFile);
}


// Registrar as funções no escopo global
window.captureScreen = captureScreen;
window.startScreenRecording = startScreenRecording;
window.limparPacote = limparPacote;
window.removerApp = removerApp;
window.instalarAPK = instalarAPK;
window.definirProxy = definirProxy;
