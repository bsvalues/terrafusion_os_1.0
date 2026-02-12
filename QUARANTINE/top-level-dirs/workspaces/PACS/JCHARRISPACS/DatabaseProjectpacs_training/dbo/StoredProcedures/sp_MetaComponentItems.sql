
CREATE PROCEDURE dbo.sp_MetaComponentItems
    @production_mode bit,
    @build int
AS
SET NOCOUNT ON

-- DO NOT REMOVE the following declaration
declare @component_level_id int
declare @component_id int
declare @top_display_order int -- This variable is set to maintain the order of the root level menu.
set @top_display_order = 0
declare @temp_level_id int
declare @temp2_level_id int
declare @tools_parent_level_id int

-- The production mode bit should be modified by the sql script generator when delivering a release
-- version of the update notes to a value of 1 to prevent the "test" only items from appearing in
-- the menus.
--declare @production_mode bit -- now a parameter
-- The entity valid bit should be modified by the script generator when delivering a release
-- where entity is not valid for that distribution. 1 = valid, anything else is not valid.
declare @entity_valid bit

--declare @build int -- now a parameter
--set @build = 0 -- washington

if @build = 0 -- washington
begin
	set @entity_valid = 0
end
if @build = 1 -- texas
begin
	set @entity_valid = 1
end

-- All items must be cleared before running this file.
exec sp_ClearMetaComponents
/***************************************************************************************************/
/**                                   DO NOT REMOVE (ABOVE)                                       **/
/***************************************************************************************************/

/***************************************************************************************************/
/** Application Menu ------------------------------------------------------------------------------*/
/***************************************************************************************************/
-- FILE MENU ----------------------------------------------------------------------------------------
exec sp_AddMetaComponentLevel 'File', 'Main File Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @file_level_id int
set @file_level_id = @component_level_id
	exec sp_AddMetaComponentLevel 'New', 'Create new pacs objects.', 0, null, null, @file_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		declare @file_new_display_order int
		set @file_new_display_order = 0
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Agent', 'New Agent', @file_new_display_order, 0, 520, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Agent Roles
			exec sp_AddMetaComponentRights @component_id, 0, 322 -- Agent Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Attorney', 'New Attorney', @file_new_display_order, 0, 528, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Attorney Roles
			exec sp_AddMetaComponentRights @component_id, 0, 323 -- Atty Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Batch', 'New Batch', @file_new_display_order, 0, 25, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Batch Roles
			exec sp_AddMetaComponentRights @component_id, 0, 548 -- Batch Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Collector', 'New Collector', @file_new_display_order, 0, 28, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Collector Roles
			exec sp_AddMetaComponentRights @component_id, 0, 33 -- Collector Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Fee', 'New Fee', @file_new_display_order, 0, 27, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Fee Roles
			exec sp_AddMetaComponentRights @component_id, 0, 523 -- Fee Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Lawsuit', 'New Lawsuit', @file_new_display_order, 0, 621, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0' -- Assessor Roles
			exec sp_AddMetaComponentRights @component_id, 0, 371 -- Lawsuit Edit Rights
			exec sp_AddMetaComponentRights @component_id, 0, 372 -- Lawsuit View Rights			
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Litigation', 'New Litigation', @file_new_display_order, 0, 26, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Litigation Roles
			exec sp_AddMetaComponentRights @component_id, 0, 2203 -- Litigation Edit Rights
			exec sp_AddMetaComponentRights @component_id, 0, 2204 -- Litigation View Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Mortgage Company', 'New Mortgage Company', @file_new_display_order, 0, 519, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Mortgage Company Roles
			exec sp_AddMetaComponentRights @component_id, 0, 325
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Property', 'New Property', @file_new_display_order, 0, 355, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0' -- Property Roles
			exec sp_AddMetaComponentRights @component_id, 0, 326
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'REET', 'New REET', @file_new_display_order, 0, 371, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- REET Roles
			exec sp_AddMetaComponentRights @component_id, 0, 2242 -- REET Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Special Assessment', 'New Special Assessment', @file_new_display_order, 0, 22, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Special Assessment Roles
			exec sp_AddMetaComponentRights @component_id, 0, 526 -- Special Assessment Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Tax Area', 'New Tax Area', @file_new_display_order, 0, 23, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Tax Area Roles
			exec sp_AddMetaComponentRights @component_id, 0, 512 -- Tax Area Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Tax District', 'New Tax District', @file_new_display_order, 0, 24, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Tax District Roles
			exec sp_AddMetaComponentRights @component_id, 0, 507 -- Tax District Rights
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Taxpayer', 'New Taxpayer', @file_new_display_order, 0, 521, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Taxpayer Roles
			exec sp_AddMetaComponentRights @component_id, 0, 327
		set @file_new_display_order = @file_new_display_order + 1
		exec sp_AddMetaComponentLevel 'Taxserver', 'New Taxserver', @file_new_display_order, 0, 518, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Taxserver Roles
			exec sp_AddMetaComponentRights @component_id, 0, 31 

