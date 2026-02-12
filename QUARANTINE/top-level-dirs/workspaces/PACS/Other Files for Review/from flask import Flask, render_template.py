from flask import Flask, render_template, request, redirect, url_for, send_file
import os
from werkzeug.utils import secure_filename
from lxml import etree
import csv

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = './uploads'
app.config['ALLOWED_EXTENSIONS'] = {'csv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return 'No file part'
    file = request.files['file']
    if file.filename == '':
        return 'No selected file'
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        # Process the file here
        xml_path = process_csv_to_xml(file_path)
        return send_file(xml_path, as_attachment=True)
    return 'Invalid file type'

def process_csv_to_xml(csv_path):
    # Placeholder function for processing
    xml_path = os.path.splitext(csv_path)[0] + '.xml'
    root = etree.Element("Items")
    with open(csv_path, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            item = etree.SubElement(root, "Item")
            for key, value in row.items():
                etree.SubElement(item, key).text = value
    tree = etree.ElementTree(root)
    tree.write(xml_path, pretty_print=True, xml_declaration=True, encoding="UTF-8")
    return xml_path

if __name__ == '__main__':
    app.run(debug=True)
