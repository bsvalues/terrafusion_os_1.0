SELECT base_dir from pacs_objects WHERE type = 'AUDIO'
SELECT base_dir from pacs_objects WHERE type = 'EVENT'
SELECT base_dir from pacs_imaging
SELECT cold_location from pacs_system
SELECT distribution_path from pacs_system
SELECT export_path from pacs_system
SELECT letter_path from pacs_system
SELECT label_printer_name from pacs_system
SELECT face_map_path from pacs_system
--SELECT report_path from pacs_system
SELECT mineral_import_format_file_path from pacs_system
--SELECT appraisal_import_format_file_path from pacs_system
--SELECT payment_import_format_file_path from pacs_system
--SELECT ms_mvp_reference_file_path from pacs_system
--SELECT appraisal_notice_pdf_import_format_file_path from pacs_system
SELECT location as GIS_PATHS from gis
SELECT TOP 5 location as IMAGES from pacs_image WHERE location IS NOT NULL
SELECT TOP 5 image_path as PROPERTY_VAL_IMAGES from property_val WHERE image_path IS NOT NULL