-- ACTIVITIES MENU ----------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Activities', 'Activities Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @activity_level_id int
set @activity_level_id = @component_level_id
declare @activity_display_order int
set @activity_display_order = 0
	exec sp_AddMetaComponentLevel 'Accounting', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Chart of Accounts...', null, 0, 0, 110, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2151 -- Chart of Accounts Rights
		exec sp_AddMetaComponentLevel 'Distributions', null, 1, 0, 273, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1102
			exec sp_AddMetaComponentRights @component_id, 0, 1103
			exec sp_AddMetaComponentRights @component_id, 0, 1105
		exec sp_AddMetaComponentLevel 'Disbursements...', null, 2, 0, 111, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1002
		exec sp_AddMetaComponentLevel 'Refund Disbursements...', null, 3, 0, 112, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1002
		exec sp_AddMetaComponentLevel 'Close/Reopen Month', null, 4, 0, 158, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 2219
		exec sp_AddMetaComponentLevel 'General Journal Entry', null, 5, 0, 275, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2152 -- General Journal Entry Rights
		exec sp_AddMetaComponentLevel 'Close Out Revenue Accounts', null, 6, 0, 276, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1005
		exec sp_AddMetaComponentLevel 'Transfer Funds', null, 7, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Tax Districts...', 'Transfer funds for Tax Districts', 0, 0, 397, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 2153 -- ransfer Funds Rights
			exec sp_AddMetaComponentLevel 'Special Assessments...', 'Transfer funds for Special Assessments', 1, 0, 398, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 2153 -- ransfer Funds Rights
		exec sp_AddMetaComponentLevel 'Accounting Event Mapping', null, 8, 0, 277, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2224
		exec sp_AddMetaComponentLevel 'Validate Event Mapping', null, 9, 0, 278, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Copy Event Mapping - Tax District', null, 10, 0, 279, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1010
		exec sp_AddMetaComponentLevel 'Copy Event Mapping - Special Assessments', null, 11, 0, 280, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1010
		exec sp_AddMetaComponentLevel 'AP Import', null, 12, 0, 289, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1002
		exec sp_AddMetaComponentLevel 'Import Vendors', null, 13, 0, 290, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 1016

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Administration', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		declare @admin_display_order int
		set @admin_display_order = 0
		exec sp_AddMetaComponentLevel 'Treasurer Rollover', null, @admin_display_order, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Fiscal Year Rollover', null, 0, 0, 113, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 2221
			exec sp_AddMetaComponentLevel 'Move System to New Collection Year', null, 1, 0, 114, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 2278
		if @entity_valid = 1
		begin
		set @admin_display_order = @admin_display_order + 1
		exec sp_AddMetaComponentLevel 'Year End Procedures', null, @admin_display_order, 0, 30, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 346
		end
		set @admin_display_order = @admin_display_order + 1
		exec sp_AddMetaComponentLevel 'Certification', null, @admin_display_order, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Certify Appraisal Roll', null, 0, 0, 115, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 343
			exec sp_AddMetaComponentLevel 'Undo Certify System', null, 1, 0, 282, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 343
			exec sp_AddMetaComponentLevel 'Create New Year Layer', null, 2, 0, 283, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 343
			exec sp_AddMetaComponentLevel 'Undo New Year Layer', null, 3, 0, 531, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 343
		set @admin_display_order = @admin_display_order + 1
		exec sp_AddMetaComponentLevel 'Future Year', null, @admin_display_order, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Create Future Year Layer', null, 0, 0, 116, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 413
			exec sp_AddMetaComponentLevel 'Work In Future Year Layer', null, 1, 0, 284, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 414
			exec sp_AddMetaComponentLevel 'Delete Future Year Layer', null, 2, 0, 117, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 413

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Annexations', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Annexation Configuration...', null, 0, 0, 143, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 1030 
		exec sp_AddMetaComponentLevel 'Annexation Maintenance...', null, 1, 0, 142, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Appraisal Cards', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Print All Properties', null, 0, 0, 533, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 334
		exec sp_AddMetaComponentLevel 'Print User Defined', null, 1, 0, 534, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 334
		exec sp_AddMetaComponentLevel 'Print Using Query', null, 2, 0, 535, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 334
		exec sp_AddMetaComponentLevel 'Print by Abstract Subdivision', null, 3, 0, 536, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 334
		if @entity_valid = 1
		begin			
		exec sp_AddMetaComponentLevel 'Print by Entity', null, 4, 0, 537, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		end	
		exec sp_AddMetaComponentLevel 'Print by GEO ID', null, 5, 0, 538, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'			
		exec sp_AddMetaComponentLevel 'Print by Map ID', null, 6, 0, 539, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'			
		exec sp_AddMetaComponentLevel 'Print by Mobile Home Park', null, 7, 0, 540, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		exec sp_AddMetaComponentLevel 'Print by Neighborhood', null, 8, 0, 541, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		exec sp_AddMetaComponentLevel 'Print by Owner', null, 9, 0, 542, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		exec sp_AddMetaComponentLevel 'Print by Property Group', null, 10, 0, 543, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		exec sp_AddMetaComponentLevel 'Print by Property List', null, 11, 0, 544, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		exec sp_AddMetaComponentLevel 'Print by Ref1 ID', null, 12, 0, 545, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		exec sp_AddMetaComponentLevel 'Print by Ref2 ID', null, 13, 0, 546, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Appraisal Notices', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Configuration Maintenance', null, 0, 0, 350, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 342
		exec sp_AddMetaComponentLevel 'Appraisal Notice Maintenance', null, 1, 0, 218, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 342
		exec sp_AddMetaComponentLevel 'Capture BOE Submission Values', null, 2, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Capture Values...', null, 0, 0, 357, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 342
			exec sp_AddMetaComponentLevel 'Print BOE Submission Totals', null, 1, 0, 352, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 342
			exec sp_AddMetaComponentLevel 'Print Non Captured BOE Values', null, 2, 0, 353, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 342
			exec sp_AddMetaComponentLevel 'Undo Capture Values...', null, 3, 0, 358, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 342
		exec sp_AddMetaComponentLevel 'Forms Maintenance...', null, 3, 0, 354, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 342

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'BOE', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'BOE Quick Image', null, 0, 0, 141, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'
				--exec sp_AddMetaComponentRights @component_id, 0, 2175 Rights were split out
		exec sp_AddMetaComponentLevel 'Individual Letter', null, 1, 0, 140, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'
				--exec sp_AddMetaComponentRights @component_id, 0, 2174 Rights were split out 
		exec sp_AddMetaComponentLevel 'Inquiry', null, 2, 0, 138, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2'
				exec sp_AddMetaComponentRights @component_id, 0, 41  -- Inquiry
				exec sp_AddMetaComponentRights @component_id, 0, 2280  -- Inquiry
		exec sp_AddMetaComponentLevel 'Protest', null, 3, 0, 139, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '2, 3' -- ARB -> Protest Roles
				exec sp_AddMetaComponentRights @component_id, 0, 40  -- Protest
				exec sp_AddMetaComponentRights @component_id, 0, 2281  -- Protest
		if @production_mode = 0
		begin
			--Removed for Washington per Sarah Brenner.  Leaving in place for texas.
			exec sp_AddMetaComponentLevel 'NOP Multi Prop Letter Processing', null, 4, 0, 364, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'
					exec sp_AddMetaComponentRights @component_id, 0, 2176
		end

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Comparables', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Commercial Comparables', null, 0, 0, 33, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2131 -- Comparable Property
		exec sp_AddMetaComponentLevel 'Land Comparables', null, 1, 0, 32, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2131 -- Comparable Property
		exec sp_AddMetaComponentLevel 'Residential Comparables', null, 2, 0, 31, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2131 -- Comparable Property
			
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Daily Process', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Change Posting Date', null, 0, 0, 37, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2157
		exec sp_AddMetaComponentLevel 'Cash Drawers', null, 1, 0, 34, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 501
		exec sp_AddMetaComponentLevel 'Close/Reopen Day', null, 2, 0, 36, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2220
		exec sp_AddMetaComponentLevel 'Enter Payment Batch', null, 3, 0, 35, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2226
		--Batch History is a Data Validation item, not Daily Processing 
		exec sp_AddMetaComponentLevel 'Batch History', null, 4, 0, 38, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 43
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Delinquent Notice', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Delinquent Notice Maintenance', null, 0, 0, 39, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Print Delinquent Notice', null, 1, 0, 40, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2182
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentRights @component_id, 0, 2182
	exec sp_AddMetaComponentLevel 'Exemption Process', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Enter Exemptions', null, 0, 0, 41, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 107

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Forms Processing', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		if @production_mode = 0
		begin
		exec sp_AddMetaComponentLevel 'Forms Processing', null, 0, 0, 43, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		end
		exec sp_AddMetaComponentLevel 'Quick Image Scan', null, 1, 0, 42, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Generate Corrected Tax Statement(s)...', null, @activity_display_order, 0, 167, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2183
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'GIS', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'GIS Viewer / Appraiser', null, 0, 0, 45, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Import Land Characteristics', null, 1, 0, 46, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 25
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Levy', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Levy Certification', null, 0, 0, 211, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Capture Values...', null, 1, 0, 405, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 529
		exec sp_AddMetaComponentLevel 'Setup Aggregate Proration Order', null, 2, 0, 212, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Setup Constitutional Proration Order', null, 3, 0, 213, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Tax Statements', null, 4, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Create Tax Statements...', null, 0, 0, 402, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Create Tax Statements Roles
				exec sp_AddMetaComponentRights @component_id, 0, 2177
			exec sp_AddMetaComponentLevel 'Tax Statement Group', null, 1, 0, 217, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 2178

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Letter Processing', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Print Agent Letters...', null, 0, 0, 373, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Attorney Letters...', null, 1, 0, 374, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Refund Letters...', null, 2, 0, 622, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Mortgage Company Letters...', null, 3, 0, 376, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Owner Letters...', null, 4, 0, 377, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Payout Agreement Letters...', null, 5, 0, 380, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Print Property Letters...', null, 6, 0, 378, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Tax District Letters...', null, 7, 0, 375, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Print Taxserver Letters...', null, 8, 0, 379, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Mass Maintenance (Bills)', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Move Bills and Fees', null, 0, 0, 288, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 5543
		set @activity_display_order = @activity_display_order + 1
		exec sp_AddMetaComponentLevel 'Update Bill/Fee Codes on Bills', null, 1, 0, 166, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1073
			
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Mass Maintenance (Escrow)', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Mass Apply Escrow', null, 0, 0, 286, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1008	
			exec sp_AddMetaComponentRights @component_id, 0, 2245

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Mass Maintenance (Property)', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		declare @mm_display_level int
		set @mm_display_level = 0
		exec sp_AddMetaComponentLevel 'Activate Preliminary Properties', null, @mm_display_level, 0, 160, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2266 --rightMassMaintenanceActivatePrelimProperty
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Daily Batch', null, @mm_display_level, 0, 47, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 373
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'End of Day', null, @mm_display_level, 0, 159, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 6
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Mass Copy of Sale Land Maintenance', null, @mm_display_level, 0, 165, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2127
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Mass Create', null, @mm_display_level, 0, 49, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 425
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Mass Maintenance', null, @mm_display_level, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			set @temp2_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Mass Supplement', null, 0, 0, 361, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 380  -- Mass Update
				exec sp_AddMetaComponentRights @component_id, 0, 381  -- Mass Update Undo
				exec sp_AddMetaComponentRights @component_id, 0, 382  -- Mass Maintenance Admin
			exec sp_AddMetaComponentLevel 'Mass Update', null, 1, 0, 360, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 380
				exec sp_AddMetaComponentRights @component_id, 0, 381
				exec sp_AddMetaComponentRights @component_id, 0, 382
			exec sp_AddMetaComponentLevel 'Mass Update Land Miscellaneous Codes', null, 2, 0, 363, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 2126  -- Mass Update Land Miscellaneous Codes
				exec sp_AddMetaComponentRights @component_id, 0, 381
				exec sp_AddMetaComponentRights @component_id, 0, 382
			exec sp_AddMetaComponentLevel 'Mass Update Tax Area / Special Assessment', null, 3, 0, 362, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 380
				exec sp_AddMetaComponentRights @component_id, 0, 381
				exec sp_AddMetaComponentRights @component_id, 0, 382
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Mass Recalculation', null, @mm_display_level, 0, 164, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 379
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Mass Update Ownership/Agents', null, @mm_display_level, 0, 48, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentRights @component_id, 0, 380
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Quick Entry', null, @mm_display_level, 0, 161, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 378
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Special Assessment Quick Entry', null, @mm_display_level, 0, 163, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 2128
		set @mm_display_level = @mm_display_level + 1
		exec sp_AddMetaComponentLevel 'Update All Legal Descriptions', null, @mm_display_level, 0, 162, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentRights @component_id, 0, 380
			exec sp_AddMetaComponentRights @component_id, 0, 89

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Merge Properties', null, @activity_display_order, 0, 62, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 215

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Ownership Transfer', null, @activity_display_order, 0, 6, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0' -- Ownership Transfer Roles
			exec sp_AddMetaComponentRights @component_id, 0, 58

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Payment Import', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Imported Payment Files', null, 0, 0, 399, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2185 -- Import Payment Run Rights

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Payout Agreements', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Generate Special Assessment Payout Statements', null, 0, 0, 356, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'New Payout Agreement', null, 1, 0, 57, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 547 -- New Payout Agreement Rights

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Pending Split/Merge', null, @activity_display_order, 0, 381, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 215 -- A split/merge right

	if (@production_mode = 0)
	begin
	set @activity_display_order = @activity_display_order + 1	
	exec sp_AddMetaComponentLevel 'Penpad', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Penpad Maintenance', null, 0, 0, 525, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Penpad DSN Setup', null, 1, 0, 636, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Penpad Database Setup', null, 2, 0, 637, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
	end
	
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Posting', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Quick Post: Multiple Payments', null, 0, 0, 55, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2245 -- post payments
		exec sp_AddMetaComponentLevel 'Quick Post: Single Payment', null, 1, 0, 54, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2245 -- post payments
		exec sp_AddMetaComponentLevel 'Post Statement', null, 2, 0, 52, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2245 -- post payments
		exec sp_AddMetaComponentLevel 'Quick Search - Taxes Due', null, 3, 0, 53, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Generate Refunds - In Mass', null, 4, 0, 56, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2173

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Profiling', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Create Neighborhoods...', null, 0, 0, 223, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2279
		exec sp_AddMetaComponentLevel 'Create Profile...', null, 1, 0, 224, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2279
		exec sp_AddMetaComponentLevel 'Link Abstract/Subdivisions to Neighborhoods', null, 2, 0, 226, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2279
		exec sp_AddMetaComponentLevel 'Profile List...', null, 3, 0, 225, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2279

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Queries', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Launch Query Builder...', null, 0, 0, 370, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 14 --rightPACSQuery
		exec sp_AddMetaComponentLevel 'Query Viewer...', null, 1, 0, 369, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 14 --rightPACSQuery

	if @production_mode = 0
	begin
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Recalculate Value', null, @activity_display_order, 0, 64, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
	end

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Record Sales Confirmation', null, @activity_display_order, 0, 368, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 64 --rightRecordSales
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Rendition Processing', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Clear Rendition Penalty Flag', null, 0, 0, 171, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 263
		exec sp_AddMetaComponentLevel 'Penalty Waiver Letter', null, 1, 0, 168, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 403
		exec sp_AddMetaComponentLevel 'Personal Property Rendition', null, 2, 0, 60, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 263
		exec sp_AddMetaComponentLevel 'Print Rendition Penalty Letters', null, 3, 0, 170, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 400
		exec sp_AddMetaComponentLevel 'Request for Supporting Documents Letter', null, 4, 0, 169, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 404
		exec sp_AddMetaComponentLevel 'Set Rendition Penalty Flag', null, 5, 0, 172, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 263

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Sales', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Sales Confirmation Letters', null, 0, 0, 61, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2277 --rightActivitiesSalesConfirmationLetters
	if @production_mode = 0
	begin
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Set Appraiser', null, @activity_display_order, 0, 44, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
	end

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Special Assessment Import Run List', null, @activity_display_order, 0, 367, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Special Assessments', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Manually Create Bills...', null, 0, 0, 219, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2209
		exec sp_AddMetaComponentLevel 'Calculation Wizard', 'Special Assessment Calculation Wizard', 1, 0, 403, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1072
		exec sp_AddMetaComponentLevel 'Certify Special Assessment Year', null, 2, 0, 401, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 1101 -- Certify special assessment years
		exec sp_AddMetaComponentLevel 'Create Bills...', null, 3, 0, 220, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 540
		exec sp_AddMetaComponentLevel 'Undo Create Bills...', null, 4, 0, 221, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 541
		exec sp_AddMetaComponentLevel 'Activate Bills...', null, 5, 0, 222, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 542

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Split Property', null, @activity_display_order, 0, 287, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 215

	set @activity_display_order = @activity_display_order + 1	
	exec sp_AddMetaComponentLevel 'Supplement', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		declare @supplement_display_level int
		set @supplement_display_level = 0
		exec sp_AddMetaComponentLevel 'Supplement Group Maintenance', null, @supplement_display_level, 0, 176, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 554
		set @supplement_display_level = @supplement_display_level + 1
		exec sp_AddMetaComponentLevel 'Pending Supplement List', null, @supplement_display_level, 0, 178, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 455
		set @supplement_display_level = @supplement_display_level + 1
		exec sp_AddMetaComponentLevel 'Print Supplement Appraisal Notices', null, @supplement_display_level, 0, 175, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 396
		set @supplement_display_level = @supplement_display_level + 1
		exec sp_AddMetaComponentLevel 'Create Bills for Supplement Group', null, @supplement_display_level, 0, 174, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 554
		set @supplement_display_level = @supplement_display_level + 1
		exec sp_AddMetaComponentLevel 'Supplement Statement Maintenance', null, @supplement_display_level, 0, 173, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			exec sp_AddMetaComponentRights @component_id, 0, 2184
		

	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'U500 Process', null, @activity_display_order, 0, 285, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentRights @component_id, 0, 1025
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	if @production_mode = 0
	begin
	set @activity_display_order = @activity_display_order + 1
	exec sp_AddMetaComponentLevel 'Valuation', null, @activity_display_order, null, null, @activity_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Profiling', null, 0, 0, 63, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Current System Errors', null, 1, 0, 65, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
	end

