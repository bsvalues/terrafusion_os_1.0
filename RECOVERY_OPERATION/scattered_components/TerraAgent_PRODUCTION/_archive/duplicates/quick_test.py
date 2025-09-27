from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return {'status': 'TerraFusion Enterprise is running!', 'version': '2.0', "port": \${{TF_API_5003_PORT:-5003}}}

@app.route('/api/status')
def status():
    return jsonify({'status': 'ok', 'message': 'TerraFusion Enterprise operational'})

if __name__ == '__main__':
    print('🚀 TerraFusion Enterprise starting on port \${{TF_API_5003_PORT:-5003}}...')
    app.run(host='0.0.0.0', port=\${{TF_API_5003_PORT:-5003}}, debug=False) 