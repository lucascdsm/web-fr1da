from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import os
import threading
from uuid import uuid4
import subprocess
from utils import executar_comando_sync, sanitize_input

app = Flask(__name__)
socketio = SocketIO(app)
SCRIPT_PATH = os.path.join(
    os.environ["USERPROFILE"], "Downloads", "projeto-frida-web", "static", "js"
)


def executar_comando(comando, sid):
    try:
        process = subprocess.Popen(
            comando,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        for linha in iter(process.stdout.readline, ""):
            if linha:
                # Emitir a saída do comando para o frontend
                socketio.emit("output", {"data": linha}, to=sid)
        process.stdout.close()
        process.wait()
    except Exception as e:
        # Emitir erros ao frontend
        socketio.emit("output", {"data": f"Erro ao executar o comando: {e}\n"}, to=sid)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/listar_dispositivos", methods=["GET"])
def listar_dispositivos():
    stdout, stderr = executar_comando_sync("adb devices")
    if stderr:
        return jsonify({"error": stderr}), 500
    dispositivos = [line.split()[0] for line in stdout.splitlines()[1:] if line.strip()]
    return jsonify(dispositivos)


@app.route("/listar_pacotes", methods=["POST"])
def listar_pacotes():
    dispositivo = request.json.get("dispositivo")
    try:
        dispositivo = sanitize_input(dispositivo)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    comando = f"adb -s {dispositivo} shell pm list packages -3"
    stdout, stderr = executar_comando_sync(comando)
    if stderr:
        return jsonify({"error": stderr}), 500
    pacotes = [line.replace("package:", "") for line in stdout.splitlines()]
    return jsonify(pacotes)


@app.route("/executar_frida", methods=["POST"])
def executar_frida():
    dispositivo = request.json.get("dispositivo")
    pacote = request.json.get("pacote")
    scripts = request.json.get("scripts", [])
    sid = request.json.get("sid")

    if not dispositivo or not pacote or not scripts:
        return jsonify({"error": "Dados insuficientes"}), 400

    try:
        dispositivo = sanitize_input(dispositivo)
        pacote = sanitize_input(pacote)
        comandos_scripts = " ".join(
            [f"-l {os.path.join(SCRIPT_PATH, script)}" for script in scripts]
        )
        comando = f"frida -D {dispositivo} -f {pacote} {comandos_scripts}"
        print(f"Comando executado: {comando}")  # Log do comando
        thread = threading.Thread(target=executar_comando, args=(comando, sid))
        thread.start()
        return jsonify({"message": "Comando Frida em execução"})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", debug=False)  # debug desativado em produção