-- REPORTS MENU -------------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Reports', 'Reports Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @report_level_id int
set @report_level_id = @component_level_id
declare @reports_display_order int
set @reports_display_order = 0
	exec sp_AddMetaComponentLevel 'Abstract Subdivision Report', null, @reports_display_order, 0, 101, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Acreage Changes Report', null, @reports_display_order, 0, 391, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Acreage Corrections', null, @reports_display_order, 0, 103, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Annexation', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Annexation Revenue Report', null, 0, 0, 66, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Appraisal Schedules', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Improvement Schedules', null, 0, 0, 269, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Land Schedules', null, 1, 0, 270, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Bills', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Modified Bill Report', null, 0, 0, 79, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Bill/Fee Code Listing Report', null, 1, 0, 231, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'BOE', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Agent Sign In', null, 0, 0, 260, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'
		exec sp_AddMetaComponentLevel 'BOE Reports', null, 1, 0, 259, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Building Permits', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Audit Report', null, 0, 0, 227, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Building Permits', null, 1, 0, 68, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Building Permit Worksheet', null, 2, 0, 67, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Transfer Report', null, 3, 0, 228, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Certification', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Certification of Levies', null, 0, 0, 253, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Certification of Taxroll', null, 1, 0, 254, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Tax Roll Report', null, 2, 0, 251, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Total Taxes Levied', null, 3, 0, 252, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Change Log', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Change Log', null, 0, 0, 262, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Change of Value Report', null, @reports_display_order, 0, 135, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Conversion Gain/Loss', null, @reports_display_order, 0, 125, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Daily', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		declare @daily_display_order int
		set @daily_display_order = 0
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Payment Detail Listing', null, @daily_display_order, 0, 523, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Check Register Report', null, @daily_display_order, 0, 131, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Cashier''s Grouping Summary', null, @daily_display_order, 0, 83, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Daily Summary', null, @daily_display_order, 0, 245, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Daily Detail Listing', null, @daily_display_order, 0, 244, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Daily GL Report', null, @daily_display_order, 0, 249, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Assessment Collections Recap', null, @daily_display_order, 0, 247, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Fee Collections Activity Report', null, @daily_display_order, 0, 396, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Levy Collections Recap', null, @daily_display_order, 0, 246, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'REET Collections Recap', null, @daily_display_order, 0, 248, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @daily_display_order = @daily_display_order + 1
		exec sp_AddMetaComponentLevel 'Variance Report', null, @daily_display_order, 0, 123, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Data Verification', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Exception Reports', null, 0, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			set @temp2_level_id = @component_level_id
				exec sp_AddMetaComponentLevel 'Assessed Value', null, 0, 0, 258, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentLevel 'Improvement Value', null, 1, 0, 384, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentLevel 'Land Value', null, 2, 0, 387, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentLevel 'Mobile Home Value', null, 3, 0, 385, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentLevel 'Personal Value', null, 4, 0, 386, @temp2_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Land Acreage Verification', null, 1, 0, 256, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Percent Owner Verification', null, 2, 0, 257, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1	
	exec sp_AddMetaComponentLevel 'Delinquent Tax Roll Report', null, @reports_display_order, 0, 524, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Distribution', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Certification Fund Number Listing', null, 0, 0, 243, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'FMS Verification', null, 1, 0, 242, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'DOR', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Abstract of Assessed Value', null, 0, 0, 86, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'DOR Sales', null, 1, 0, 85, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'DOR Stratification', null, 2, 0, 84, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'DOR Senior Relief Form', null, 3, 0, 635, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Effective Acres Listing Report', null, @reports_display_order, 0, 124, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	if @entity_valid = 1
	begin
	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Entity', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Entity', null, 0, 0, 88, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
	end

	set @reports_display_order = @reports_display_order + 1
		EXEC sp_AddMetaComponentLevel 'Escrow', NULL, @reports_display_order, NULL, NULL, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			SET @temp_level_id = @component_level_id
			EXEC sp_AddMetaComponentLevel 'Collected Escrow Applied', NULL, 0, 0, 407, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			EXEC sp_AddMetaComponentLevel 'Escrow Collections Activity Report', NULL, 1, 0, 409, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			EXEC sp_AddMetaComponentLevel 'Escrow Listing', NULL, 2, 0, 406, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
			EXEC sp_AddMetaComponentLevel 'Escrow Value Listing Report', NULL, 3, 0, 408, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Events', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Miscellaneous Events Report', null, 0, 0, 89, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Exemptions', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Exemptions', null, 0, 0, 90, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Fees', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Fee Statement Report', null, 0, 0, 267, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Outstanding Fees Report', null, 1, 0, 268, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Gross Income Multipliers Report', null, @reports_display_order, 0, 129, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Lawsuit', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Entity Report', null, 0, 0, 234, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Lawsuit', null, 1, 0, 91, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Lawsuit Costs Report', null, 2, 0, 92, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentLevel 'Lawsuit Gain/Loss Report', null, 3, 0, 93, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Levy', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		declare @levy_display_order int
		set @levy_display_order = 0
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Assessment and Levies Due', null, @levy_display_order, 0, 365, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Assessment/Taxroll Reconciliation', null, @levy_display_order, 0, 266, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Certification of Levies', null, @levy_display_order, 0, 253, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Fund Listing', null, @levy_display_order, 0, 81, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Levy Rates Report', null, @levy_display_order, 0, 263, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Levy Rate Summary', null, @levy_display_order, 0, 265, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Levy Rates by Tax Area', null, @levy_display_order, 0, 264, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'List of Tax Areas within Tax District', null, @levy_display_order, 0, 95, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Listing of Levies within Tax Area', null, @levy_display_order, 0, 96, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Print Certification of Value Letter Report', null, @levy_display_order, 0, 394, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2165
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'RCMI Report', null, @levy_display_order, 0, 392, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Tax Area', null, @levy_display_order, 0, 241, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Timber Assessed Values Report', null, @levy_display_order, 0, 529, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @levy_display_order = @levy_display_order + 1
		exec sp_AddMetaComponentLevel 'Top Taxpayers', null, @levy_display_order, 0, 97, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Monthly', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		declare @monthly_display_order int
		set @monthly_display_order = 0
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Fiscal Balance Report', null, @monthly_display_order, 0, 71, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Fiscal MTD Recap', null, @monthly_display_order, 0, 232, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Fiscal YTD Recap', null, @monthly_display_order, 0, 75, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Fiscal YTD Summary', null, @monthly_display_order, 0, 74, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'YTD Recap', null, @monthly_display_order, 0, 548, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'YTD Summary', null, @monthly_display_order, 0, 547, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Receivable Summary Report', null, @monthly_display_order, 0, 73, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Paid Under Protest Report', null, @monthly_display_order, 0, 122, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Taxroll Reconciliation Report', null, @monthly_display_order, 0, 250, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @monthly_display_order = @monthly_display_order + 1
		exec sp_AddMetaComponentLevel 'Special Assessment Recap Report', null, @monthly_display_order, 0, 383, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Mortgage', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Mortgage Company List w/Owner Property', null, 0, 0, 272, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Mortgage Company List Report', null, 1, 0, 393, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Owner', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Address Change Report', null, 0, 0, 128, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Ownership Transfer Report', null, 1, 0, 261, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Property', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		declare @property_display_order int
		set @property_display_order = 0
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Acreage Split Report', null, @property_display_order, 0, 80, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Created Property', null, @property_display_order, 0, 99, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Deleted Property', null, @property_display_order, 0, 235, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Gain/Loss', null, @property_display_order, 0, 98, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Legal Acreage Verification Report', null, @property_display_order, 0, 102, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Merged Property Report', null, @property_display_order, 0, 236, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Mobile Home Movement Listing', null, @property_display_order, 0, 237, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Newly Created/Inactive Property', null, @property_display_order, 0, 238, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Next Inspection', null, @property_display_order, 0, 100, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Personal Property Segments', null, @property_display_order, 0, 638, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'			
		set @property_display_order = @property_display_order + 1
		exec sp_AddMetaComponentLevel 'Property Value Comparison By Year', null, @property_display_order, 0, 239, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Property Group Code', null, @reports_display_order, 0, 136, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Recalculation Errors Report', null, @reports_display_order, 0, 127, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Refunds', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Refunds Due Report', null, 0, 0, 78, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentLevel 'Refunds Paid Report', null, 1, 0, 76, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Sales Ratio Report', null, @reports_display_order, 0, 390, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 353 -- Report Printing Rights

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Special Assessment Calculation Comparison Report', null, @reports_display_order, 0, 126, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Standard Gain/Loss Report', null, @reports_display_order, 0, 395, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Supplement', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Supplement Property Listing', null, 0, 0, 389, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentLevel 'Supplemented Properties Error Report', null, 1, 0, 130, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'

	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Totals/Rolls', null, @reports_display_order, null, null, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'		
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'Adjusted Certified Totals', null, 0, 0, 109, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 2162
		exec sp_AddMetaComponentLevel 'Assessment Roll Report', null, 1, 0, 133, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2164
		exec sp_AddMetaComponentLevel 'Certified Totals', null, 2, 0, 108, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 2161
		exec sp_AddMetaComponentLevel 'Preliminary Totals', null, 3, 0, 240, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
			exec sp_AddMetaComponentRights @component_id, 0, 2163


	set @reports_display_order = @reports_display_order + 1
	exec sp_AddMetaComponentLevel 'Permanent Crop Worksheet', null, @reports_display_order, 0, 640, @report_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 2300

