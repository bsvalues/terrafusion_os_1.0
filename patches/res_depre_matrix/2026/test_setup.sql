-- Schema Setup for Validation
CREATE TABLE IF NOT EXISTS RES_depre_matrix (
    segment TEXT,
    axis_type TEXT,
    axis_value TEXT,
    factor REAL,
    last_modified TIMESTAMP,
    modification_source TEXT
);

-- Seed Initial Data (matching "current" values from report)
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('POOR', 'age', '70', 80.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('POOR', 'age', '999', 80.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('POOR', 'age', '75', 80.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '60', 90.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '999', 90.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '75', 90.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '70', 90.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('POOR', 'age', '60', 70.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '50', 85.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('BLN', 'age', '999', 65.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('BLN', 'age', '75', 65.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('POOR', 'age', '50', 65.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '45', 80.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('BLN', 'age', '70', 60.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('BLN', 'age', '50', 55.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('POOR', 'age', '45', 60.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('NML', 'age', '999', 50.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('VPO', 'age', '0', 15.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('BLN', 'age', '60', 55.0);
INSERT INTO RES_depre_matrix (segment, axis_type, axis_value, factor) VALUES ('BLN', 'age', '45', 50.0);
