document.addEventListener("DOMContentLoaded", function () {
    const socket = io();

    socket.on("connect", () => {
        console.log("Connected to WebSocket server");
    });

    socket.on("output", (data) => {
        const terminal = document.getElementById("terminal");
        terminal.value += data.data;
        terminal.scrollTop = terminal.scrollHeight;
    });

    window.onload = async function listarDispositivos() {
        const response = await fetch("/listar_dispositivos");
        const dispositivos = await response.json();
        const select = document.getElementById("dispositivos");
        select.innerHTML = "";
        dispositivos.forEach((dispositivo) => {
            const option = document.createElement("option");
            option.value = dispositivo;
            option.textContent = dispositivo;
            select.appendChild(option);
        });
    };

    window.listarPacotes = async function listarPacotes() {
        const dispositivo = document.getElementById("dispositivos").value;
        if (!dispositivo) {
            const terminal = document.getElementById("terminal");
            terminal.value += "Nenhum dispositivo selecionado\n";
            return;
        }
        const response = await fetch("/listar_pacotes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const pacotes = await response.json();
        const select = document.getElementById("pacotes");
        select.innerHTML = "";
        pacotes.forEach((pacote) => {
            const option = document.createElement("option");
            option.value = pacote;
            option.textContent = pacote;
            select.appendChild(option);
        });
    };

    window.executarFrida = async function executarFrida() {
        const dispositivo = document.getElementById("dispositivos").value;
        const pacote = document.getElementById("pacotes").value;
        const scriptElement = document.getElementById("script");
        const script = scriptElement ? scriptElement.value : "";
        const scripts = [];
        if (document.getElementById("chk_anti_root").checked)
            scripts.push("frida-anti-root.js");
        if (document.getElementById("chk_bypass_ssl").checked)
            scripts.push("frida-multiple-unpinning.js");
        if (document.getElementById("chk_full_crypto").checked)
            scripts.push("new-full-crypto.js");
        if (document.getElementById("chk_bypass_fingerprint").checked)
            scripts.push("biometric-bypass.js"); // Novo script
        if (script) scripts.push(script);

        if (!dispositivo || !pacote || scripts.length === 0) {
            const terminal = document.getElementById("terminal");
            terminal.value +=
                "Por favor, selecione um dispositivo, um pacote e ao menos uma opção de script.\n";
            return;
        }

        const response = await fetch("/executar_frida", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo, pacote, scripts, sid: socket.id }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
        console.log(result);
    };

    window.definirProxy = async function definirProxy() {
        const dispositivo = document.getElementById("dispositivos").value;
        const host = document.getElementById("proxy_host").value;
        const port = document.getElementById("proxy_port").value;

        if (!dispositivo || !host || !port) {
            const terminal = document.getElementById("terminal");
            terminal.value += "Por favor, preencha todos os campos.\n";
            return;
        }

        const response = await fetch("/definir_proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo, host, port, sid: socket.id }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
    };

    window.clearOutput = function clearOutput() {
        const terminal = document.getElementById("terminal");
        terminal.value = "";
    };

    window.rebootDevice = async function rebootDevice() {
        const dispositivo = document.getElementById("dispositivos").value;
        if (!dispositivo) {
            const terminal = document.getElementById("terminal");
            terminal.value += "Nenhum dispositivo selecionado\n";
            return;
        }
        const response = await fetch("/reboot_device", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
    };

    window.adbReverse = async function adbReverse() {
        const dispositivo = document.getElementById("dispositivos").value;
        if (!dispositivo) {
            const terminal = document.getElementById("terminal");
            terminal.value += "Nenhum dispositivo selecionado\n";
            return;
        }
        const response = await fetch("/adb_reverse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
    };

    window.captureScreen = async function captureScreen() {
        const dispositivo = document.getElementById("dispositivos").value;
        if (!dispositivo) {
            const terminal = document.getElementById("terminal");
            terminal.value += "Nenhum dispositivo selecionado\n";
            return;
        }
        const response = await fetch("/adb_screencap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
    };

    window.startScreenRecording = async function startScreenRecording() {
        const dispositivo = document.getElementById("dispositivos").value;
        if (!dispositivo) {
            const terminal = document.getElementById("terminal");
            terminal.value += "Nenhum dispositivo selecionado\n";
            return;
        }
        const response = await fetch("/adb_screenrecord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
    };

    window.adbShellLs = async function adbShellLs() {
        const dispositivo = document.getElementById("dispositivos").value;
        const response = await fetch("/adb_shell_ls", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dispositivo }),
        });
        const result = await response.json();
        const terminal = document.getElementById("terminal");
        terminal.value += JSON.stringify(result) + "\n";
    };
});