-- SETTINGS MENU ------------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Settings', 'Settings Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @settings_level_id int
set @settings_level_id = @component_level_id
declare @settings_display_order int
set @settings_display_order = 0

	exec sp_AddMetaComponentLevel 'Fonts', null, @settings_display_order, 0, 8, @settings_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'

	set @settings_display_order = @settings_display_order + 1
	exec sp_AddMetaComponentLevel 'User Settings', 'User Settings', @settings_display_order, 0, 618, @settings_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'

-- TOOLS MENU ---------------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Tools', '2', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4' -- Tools Roles (This is the cumalative set that the sub menus need.)
declare @tools_level_id int
set @tools_level_id = @component_level_id
declare @tools_display_order int
set @tools_display_order = 0

	exec sp_AddMetaComponentLevel 'Monitors', null, @tools_display_order, 0, 9, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentRights @component_id, 0, 387

-- IMPORT MENU --------------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Import', 'Import Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @import_level_id int
set @import_level_id = @component_level_id
declare @import_display_order int
set @import_display_order = 0

	exec sp_AddMetaComponentLevel 'Building Permits', null, @import_display_order, 0, 10, @import_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 2246
	set @import_display_order = @import_display_order + 1
	exec sp_AddMetaComponentLevel 'Import REET Recorded Information...', 'Imports the recorded REET Affidavit information from the selected file', @import_display_order, 0, 291, @import_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2158
	set @import_display_order = @import_display_order + 1
	exec sp_AddMetaComponentLevel 'Import Payment Run', null, @import_display_order, 0, 400, @import_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2185 -- Import Payment Run Rights
	set @import_display_order = @import_display_order + 1
	exec sp_AddMetaComponentLevel 'Property Mortgage Association', null, @import_display_order, 0, 29, @import_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2125 -- Import Property Mortgage Associations	
	
