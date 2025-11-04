CREATE TABLE [dbo].[workstation_configuration] (
    [computer_name]                           VARCHAR (255) NOT NULL,
    [has_validator]                           INT           NOT NULL,
    [validator_com_port]                      CHAR (10)     NULL,
    [has_barcode_reader]                      INT           NOT NULL,
    [has_cash_drawer]                         INT           NULL,
    [cash_drawer_com_port]                    CHAR (10)     NULL,
    [validate]                                INT           NULL,
    [rpt1_printer_name]                       VARCHAR (255) NULL,
    [rpt1_in_duplex]                          INT           NULL,
    [rpt1_bin_name]                           VARCHAR (22)  NULL,
    [rpt1_bin]                                INT           NULL,
    [rpt1_port_name]                          VARCHAR (255) NULL,
    [rpt1_driver_name]                        VARCHAR (255) NULL,
    [rpt2_printer_name]                       VARCHAR (255) NULL,
    [rpt2_in_duplex]                          INT           NULL,
    [rpt2_bin]                                INT           NULL,
    [rpt2_bin_name]                           CHAR (22)     NULL,
    [rpt2_port_name]                          VARCHAR (255) NULL,
    [rpt2_driver_name]                        VARCHAR (255) NULL,
    [rpt3_printer_name]                       CHAR (255)    NULL,
    [rpt3_in_duplex]                          INT           NULL,
    [rpt3_bin]                                INT           NULL,
    [rpt3_bin_name]                           VARCHAR (22)  NULL,
    [rpt3_port_name]                          VARCHAR (255) NULL,
    [rpt3_driver_name]                        VARCHAR (255) NULL,
    [default_printer_name]                    VARCHAR (255) NULL,
    [default_in_duplex]                       INT           NULL,
    [default_bin]                             INT           NULL,
    [default_bin_name]                        VARCHAR (22)  NULL,
    [default_port_name]                       VARCHAR (255) NULL,
    [default_driver_name]                     VARCHAR (255) NULL,
    [open_cash_drawer]                        VARCHAR (30)  NULL,
    [default_tab]                             VARCHAR (1)   NULL,
    [use_pos_receipt_printer]                 BIT           CONSTRAINT [CDF_workstation_configuration_use_pos_receipt_printer] DEFAULT ((0)) NOT NULL,
    [pos_receipt_printer_device_name]         VARCHAR (50)  NULL,
    [use_pos_slip_printer]                    BIT           CONSTRAINT [CDF_workstation_configuration_use_pos_slip_printer] DEFAULT ((0)) NOT NULL,
    [pos_slip_printer_name]                   VARCHAR (50)  NULL,
    [pos_slip_print_reverse_side]             BIT           CONSTRAINT [CDF_workstation_configuration_pos_slip_print_reverse_side] DEFAULT ((0)) NOT NULL,
    [pos_slip_exclude_tax_statements]         BIT           CONSTRAINT [CDF_workstation_configuration_pos_slip_exclude_tax_statements] DEFAULT ((0)) NOT NULL,
    [pos_slip_barcode_for_excise]             BIT           CONSTRAINT [CDF_workstation_configuration_pos_slip_barcode_for_excise] DEFAULT ((0)) NOT NULL,
    [pos_slip_barcode_format]                 VARCHAR (50)  NULL,
    [use_pos_check_validation_printer]        BIT           CONSTRAINT [CDF_workstation_configuration_use_pos_check_validation_printer] DEFAULT ((0)) NOT NULL,
    [pos_check_validation_printer_name]       VARCHAR (50)  NULL,
    [pos_check_validation_print_reverse_side] BIT           CONSTRAINT [CDF_workstation_configuration_pos_check_validation_print_reverse_side] DEFAULT ((0)) NOT NULL,
    [slip_margin_left]                        INT           NULL,
    [slip_margin_top]                         INT           NULL,
    [scan]                                    BIT           CONSTRAINT [CDF_workstation_configuration_scan] DEFAULT ((0)) NOT NULL,
    [use_ranger]                              BIT           CONSTRAINT [CDF_workstation_configuration_use_ranger] DEFAULT ((0)) NOT NULL,
    [ranger_check_scanner_name]               VARCHAR (255) NULL,
    [ranger_scan]                             BIT           CONSTRAINT [CDF_workstation_configuration_ranger_scan] DEFAULT ((0)) NOT NULL,
    [ranger_validate]                         BIT           CONSTRAINT [CDF_workstation_configuration_ranger_validate] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_workstation_configuration] PRIMARY KEY CLUSTERED ([computer_name] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Should scanning be enabled by default in payment dialogs?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'scan';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not Tax Statement are excluded from the slip validation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_slip_exclude_tax_statements';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Is a ranger-compatible check scanner connected?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'use_ranger';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not Tax Statement are excluded from the slip validation', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_slip_barcode_for_excise';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Cached name of the attached Ranger check scanner', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'ranger_check_scanner_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Barcode Format used on the slip brinter', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_slip_barcode_format';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not to use the POS Receipt printer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'use_pos_check_validation_printer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not to use the POS Receipt printer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'use_pos_receipt_printer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Name of POS Check Validation Printer device', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_check_validation_printer_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Name of POS Receipt printer device', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_receipt_printer_device_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Is a ranger-compatible check scanner connected?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'ranger_scan';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Print of the reverse side of the check', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_check_validation_print_reverse_side';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not to use the POS Slip printer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'use_pos_slip_printer';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Is a ranger-compatible check scanner connected?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'ranger_validate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates the the distance from the left edge of the slip to print slip validation output in multiples of 0.001 inches', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'slip_margin_left';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Name of POS Slip Printer device', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_slip_printer_name';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates the the distance from the top edge of the slip to print slip validation output in multiples of 0.001 inches', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'slip_margin_top';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Print of the reverse side of the slip', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'workstation_configuration', @level2type = N'COLUMN', @level2name = N'pos_slip_print_reverse_side';


GO

