from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import subprocess
import os
import threading
from uuid import uuid4

app = Flask(__name__)
socketio = SocketIO(app)
# l\Downloads\projeto-frida-web-v3\projeto-frida-web\static\js
SCRIPT_PATH = os.path.join(os.environ['USERPROFILE'], 'Downloads', 'projeto-frida-web', 'static', 'js')

def executar_comando(comando, sid):
    try:
        process = subprocess.Popen(comando, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for linha in iter(process.stdout.readline, ''):
            if linha:
                socketio.emit('output', {'data': linha}, to=sid)
        process.stdout.close()
        process.wait()
    except Exception as e:
        socketio.emit('output', {'data': f"Erro ao executar o comando: {e}\n"}, to=sid)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/listar_dispositivos', methods=['GET'])
def listar_dispositivos():
    stdout, stderr = executar_comando_sync('adb devices')
    if stderr:
        return jsonify({'error': stderr}), 500
    dispositivos = [line.split()[0] for line in stdout.splitlines()[1:] if line.strip()]
    return jsonify(dispositivos)

@app.route('/listar_pacotes', methods=['POST'])
def listar_pacotes():
    dispositivo = request.json.get('dispositivo')
    if not dispositivo:
        return jsonify({'error': 'Dispositivo não selecionado'}), 400
    comando = f'adb -s {dispositivo} shell pm list packages -3'
    stdout, stderr = executar_comando_sync(comando)
    if stderr:
        return jsonify({'error': stderr}), 500
    pacotes = [line.replace('package:', '') for line in stdout.splitlines()]
    return jsonify(pacotes)

@app.route('/executar_frida', methods=['POST'])
def executar_frida():
    dispositivo = request.json.get('dispositivo')
    pacote = request.json.get('pacote')
    scripts = request.json.get('scripts', [])
    sid = request.json.get('sid')

    if not dispositivo or not pacote or not scripts:
        return jsonify({'error': 'Dados insuficientes'}), 400

    comandos_scripts = " ".join([f"-l {os.path.join(SCRIPT_PATH, script)}" for script in scripts])
    comando = f"frida -D {dispositivo} -f {pacote} {comandos_scripts}"
    thread = threading.Thread(target=executar_comando, args=(comando, sid))
    thread.start()
    return jsonify({'message': 'Comando Frida em execução'})

@app.route('/definir_proxy', methods=['POST'])
def definir_proxy():
    dispositivo = request.json.get('dispositivo')
    host = request.json.get('host')
    port = request.json.get('port')
    sid = request.json.get('sid')

    if not dispositivo or not host or not port:
        return jsonify({'error': 'Dados insuficientes'}), 400

    try:
        comandos = [
            f'adb -s {dispositivo} shell "su -c \'settings put global http_proxy {host}:{port}\'"',
            f'adb -s {dispositivo} shell "su -c \'settings put global global_http_proxy_host {host}\'"',
            f'adb -s {dispositivo} shell "su -c \'settings put global global_http_proxy_port {port}\'"',
            f'adb -s {dispositivo} shell "su -c \'settings put global global_http_proxy_exclusion_list ""\'"'
        ]
        
        for comando in comandos:
            stdout, stderr = executar_comando_sync(comando)
            if stderr:
                socketio.emit('output', {'data': stderr}, to=sid)
        
        return jsonify({'message': 'Proxy definido com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/reboot_device', methods=['POST'])
def reboot_device():
    dispositivo = request.json.get('dispositivo')
    if not dispositivo:
        return jsonify({'error': 'Dispositivo não selecionado'}), 400

    try:
        comando = f'adb -s {dispositivo} reboot'
        stdout, stderr = executar_comando_sync(comando)
        if stderr:
            return jsonify({'error': stderr}), 500
        return jsonify({'message': 'Dispositivo reiniciado com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/adb_reverse', methods=['POST'])
def adb_reverse():
    dispositivo = request.json.get('dispositivo')
    if not dispositivo:
        return jsonify({'error': 'Dispositivo não selecionado'}), 400

    try:
        comando = f'adb -s {dispositivo} reverse tcp:8080 tcp:8008'
        stdout, stderr = executar_comando_sync(comando)
        if stderr:
            return jsonify({'error': stderr}), 500
        return jsonify({'message': 'Reverso aplicado com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/adb_screencap', methods=['POST'])
def adb_screencap():
    dispositivo = request.json.get('dispositivo')
    if not dispositivo:
        return jsonify({'error': 'Dispositivo não selecionado'}), 400

    try:
        comando = f'adb -s {dispositivo} shell screencap -p /sdcard/{uuid4()}.png'
        stdout, stderr = executar_comando_sync(comando)
        if stderr:
            return jsonify({'error': stderr}), 500
        return jsonify({'message': 'Captura realizada com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/adb_screenrecord', methods=['POST'])
def adb_screenrecord():
    dispositivo = request.json.get('dispositivo')
    if not dispositivo:
        return jsonify({'error': 'Dispositivo não selecionado'}), 400

    try:
        comando = f'adb -s {dispositivo} shell screenrecord /sdcard/{uuid4()}.mp4'
        stdout, stderr = executar_comando_sync(comando)
        if stderr:
            return jsonify({'error': stderr}), 500
        return jsonify({'message': 'Gravação Iniciada'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/adb_shell_ls', methods=['POST'])
def adb_shell_ls():
    dispositivo = request.json.get('dispositivo')
    if not dispositivo:
        return jsonify({'error': 'Dispositivo não selecionado'}), 400
    comando = f'adb -s {dispositivo} shell su -c ls /sdcard'
    stdout, stderr = executar_comando_sync(comando)
    if stderr:
        return jsonify({'error': stderr}), 500
    files = [line.replace('package:', '') for line in stdout.splitlines()]
    return jsonify(files)
    

def executar_comando_sync(comando):
    try:
        process = subprocess.Popen(comando, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        return stdout, stderr
    except Exception as e:
        return '', str(e)

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", debug=True)
