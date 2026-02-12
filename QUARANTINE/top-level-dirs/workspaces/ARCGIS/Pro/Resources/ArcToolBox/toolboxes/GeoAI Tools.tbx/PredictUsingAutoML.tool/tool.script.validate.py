class ToolValidator:
	# Class to add custom behavior and properties to the tool and tool parameters.

	def __init__(self):
		# set self.params for use in other function
		self.params = arcpy.GetParameterInfo()

	def initializeParameters(self):
		# Customize parameter properties.
		# This gets called when the tool is opened.
		return

	def updateParameters(self):
		# Modify parameter values and properties.
		# This gets called each time a parameter is modified, before
		# standard validation.
		if self.params[2].value:
			from pathlib import Path
			# import os
			if not self.params[5].altered:
				try:
					param_2 = self.params[2].value
					in_feat = str(self.params[2].value).split('.', 1)[0].split('\\', 1)[0]
					in_feat = ''.join(e for e in in_feat if e.isalnum())
					in_feat = in_feat + '_out_feature'
					for i in range(100):
						in_feat_iter = in_feat + "_" + str(i)
						feature_name = Path(arcpy.env.workspace, in_feat_iter)
						if arcpy.Exists(feature_name):
							pass
						else:
							break
				except:
					in_feat = 'predictions'
				if str(self.params[1].value) == 'PREDICT_FEATURE':
					self.params[5].value = in_feat_iter
					self.params[6].value = None

		if self.params[2].value:
			if not self.params[6].altered:
				try:
					in_feat = str(self.params[2].value).split('.', 1)[0].split('\\', 1)[0]
					in_feat = ''.join(e for e in in_feat if e.isalnum())
				except:
					in_feat = 'predictions'
				if str(self.params[1].value) == 'PREDICT_RASTER':
					self.params[6].value = in_feat + '_out_raster'
					self.params[5].value = None

		if self.params[2].value:
			try:

				if not self.params[7].altered:
					fields = []
					data_type = arcpy.Describe(self.params[2].value).dataType
					if data_type in ["ShapeFile", "FeatureLayer", "FeatureClass", "TableView", "TextFile"]:
						data_obj = arcpy.Describe(self.params[2].value)
						try:
							datasource = data_obj.catalogPath
						except:
							datasource = self.params[0].value
						fields = [f.name for f in arcpy.ListFields(datasource)]
					if self.params[0].value:
						import zipfile
						import json
						from zipfile import ZipFile
						with ZipFile(str(self.params[0].value)) as zf:
							for file in zf.namelist():
								if file.endswith('.emd'):  # optional filtering by filetype
									with zf.open(file) as f:
										data = json.loads(f.read())
						if "_feature_field_variables" in data:
							train_feature_fields = data['_feature_field_variables']
							# if self.params[7].value:
							list_to_update = []
							for cnt, par in enumerate(train_feature_fields):
								pred_var = None
								train_var = par
								if train_var in fields:
									pred_var = train_var
								list_to_update.append([pred_var, train_var])
							self.params[7].value = list_to_update
				if not self.params[9].altered:
					if self.params[3].value:
						if self.params[0].value:
							import zipfile
							import json
							from zipfile import ZipFile
							with ZipFile(str(self.params[0].value)) as zf:
								for file in zf.namelist():
									if file.endswith('.emd'):  # optional filtering by filetype
										with zf.open(file) as f:
											data = json.loads(f.read())
							if "_raster_field_variables" in data:
								train_raster_fields = data['_raster_field_variables']
								# if self.params[7].value:
								list_to_update = []
								for cnt, par in enumerate(train_raster_fields):
									pred_var = None
									train_var = par
									list_to_update.append([pred_var, train_var])
								self.params[9].value = list_to_update
			except:
				pass

		if arcpy.CheckExtension("Spatial") != "Available":
			self.params[3].enabled = False
			self.params[6].enabled = False
			self.params[9].enabled = False
			self.params[1].filter.list = ['PREDICT_FEATURE']

		if str(self.params[1].value) == 'PREDICT_RASTER':
			self.params[2].enabled = True
			self.params[4].enabled = False
			self.params[5].enabled = False
			self.params[6].enabled = True
			self.params[7].enabled = False
			self.params[8].enabled = False
		else:
			self.params[2].enabled = True
			self.params[4].enabled = True
			self.params[6].enabled = False
			self.params[5].enabled = True
			self.params[7].enabled = True
			self.params[8].enabled = True
		return

	def updateMessages(self):
		# Customize messages for the parameters.
		# This gets called after standard validation.
		if self.params[0].value:
			if self.params[2].value:
				import zipfile
				import json
				from zipfile import ZipFile
				from arcgis.learn._utils.common import _get_emd_path, check_path_or_url, _get_hosted_dlpk
				dlpk_path = str(self.params[0].value)
				is_hosted_dlpk = check_path_or_url(dlpk_path)
				if is_hosted_dlpk:
					success, dlpk_path = _get_hosted_dlpk(dlpk_path)

				with ZipFile(dlpk_path) as zf:
					for file in zf.namelist():
						if file.endswith('.emd'):  # optional filtering by filetype
							with zf.open(file) as f:
								data = json.loads(f.read())
				if "image_variables" in data:
					self.params[2].clearMessage()
					desc = arcpy.Describe(self.params[2].value)
					data_type = desc.dataType
					try:
						data_source = desc.catalogPath
					except:
						data_source = self.params[2].value

					if ((data_source.find('https') == 0) and (data_type != 'TableView')):
						try:
							from arcgis.features import FeatureLayer
							featureLayer = FeatureLayer(data_source)
							if not featureLayer.properties.hasAttachments:
								self.params[2].setIDMessage("ERROR", 260277)
							else:
								self.params[2].clearMessage()
						except:
							self.params[2].setIDMessage("ERROR", 260278)
					elif data_type in ["ShapeFile", "FeatureLayer", "FeatureClass"]:
						inTable = desc.name + '__ATTACH'
						try:
							from arcpy import da
							with da.SearchCursor(inTable, ['DATA', 'ATT_NAME', 'ATTACHMENTID']) as cursor:
								pass
							self.params[2].clearMessage()
						except:
							self.params[2].setIDMessage("ERROR", 260277)
					else:
						self.params[2].clearMessage()

		if self.params[3].value:
			if self.params[2].value:
				try:
					data_type = arcpy.Describe(self.params[2].value).dataType
				except:
					pass
				if ('data_type' in locals() and data_type in ["Table", "TableView"]):
					self.params[3].setIDMessage("ERROR", 260123)

		if self.params[1].value:
			if self.params[1].value in ['PREDICT_RASTER']:
				self.params[1].setIDMessage("WARNING", 260066)
				if not self.params[3].value:
					self.params[3].setIDMessage("ERROR", 260142)
				else:
					self.params[3].clearMessage()

		if self.params[6].value:
			import os.path
			filename = str(self.params[6].value) + ".tif"
			if os.path.exists(filename):
				self.params[6].setIDMessage("ERROR", 1005)

		if self.params[7].value:
			for cnt, par in enumerate(self.params[7].value):
				pred_var = par[0]
				train_var = par[1]
				if not train_var:
					self.params[7].setIDMessage("ERROR", 260153)
				try:
					if len(str(pred_var)) == 0:
						self.params[7].setIDMessage("WARNING", 260202)
				except:
					pass

		if self.params[8].value:
			for cnt, par in enumerate(self.params[8].value):
				pred_var = par[0]
				train_var = par[1]
				if not train_var:
					self.params[8].setIDMessage("ERROR", 260153)

		if self.params[9].value:
			for cnt, par in enumerate(self.params[9].value):
				pred_var = par[0]
				train_var = par[1]
				if not train_var:
					self.params[9].setIDMessage("ERROR", 260153)
				try:
					if len(str(pred_var)) == 0:
						self.params[9].setIDMessage("WARNING", 260202)
				except:
					pass
		return
