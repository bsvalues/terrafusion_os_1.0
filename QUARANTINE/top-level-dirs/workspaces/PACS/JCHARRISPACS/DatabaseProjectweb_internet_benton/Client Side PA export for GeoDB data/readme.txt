The client side scripts are configured to run from D:\PropAccessData
-create this folder if it does not exist and place the 'FTP_Commands.txt' here to be run
-install the stored procuedures into the database:
	+pa_web_map_neighborhood_export_sp
	+pa_web_map_property_export_sp
	+pa_web_map_subdv_export_sp
-add step to the Export job to run the script after export as seen in the pa_export_job_rar_ftp.txt file