-- EXPORT MENU --------------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Export', 'Export Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @export_level_id int
set @export_level_id = @component_level_id
declare @export_display_order int
set @export_display_order = 0

--	exec sp_AddMetaComponentLevel 'Accounting Collections Export', null, @export_display_order, 0, 532, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
--		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
--		exec sp_AddMetaComponentRights @component_id, 0, 2288
	set @export_display_order = @export_display_order + 1
	exec sp_AddMetaComponentLevel 'Building Permit', null, @export_display_order, 0, 11, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentRights @component_id, 0, 2195
	set @export_display_order = @export_display_order + 1
	exec sp_AddMetaComponentLevel 'Billing Information', null, @export_display_order, 0, 12, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2169
	if @build = 1 -- texas
	begin
		set @export_display_order = @export_display_order + 1
		exec sp_AddMetaComponentLevel 'Export Application Data', null, @export_display_order, 0, 527, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentRights @component_id, 0, 2187
	end
	set @export_display_order = @export_display_order + 1
	exec sp_AddMetaComponentLevel 'Export Paid', null, @export_display_order, 0, 13, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
	if @build = 1 -- texas
	begin
		set @export_display_order = @export_display_order + 1
		exec sp_AddMetaComponentLevel 'Export Property Summary', null, @export_display_order, 0, 526, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
	end
	set @export_display_order = @export_display_order + 1
	exec sp_AddMetaComponentLevel 'Export REET Recorded Information...', 'Exports the recorded REET Affidavit information to the specified file', @export_display_order, 0, 292, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2159
	set @export_display_order = @export_display_order + 1
	exec sp_AddMetaComponentLevel 'Mortgage Billing', null, @export_display_order, 0, 404, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2289
	if @build = 0 -- Washington
	begin
	set @export_display_order = @export_display_order + 1
	exec sp_AddMetaComponentLevel 'Web Portal Export', null, @export_display_order, 0, 549, @export_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentRights @component_id, 0, 2290
end
	
-- TESTS MENU *** THIS SHOULD BE REMOVED FOR PRODUCTION *** -----------------------------------------
if @production_mode = 0
begin
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Tests', 'Tests Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @tests_level_id int
set @tests_level_id = @component_level_id
declare @tests_display_order int
set @tests_display_order = 0

	exec sp_AddMetaComponentLevel 'Test Query Builder', null, @tests_display_order, 0, 14, @tests_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
end

-- HELP MENU ----------------------------------------------------------------------------------------
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Help', 'Help Menu', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @help_level_id int
set @help_level_id = @component_level_id
declare @help_display_order int
set @help_display_order = 0

	exec sp_AddMetaComponentLevel 'Get Help...', null, @help_display_order, 0, 15, @help_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
	set @help_display_order = @help_display_order + 1
	exec sp_AddMetaComponentLevel 'Create Screen Shot...', null, @help_display_order, 0, 16, @help_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
	set @help_display_order = @help_display_order + 1
	exec sp_AddMetaComponentLevel 'About...', null, @help_display_order, 0, 17, @help_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'

/***************************************************************************************************/
/** Search Band -----------------------------------------------------------------------------------*/
/***************************************************************************************************/
set @top_display_order = 0
exec sp_AddMetaComponentLevel 'Search', 'Search', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
declare @search_level_id int
set @search_level_id = @component_level_id
-- Using a separate variable for display order as we have entries that 
-- might not be valid for the distribution
declare @search_display_order int
set @search_display_order = 0

	exec sp_AddMetaComponentLevel 'Property', 'Property Search', @search_display_order, 1, 300, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3' -- Property Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Taxpayer', 'Taxpayer Search', @search_display_order, 1, 301, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3' -- Taxpayer Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Agent', 'Agent Search', @search_display_order, 1, 302, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3' -- Agent Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Batch', 'Batch Search', @search_display_order, 1, 306, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Batch Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Bill', 'Bill Search', @search_display_order, 1, 307, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Bill Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Inquiry', 'Inquiry Search', @search_display_order, 1, 303, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3' -- ARB Inquiry Roles
		exec sp_AddMetaComponentRights @component_id, 1, 2252
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'BOE Protest', 'BOE Protest Search', @search_display_order, 1, 304, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3' -- ARB Protest Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Attorney', 'Attorney Search', @search_display_order, 1, 305, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Attorney Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Building Permit', 'Building Permit Search', @search_display_order, 1, 308, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0' -- Building Permit Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Collector', 'Collector Search', @search_display_order, 1, 309, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Collector Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Change Log', 'Change Log Search', @search_display_order, 1, 310, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Change Log Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Effective Acres Group', 'Effective Acres Group Search', @search_display_order, 1, 359, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0' -- Effective Acres Group Roles
	if @entity_valid = 1
	begin
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Entity', 'Entity Search', @search_display_order, 1, 311, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Entity Roles
	end
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Fee', 'Fee Search', @search_display_order, 1, 312, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Fee Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Lawsuit', 'Lawsuit Search', @search_display_order, 1, 313, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3' -- Lawsuit Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Litigation', 'Litigation Search', @search_display_order, 1, 314, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Litigation Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Mortgage', 'Mortgage Search', @search_display_order, 1, 315, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Mortgage Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Payment', 'Payment Search', @search_display_order, 1, 316, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Payment Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Payout Agreement', 'Payout Agreement Search', @search_display_order, 1, 317, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Payout Agreement Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'REET', 'REET Search', @search_display_order, 1, 318, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- REET Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Refund Paid', 'Refund Paid Search', @search_display_order, 1, 319, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1' -- Refund Paid Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Sp Assessment Agency', 'Sp Assessment Agency Search', @search_display_order, 1, 320, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Sp Assessment Agency Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Tax Area', 'Tax Area Search', @search_display_order, 1, 321, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Tax Area Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Tax District', 'Tax District Search', @search_display_order, 1, 322, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Tax District Roles
	set @search_display_order = @search_display_order + 1
	exec sp_AddMetaComponentLevel 'Taxserver', 'Taxserver Search', @search_display_order, 1, 530, @search_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1' -- Taxserver Roles

/***************************************************************************************************/
/** PACS.ADMIN ------------------------------------------------------------------------------*/
/***************************************************************************************************/
-- Tools MENU ----------------------------------------------------------------------------------------

set @tools_display_order = 0

-- Tools menu already added above
	exec sp_addMetaComponentLevel 'Report Designer', 'Report Designer', @tools_display_order, 2, 410, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 490
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Code File Maintenance', 'Code File Maintenance', @tools_display_order, 2, 411, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
		
		exec sp_AddMetaComponentRights @component_id, 3, 492
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Document Imaging Maintenance', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
		set @tools_display_order = @tools_display_order + 1
		set @temp_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Document Retention Process', null, 0, 2, 412, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 1039
		exec sp_addMetaComponentLevel 'Forms Maintenance', 'Forms Maintenance', 1, 2, 413, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 1039
		exec sp_addMetaComponentLevel 'Image Types', 'Image Types', 2, 2, 414, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 1039
		exec sp_addMetaComponentLevel 'Record Types', 'Record Types', 3, 2, 415, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 1039
		exec sp_addMetaComponentLevel 'Sub Types', 'Sub Types', 4, 2, 416, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 1039
	exec sp_addMetaComponentLevel 'User Management', 'User Management', @tools_display_order, 2, 417, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Subset View Management', 'Subset View Management', @tools_display_order, 2, 418, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 493
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Regionalization Management', 'Regionalization Management', @tools_display_order, 2, 419, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 495
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'User Table Management', 'User Table Management', @tools_display_order, 2, 420, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 496
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Field Level Customization', 'Field Level Customization', @tools_display_order, 2, 421, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 497
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Calendar Maintenance', 'Calendar Maintenance', @tools_display_order, 2, 422, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2129
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'System Configuration', 'System Configuration', @tools_display_order, 2, 423, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 497
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Levy Certification Configuration', 'Levy Certification Configuration', @tools_display_order, 2, 522, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		exec sp_AddMetaComponentRights @component_id, 2, 1001 --Set Up Levy Proration Order Data 
		--OR
		exec sp_AddMetaComponentRights @component_id, 2, 2218 --Edit Levy Cert Run
		
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'GIS Manager', 'GIS Manager', @tools_display_order, 2, 424, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 499
		exec sp_AddMetaComponentRights @component_id, 2, 2130
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Comparable Property', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
	set @tools_display_order = @tools_display_order + 1
		set @temp_level_id = @component_level_id
		declare @comp_property_order int
		set @comp_property_order = 0
		exec sp_addMetaComponentLevel 'Commercial Maintenance', null, @comp_property_order, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		set @comp_property_order = @comp_property_order + 1
			declare @comm_level_id int
			set @comm_level_id = @component_level_id
			exec sp_addMetaComponentLevel 'Manage Tables', null, 0, null, null, @comm_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				declare @manage_tables_level_id int
				set @manage_tables_level_id = @component_level_id
				exec sp_addMetaComponentLevel 'Quality Point Spreads', 'Quality Point Spreads', 0, 2, 425, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Use Point Spread', 'Use Point Spread', 1, 2, 426, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Primary Use Score', 'Primary Use Score', 2, 2, 427, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Abstract Subdivision Point Differences', 'Manage Abstract Subdivision Point Differences', 3, 2, 428, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Abstract Subdivision Points', 'Manage Abstract Subdivision Points', 4, 2, 429, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Age Points', 'Manage Age Points', 5, 2, 430, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Annual Time Adjustments', 'Manage Annual Time Adjustments', 6, 2, 431, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Building Size Difference Points', 'Manage Building Size Difference Points', 7, 2, 432, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage CVA Adjustments', 'Manage CVA Adjustments', 8, 2, 433, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage CVA Points Differences', 'Manage CVA Points Differences', 9, 2, 434, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage CVA Points', 'Manage CVA Points', 10, 2, 435, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage City Point Differences', 'Manage City Point Differences', 11, 2, 436, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage City Points', 'Manage City Points', 12, 2, 437, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Financing Adjustments', 'Manage Financing Adjustments', 13, 2, 438, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Land Size Difference Points', 'Manage Land Size Difference Points', 14, 2, 439, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Submarket Adjustments', 'Manage Submarket Adjustments', 15, 2, 440, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Submarket Comparable Flags', 'Manage Submarket Comparable Flags', 16, 2, 441, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Location Point Differences', 'Manage Location Point Differences', 17, 2, 442, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Submarket Points', 'Manage Submarket Points', 18, 2, 443, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Neighborhood Point Differences', 'Manage Neighborhood Point Differences', 19, 2, 444, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Neighborhood Points', 'Manage Neighborhood Points', 20, 2, 445, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage NRA Points Differences', 'Manage NRA Points Differences', 21, 2, 446, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Property Use Life Expectancies', 'Manage Property Use Life Expectancies', 22, 2, 447, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Quality Adjustments', 'Manage Quality Adjustments', 23, 2, 448, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Region Points', 'Manage Region Points', 24, 2, 449, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Quality Points', 'Manage Quality Points', 25, 2, 450, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Region Point Differences', 'Manage Region Point Differences', 26, 2, 451, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage School Point Differences', 'Manage School Point Differences', 27, 2, 452, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage School Points', 'Manage School Points', 28, 2, 453, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage State Code Point Differences', 'Manage State Code Point Differences', 29, 2, 454, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage State Code Points', 'Manage State Code Points', 30, 2, 455, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Subset Point Differences', 'Manage Subset Point Differences', 31, 2, 456, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Subset Points', 'Manage Subset Points', 32, 2, 457, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
				exec sp_addMetaComponentLevel 'Manage Time Since Sale Points', 'Manage Time Since Sale Points', 33, 2, 458, @manage_tables_level_id, @component_level_id OUTPUT, @component_id OUTPUT
					exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
					
					exec sp_AddMetaComponentRights @component_id, 2, 2131
			exec sp_addMetaComponentLevel 'Identify Commercial Property', 'Identify Commercial Property', 1, 2, 459, @comm_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
		exec sp_addMetaComponentLevel 'Comparable Property Maintenance', 'Comparable Property Maintenance', @comp_property_order, 2, 481, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2131
		set @comp_property_order = @comp_property_order + 1
		exec sp_addMetaComponentLevel 'Residential Maintenance', null, @comp_property_order, null, null, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			set @comp_property_order = @comp_property_order + 1
			declare @res_maint_level_id int
			set @res_maint_level_id = @component_level_id
			declare @res_maint_order int
			set @res_maint_order = 0
			exec sp_addMetaComponentLevel 'Feature Adjustment Scheduler', 'Feature Adjustment Scheduler', @res_maint_order, 2, 473, @res_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
			set @res_maint_order = @res_maint_order + 1
			exec sp_addMetaComponentLevel 'Quality Adjustment Schedules', 'Quality Adjustment Schedules', @res_maint_order, 2, 474, @res_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
			set @res_maint_order = @res_maint_order + 1
			exec sp_addMetaComponentLevel 'Segment Type Schedules', 'Segment Type Schedules', @res_maint_order, 2, 475, @res_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
			set @res_maint_order = @res_maint_order + 1
			exec sp_addMetaComponentLevel 'Improvement Type Inclusion', 'Improvement Type Inclusion', @res_maint_order, 2, 478, @res_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
			set @res_maint_order = @res_maint_order + 1
			exec sp_addMetaComponentLevel 'Improvement Detail Class Exclusion', 'Improvement Detail Class Exclusion', @res_maint_order, 2, 479, @res_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
			set @res_maint_order = @res_maint_order + 1
			exec sp_addMetaComponentLevel 'Tax District Exclusion', 'Tax District Exclusion', @res_maint_order, 2, 480, @res_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2131
			set @res_maint_order = @res_maint_order + 1
		exec sp_addMetaComponentLevel 'Mass Print Grids', 'Mass Print Grids', @comp_property_order, 2, 482, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2131
		set @comp_property_order = @comp_property_order + 1
		exec sp_addMetaComponentLevel 'Mass Create New Grids', 'Mass Create Grids', @comp_property_order, 2, 483, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT		
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2131
		set @comp_property_order = @comp_property_order + 1
		exec sp_addMetaComponentLevel 'System Wide Configuration', 'System Wide Configuration', @comp_property_order, 2, 504, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2131
	exec sp_addMetaComponentLevel 'Building Permit Worksheet', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @bp_level_id int 
		set @bp_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Building Permit Worksheet Configuration', 'Building Permit Worksheet Configuration', 0, 2, 472, @bp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2132
	exec sp_addMetaComponentLevel 'User Settings', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @user_settings_level_id int
		set @user_settings_level_id = @component_level_id
--		exec sp_addMetaComponentLevel 'Property Search Settings', 'Property Search Settings', 0, 2, 476, @user_settings_level_id, @component_level_id OUTPUT, @component_id OUTPUT
--			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
--			
--			exec sp_AddMetaComponentRights @component_id, 2, 2133
		exec sp_addMetaComponentLevel 'Set ARB User Default Year', 'Set ARB User Default Year', 1, 2, 477, @user_settings_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2133
	exec sp_addMetaComponentLevel 'Module Administration', 'Module Administration', @tools_display_order, 2, 460, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2134
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Improvement Schedule Maintenance', 'Improvement Schedule Maintenance', @tools_display_order, 2, 484, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2135
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Personal Property Rendition Maintenance', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @pp_rendition_level_id int
		set @pp_rendition_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Depreciation Method Maintenance', 'Depreciation Method Maintenance', 0, 2, 463, @pp_rendition_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2136
		exec sp_addMetaComponentLevel 'Rendition Configuration', 'Rendition Configuration', 1, 2, 464, @pp_rendition_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2136
		exec sp_addMetaComponentLevel 'Wizard Configuration', 'Wizard Configuration', 2, 2, 465, @pp_rendition_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2136
		exec sp_addMetaComponentLevel 'Wizard Options', 'Wizard Options', 3, 2, 466, @pp_rendition_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2136
	exec sp_addMetaComponentLevel 'Personal Property Schedule Maintenance', 'Personal Property Schedule Maintenance', @tools_display_order, 2, 485, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 500
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Matrix Maintenance', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @matrix_level_id int
		set @matrix_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Improvement', 'Matrix Maintenance Improvement', 0, 2, 486, @matrix_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2137
		exec sp_addMetaComponentLevel 'Land', 'Matrix Maintenance Land', 1, 2, 487, @matrix_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2240
	exec sp_addMetaComponentLevel 'Land Schedule Maintenance', 'Land Schedule Maintenance', @tools_display_order, 2, 502, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2138
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Machine Settings', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @machine_level_id int
		set @machine_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Options', 'Machine Settings Options', 0, 2, 490, @machine_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
			exec sp_AddMetaComponentRights @component_id, 2, 2139
	exec sp_addMetaComponentLevel 'ARB Maintenance', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @arb_maint_level_id int
		declare @arb_maint_order int
		set @arb_maint_order = 0
		set @arb_maint_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Inquiry Codes', null, @arb_maint_order, null, null, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
		set @arb_maint_order = @arb_maint_order + 1
			declare @arb_inquiry_codes_level_id int
			set @arb_inquiry_codes_level_id  = @component_level_id
			exec sp_addMetaComponentLevel 'Status', 'ARB Inquiry Status', 0, 2, 467, @arb_inquiry_codes_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 2103
		exec sp_addMetaComponentLevel 'Letters', null, @arb_maint_order, null, null, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
		set @arb_maint_order = @arb_maint_order + 1
			declare @arb_letters_level_id int
			set @arb_letters_level_id  = @component_level_id
			exec sp_addMetaComponentLevel 'Letter Templates', 'ARB Letter Templates', 0, 2, 469, @arb_letters_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 367
				exec sp_AddMetaComponentRights @component_id, 2, 368
		exec sp_addMetaComponentLevel 'Map Sources', 'ARB Map Sources', @arb_maint_order, 2, 470, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT		
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
			exec sp_AddMetaComponentRights @component_id, 2, 1040
		set @arb_maint_order = @arb_maint_order + 1
		exec sp_addMetaComponentLevel 'Printer Settings', 'ARB Maintenance Printer Settings', @arb_maint_order, 2, 471, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
			exec sp_AddMetaComponentRights @component_id, 2, 1040
		set @arb_maint_order = @arb_maint_order + 1
		exec sp_addMetaComponentLevel 'Protest Mapping', 'ARB Protest Mapping', @arb_maint_order, 2, 493, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '3, 4'
			exec sp_AddMetaComponentRights @component_id, 2, 1040
		set @arb_maint_order = @arb_maint_order + 1
		exec sp_addMetaComponentLevel 'System Settings', 'ARB System Settings', @arb_maint_order, 2, 494, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
			exec sp_AddMetaComponentRights @component_id, 2, 1040
		set @arb_maint_order = @arb_maint_order + 1
		exec sp_addMetaComponentLevel 'Appraiser Meetings', null, @arb_maint_order, null, null, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
		set @arb_maint_order = @arb_maint_order + 1
			declare @arb_appraiser_level_id int
			set @arb_appraiser_level_id  = @component_level_id
			exec sp_addMetaComponentLevel 'Manage Meetings', 'ARB Manage Meetings', 0, 2, 499, @arb_appraiser_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 3, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 2291
			exec sp_addMetaComponentLevel 'Add Meeting Availability', 'ARB Add Meeting Availability', 1, 2, 501, @arb_appraiser_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 2291
			exec sp_addMetaComponentLevel 'Holidays', 'ARB Holidays', 2, 2, 500, @arb_appraiser_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 2291
			exec sp_addMetaComponentLevel 'Settings', 'ARB Appraiser Meeting Settings', 3, 2, 498, @arb_appraiser_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 2, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 2291
		exec sp_addMetaComponentLevel 'Protest Hearing Dockets', null, @arb_maint_order, null, null, @arb_maint_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '2, 3, 4'
			set @arb_maint_order = @arb_maint_order + 1
			declare @arb_hearing_level_id int
			set @arb_hearing_level_id = @component_level_id
			exec sp_addMetaComponentLevel 'Agent', 'ARB Protest Hearing Dockets Agent', 0, 2, 495, @arb_hearing_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '2, 3, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 439
			exec sp_addMetaComponentLevel 'Appraiser', 'ARB Protest Hearing Dockets Appraiser', 1, 2, 496, @arb_hearing_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '2, 3, 4'
				exec sp_AddMetaComponentRights @component_id, 2, 439
			exec sp_addMetaComponentLevel 'Property', 'ARB Protest Hearing Dockets Property', 2, 2, 497, @arb_hearing_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '2, 3, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 439
	exec sp_addMetaComponentLevel 'Set System Wide Variance', 'Set System Wide Variance', @tools_display_order, 2, 503, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2140
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Land Miscellaneous Codes Schedules', 'Land Miscellaneous Codes Schedules', @tools_display_order, 2, 505, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2141
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Slope Intercept Schedule Maintenance', 'Slope Intercept Schedule Maintenance', @tools_display_order, 2, 506, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2142
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Depreciation Schedule Maintenance', 'Depreciation Schedule Maintenance', @tools_display_order, 2, 507, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2143
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Configure Workstation', 'Configure Workstation', @tools_display_order, 2, 508, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2144
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Modifier Maintenance', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @modifier_level_id int
		declare @modifier_maint_order int
		set @modifier_maint_order = 0
		set @modifier_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Commercial Local & Cost Maintenance', 'Commercial Local & Cost Maintenance', @modifier_maint_order, 2, 510, @modifier_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 2145
		set @modifier_maint_order = @modifier_maint_order + 1
		exec sp_addMetaComponentLevel 'Manufactured Housing Local & Cost Maintenance', 'Manufactured Housing Local & Cost Maintenance', @modifier_maint_order, 2, 509, @modifier_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 214
		set @modifier_maint_order = @modifier_maint_order + 1
		exec sp_addMetaComponentLevel 'Multi-Family Local & Cost Maintenance', 'Multi-Family Local & Cost Maintenance', @modifier_maint_order, 2, 511, @modifier_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 214
		set @modifier_maint_order = @modifier_maint_order + 1
		exec sp_addMetaComponentLevel 'Residential Local & Cost Maintenance', 'Residential Local & Cost Maintenance', @modifier_maint_order, 2, 512, @modifier_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 214
		set @modifier_maint_order = @modifier_maint_order + 1
	exec sp_addMetaComponentLevel 'Change Log', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @change_log_level_id int
		set @change_log_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Administration', 'Change Log Administration', 0, 2, 491, @change_log_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 320
		exec sp_addMetaComponentLevel 'Set Transaction Selection', 'Change Log Set Transaction Selection', 1, 2, 492, @change_log_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 464
	exec sp_addMetaComponentLevel 'Income Schedule Maintenance', 'Income Schedule Maintenance', @tools_display_order, 2, 513, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2146
	set @tools_display_order = @tools_display_order + 1	
	exec sp_addMetaComponentLevel 'Set Form Defaults', 'Set Form Defaults', @tools_display_order, 2, 461, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2147
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Rollback Compensatory Tax Configuration', 'Rollback Compensatory Tax Configuration', @tools_display_order, 2, 462, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 1027
		exec sp_AddMetaComponentRights @component_id, 2, 1028
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Property', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @property_level_id int
		set @property_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'GIS Real Coordinate Update', 'GIS Real Coordinate Update', 0, 2, 514, @property_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
			
			exec sp_AddMetaComponentRights @component_id, 2, 551
	exec sp_addMetaComponentLevel 'Overpayment Credit Event Mapping', 'Overpayment Credit Event Mapping', @tools_display_order, 2, 515, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2148
	set @tools_display_order = @tools_display_order + 1
	exec sp_addMetaComponentLevel 'Global Sign-In Messaging', 'Global Sign-In Messaging', @tools_display_order, 2, 516, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		
		exec sp_AddMetaComponentRights @component_id, 2, 2149
	set @tools_display_order = @tools_display_order + 1
	
	exec sp_addMetaComponentLevel 'Stratification Settings', null, @tools_display_order, null, null, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
	set @tools_display_order = @tools_display_order + 1
		declare @strat_settings_level_id int
		set @strat_settings_level_id = @component_level_id
		exec sp_addMetaComponentLevel 'Stratification Information', null, 0, null, null, @strat_settings_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
			declare @strat_info_level_id int
			set @strat_info_level_id = @component_level_id
			exec sp_addMetaComponentLevel 'Real Property', 'Stratification Information Real Property', 0, 2, 488, @strat_info_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2150
			exec sp_addMetaComponentLevel 'Personal Property', 'Stratification Information Personal Property', 1, 2, 489, @strat_info_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
				
				exec sp_AddMetaComponentRights @component_id, 2, 2150
			
	exec sp_addMetaComponentLevel 'Work In Future Layer', 'Work In Future Layer', @tools_display_order, 2, 517, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 4'
	set @tools_display_order = @tools_display_order + 1
	
	exec sp_addMetaComponentLevel 'Auto Build Legal Configuration', 'Auto Build Legal Configuration', @tools_display_order, 2, 619, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		exec sp_AddMetaComponentRights @component_id, 2, 431
	set @tools_display_order = @tools_display_order + 1
	
	exec sp_addMetaComponentLevel 'Permanent Crop Configuration', 'Permanent Crop Configuration', @tools_display_order, 2, 639, @tools_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 4'
		exec sp_AddMetaComponentRights @component_id, 2, 2297
	set @tools_display_order = @tools_display_order + 1

/***************************************************************************************************/
/** View Commands Menu ----------------------------------------------------------------------------*/
/***************************************************************************************************/
-- Component Type Value = 3
set @top_display_order = @top_display_order + 1
exec sp_AddMetaComponentLevel 'Commands', 'Commands', @top_display_order, null, null, null, @component_level_id OUTPUT, @component_id OUTPUT
	exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3' -- Commands Roles (This is the cumalative set that the sub menus need.)
declare @commands_level_id int
set @commands_level_id = @component_level_id
declare @commands_display_order int
set @commands_display_order = 0

-- The display order will be continuous across the views, but the publication type will resolve down
-- which items display in which view.
-- Property View ------------------------------------------------------------------------------------
	exec sp_AddMetaComponentLevel 'Change of Value', null, @commands_display_order, 3, 135, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Change Posting Date', null, @commands_display_order, 3, 37, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Copy Property to Another Year', null, @commands_display_order, 3, 555, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Copy Property to Future Year', null, @commands_display_order, 3, 556, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Delete Property', null, @commands_display_order, 3, 581, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Manage Comparables', null, @commands_display_order, null, null, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'View Default Sales Grid', null, 0, 3, 569, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentLevel 'Manage Sales Grid', null, 1, 3, 567, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentLevel 'View Default Equity Grid', null, 2, 3, 570, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentLevel 'Manage Equity Grid', null, 3, 3, 568, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
			exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Merge Property', null, @commands_display_order, 3, 576, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Next Property', null, @commands_display_order, 3, 583, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Open Change Log', null, @commands_display_order, 3, 580, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Open Previous Year', null, @commands_display_order, 3, 585, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'PIC', null, @commands_display_order, 3, 577, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1		
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 2, -1, -1, -1		
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 3, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 3, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 3, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 3, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Previous Property', null, @commands_display_order, 3, 584, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Print Appraisal Card', null, @commands_display_order, 3, 579, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Print Personal Property Segments', null, @commands_display_order, 3, 638, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1 
	exec sp_AddMetaComponentLevel 'Print Property Letter', null, @commands_display_order, 3, 378, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Recalculation with Trace', null, @commands_display_order, 3, 586, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Recover Property', null, @commands_display_order, 3, 582, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Split Property', null, @commands_display_order, 3, 287, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Supplement', null, @commands_display_order, null, null, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		set @temp_level_id = @component_level_id
			exec sp_AddMetaComponentLevel 'Supplement Property', null, 0, 3, 552, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
			exec sp_AddMetaComponentLevel 'Remove from Supplement', null, 1, 3, 554, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
			exec sp_AddMetaComponentLevel 'Move to Supplement', null, 2, 3, 553, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
				exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
			exec sp_AddMetaComponentLevel 'Accept and Create Bills', null, 3, 3, 557, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
				exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
				exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
				exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'View Plat Map', null, @commands_display_order, 3, 578, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Create New Tax Statement', null, @commands_display_order, 3, 587, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '1'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 1, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'ARB Submission Lock', null, @commands_display_order, 3, 357, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Undo ARB Submission Lock', null, @commands_display_order, 3, 358, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0'
		exec sp_AddMetaComponentPublication @component_id, 1, 1, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 2, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 3, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 4, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 1, 5, 0, -1, -1, -1

-- Taxpayer View ----------------------------------------------------------------------------------
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Open Change Log', null, @commands_display_order, 3, 620, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 2, 7, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 2, 7, 1, -1, -1, -1

-- ARB Inquiry View ------------------------------------------------------------------------------
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Close', null, @commands_display_order, 3, 588, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Agent', null, @commands_display_order, 3, 593, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Comp Grid', null, @commands_display_order, 3, 594, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Open Change Log', null, @commands_display_order, 3, 623, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Owner', null, @commands_display_order, 3, 592, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Reopen', null, @commands_display_order, 3, 589, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Protest', null, @commands_display_order, 3, 590, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Print Appraisal Card', null, @commands_display_order, 3, 614, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Property', null, @commands_display_order, 3, 591, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Record Appraiser Meeting', null, @commands_display_order, 3, 595, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 17, 3, -1, -1, -1

-- ARB Protest View ------------------------------------------------------------------------------
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Agent', null, @commands_display_order, 3, 615, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Close Protest', null, @commands_display_order, 3, 596, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Copy Fields To', null, @commands_display_order, 3, 604, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Inquiry', null, @commands_display_order, 3, 602, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Open Change Log', null, @commands_display_order, 3, 624, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Owner', null, @commands_display_order, 3, 616, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Property', null, @commands_display_order, 3, 617, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Reopen Protest', null, @commands_display_order, 3, 597, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Manage Comparables', null, @commands_display_order, 3, 598, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Presentation', null, @commands_display_order, null, null, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		set @temp_level_id = @component_level_id
		exec sp_AddMetaComponentLevel 'CAD (Sales)', null, 0, 3, 599, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
		exec sp_AddMetaComponentLevel 'CAD (Equity)', null, 1, 3, 600, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
		exec sp_AddMetaComponentLevel 'Taxpayer', null, 2, 3, 601, @temp_level_id, @component_level_id OUTPUT, @component_id OUTPUT
			exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
			exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Sales Ratio Report', null, @commands_display_order, 3, 104, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Property Info Center', null, @commands_display_order, 3, 605, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1
	set @commands_display_order = @commands_display_order + 1
	exec sp_AddMetaComponentLevel 'Record Hearing Minutes', null, @commands_display_order, 3, 603, @commands_level_id, @component_level_id OUTPUT, @component_id OUTPUT
		exec sp_AddMetaComponentLevelRoles @component_level_id, '0, 1, 2, 3'
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 0, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 1, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 2, -1, -1, -1
		exec sp_AddMetaComponentPublication @component_id, 5, 16, 3, -1, -1, -1

/*************************************************************************************/
/* END OF FILE                                                                       */
/*************************************************************************************/

GO

