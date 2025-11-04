CREATE TYPE "public"."connection_status" AS ENUM('connected', 'disconnected', 'error', 'testing');--> statement-breakpoint
CREATE TYPE "public"."conversion_status" AS ENUM('pending', 'analyzing', 'analyzed', 'planning', 'planned', 'generating_script', 'script_generated', 'migrating', 'migrated', 'creating_compatibility', 'completed', 'error');--> statement-breakpoint
CREATE TYPE "public"."database_type" AS ENUM('postgres', 'mysql', 'sqlserver', 'oracle', 'mongodb', 'sqlite', 'csv', 'excel', 'json', 'xml');--> statement-breakpoint
CREATE TABLE "agent_experiences" (
	"id" serial PRIMARY KEY NOT NULL,
	"experience_id" varchar(100) NOT NULL,
	"agent_id" varchar(50) NOT NULL,
	"agent_name" varchar(100) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"action" text NOT NULL,
	"state" jsonb NOT NULL,
	"next_state" jsonb,
	"reward" real NOT NULL,
	"entity_type" varchar(50),
	"entity_id" varchar(100),
	"priority" real DEFAULT 0 NOT NULL,
	"context" jsonb,
	"used_for_training" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agent_experiences_experience_id_unique" UNIQUE("experience_id")
);
--> statement-breakpoint
CREATE TABLE "agent_knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"knowledge_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_events" integer[],
	"confidence" numeric NOT NULL,
	"usage_count" integer DEFAULT 0,
	"last_used" timestamp,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_learning_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb NOT NULL,
	"source_context" jsonb,
	"priority" integer DEFAULT 1,
	"processed" boolean DEFAULT false,
	"processing_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "agent_learning_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"model_name" text NOT NULL,
	"version" text NOT NULL,
	"provider" text NOT NULL,
	"configuration" jsonb,
	"performance_metrics" jsonb,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"conversation_id" text,
	"sender_agent_id" text NOT NULL,
	"receiver_agent_id" text,
	"message_type" text NOT NULL,
	"subject" text NOT NULL,
	"content" jsonb NOT NULL,
	"context_data" jsonb DEFAULT '{}'::jsonb,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"processed_at" timestamp,
	"retry_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"correlation_id" text,
	"is_acknowledged" boolean DEFAULT false,
	CONSTRAINT "agent_messages_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "agent_performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"metric_type" text NOT NULL,
	"value" numeric NOT NULL,
	"timeframe" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_user_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"user_id" integer,
	"conversation_id" text,
	"task_id" text,
	"feedback_text" text,
	"sentiment" text,
	"rating" integer,
	"categories" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "ai_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"performance" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_code_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"generation_id" text NOT NULL,
	"project_id" text NOT NULL,
	"file_id" text,
	"prompt" text NOT NULL,
	"result" text NOT NULL,
	"used_context" jsonb DEFAULT '{}'::jsonb,
	"rating" integer,
	"is_applied" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"model" text,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "ai_code_generations_generation_id_unique" UNIQUE("generation_id")
);
--> statement-breakpoint
CREATE TABLE "api_documentation" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_url" text NOT NULL,
	"version" text NOT NULL,
	"endpoints" jsonb NOT NULL,
	"authentication" jsonb,
	"schemas" jsonb,
	"examples" jsonb,
	"created_by" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appeal_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"appeal_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"internal_only" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appeal_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"appeal_id" integer NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"uploaded_by" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appeals" (
	"id" serial PRIMARY KEY NOT NULL,
	"appeal_number" text NOT NULL,
	"property_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"appeal_type" text DEFAULT 'value' NOT NULL,
	"reason" text NOT NULL,
	"evidence_urls" text[],
	"requested_value" numeric,
	"date_received" timestamp DEFAULT now() NOT NULL,
	"hearing_date" timestamp,
	"hearing_location" text,
	"assigned_to" integer,
	"status" text DEFAULT 'submitted' NOT NULL,
	"decision" text,
	"decision_reason" text,
	"decision_date" timestamp,
	"notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appeals_appeal_number_unique" UNIQUE("appeal_number")
);
--> statement-breakpoint
CREATE TABLE "assessment_model_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"version_number" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"change_log" text,
	"created_by_id" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_template" boolean DEFAULT false,
	"compatible_property_types" jsonb DEFAULT '[]'::jsonb,
	"created_by_id" integer NOT NULL,
	"last_modified_by_id" integer NOT NULL,
	"last_reviewed_by_id" integer,
	"review_notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_models_model_id_unique" UNIQUE("model_id")
);
--> statement-breakpoint
CREATE TABLE "assistant_personalities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"traits" jsonb NOT NULL,
	"visual_theme" jsonb NOT NULL,
	"system_prompt" text NOT NULL,
	"example_messages" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false,
	"user_id" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" json,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip_address" text
);
--> statement-breakpoint
CREATE TABLE "team_collaboration_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" text NOT NULL,
	"participants" integer[] NOT NULL,
	"organizer" integer NOT NULL,
	"agenda" text[] DEFAULT '{}',
	"notes" text,
	"recording_url" text,
	"task_ids" uuid[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "code_improvements" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"agent_id" text NOT NULL,
	"agent_name" text NOT NULL,
	"affected_files" jsonb,
	"suggested_changes" jsonb,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_snippets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"language" text NOT NULL,
	"snippet_type" text NOT NULL,
	"code" text NOT NULL,
	"tags" text[],
	"created_by" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"ai_generated" boolean DEFAULT false,
	"ai_model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comparable_analysis_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"comparable_sale_id" integer NOT NULL,
	"include_in_final_value" boolean DEFAULT true NOT NULL,
	"weight" numeric DEFAULT '1' NOT NULL,
	"adjusted_value" numeric,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comparable_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"comparable_property_id" text NOT NULL,
	"sale_date" date,
	"sale_price" numeric,
	"adjusted_price" numeric,
	"distance_in_miles" numeric,
	"similarity_score" numeric,
	"adjustment_factors" jsonb,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comparable_sales_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysis_id" text NOT NULL,
	"property_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"methodology" text DEFAULT 'sales_comparison' NOT NULL,
	"effective_date" date NOT NULL,
	"value_conclusion" numeric,
	"adjustment_notes" text,
	"market_conditions" text,
	"confidence_level" text DEFAULT 'medium',
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"reviewed_by" integer,
	"review_notes" text,
	"review_date" timestamp,
	CONSTRAINT "comparable_sales_analyses_analysis_id_unique" UNIQUE("analysis_id")
);
--> statement-breakpoint
CREATE TABLE "compatibility_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_type" text NOT NULL,
	"target_type" text NOT NULL,
	"view_definitions" jsonb,
	"function_mappings" jsonb,
	"trigger_equivalents" jsonb,
	"syntax_adaptations" jsonb,
	"configuration_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"county_code" varchar(10) NOT NULL,
	"report_type" varchar(50) DEFAULT 'standard' NOT NULL,
	"generated_at" timestamp NOT NULL,
	"summary" jsonb NOT NULL,
	"issues" jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"submitted_by" integer,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_reports_report_id_unique" UNIQUE("report_id")
);
--> statement-breakpoint
CREATE TABLE "connection_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"database_type" text NOT NULL,
	"connection_config" jsonb NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversion_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"level" text NOT NULL,
	"stage" text NOT NULL,
	"message" text NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "data_lineage_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"field_name" text NOT NULL,
	"old_value" text NOT NULL,
	"new_value" text NOT NULL,
	"change_timestamp" timestamp NOT NULL,
	"source" text NOT NULL,
	"user_id" integer NOT NULL,
	"source_details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_pipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"pipeline_type" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"steps" jsonb NOT NULL,
	"schedule" text,
	"last_run_status" text,
	"last_run_time" timestamp,
	"created_by" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_visualizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"visualization_type" text NOT NULL,
	"data_source" jsonb NOT NULL,
	"configuration" jsonb NOT NULL,
	"preview_image" text,
	"created_by" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"last_viewed" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "database_conversion_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_config" jsonb NOT NULL,
	"target_config" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"current_stage" text DEFAULT 'created' NOT NULL,
	"schema_analysis" jsonb,
	"migration_plan" jsonb,
	"migration_script" jsonb,
	"migration_result" jsonb,
	"compatibility_result" jsonb,
	"validation_result" jsonb,
	"error" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "debugging_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"project_id" integer NOT NULL,
	"error_message" text,
	"error_stack" text,
	"error_location" jsonb,
	"status" text DEFAULT 'open',
	"resolution" text,
	"steps" jsonb[],
	"created_by" integer NOT NULL,
	"ai_assisted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "design_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"primary_color" text NOT NULL,
	"secondary_color" text NOT NULL,
	"accent_color" text,
	"typography" jsonb NOT NULL,
	"spacing" jsonb NOT NULL,
	"border_radius" jsonb,
	"shadows" jsonb,
	"dark_mode" boolean DEFAULT false,
	"accessibility_level" text DEFAULT 'AA',
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dev_preview_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"status" text DEFAULT 'STOPPED' NOT NULL,
	"port" integer,
	"command" text DEFAULT 'npm run dev' NOT NULL,
	"auto_refresh" boolean DEFAULT true,
	"last_started" timestamp,
	"last_stopped" timestamp,
	"logs" text[],
	CONSTRAINT "dev_preview_settings_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "dev_project_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" serial NOT NULL,
	"project_id" uuid NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"content" text DEFAULT '',
	"size" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"parent_path" text
);
--> statement-breakpoint
CREATE TABLE "dev_project_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"language" text NOT NULL,
	"category" text,
	"is_official" boolean DEFAULT false,
	"file_structure" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dev_project_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "dev_projects" (
	"project_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"language" text NOT NULL,
	"framework" text,
	"template" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_public" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "developer_activity_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"metric_id" integer,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"activity_type" text NOT NULL,
	"project_id" integer,
	"description" text,
	"code_lines" integer DEFAULT 0,
	"is_completed" boolean DEFAULT false,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "developer_productivity_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date DEFAULT now() NOT NULL,
	"energy_level" text NOT NULL,
	"focus_level" text NOT NULL,
	"productive_hours" numeric NOT NULL,
	"distraction_count" integer DEFAULT 0,
	"completed_tasks" integer DEFAULT 0,
	"tasks_in_progress" integer DEFAULT 0,
	"blocked_tasks" integer DEFAULT 0,
	"code_lines" integer DEFAULT 0,
	"commit_count" integer DEFAULT 0,
	"notes" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "development_project_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"path" text NOT NULL,
	"content" text,
	"last_modified_by" integer NOT NULL,
	"file_type" text NOT NULL,
	"is_directory" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "energy_level_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"energy_level" text NOT NULL,
	"recommended_activities" jsonb DEFAULT '[]'::jsonb,
	"avoid_activities" jsonb DEFAULT '[]'::jsonb,
	"best_time_of_day" text,
	"strategies" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enhanced_dev_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"project_type" text NOT NULL,
	"configuration" jsonb,
	"git_repository" text,
	"is_public" boolean DEFAULT false,
	"is_template" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enhanced_team_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"collaboration_type" text NOT NULL,
	"project_id" integer,
	"status" text DEFAULT 'active',
	"participants" jsonb NOT NULL,
	"ai_participants" jsonb,
	"artifacts" jsonb,
	"created_by" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"field_type" text NOT NULL,
	"field_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_staging" (
	"id" serial PRIMARY KEY NOT NULL,
	"staging_id" text NOT NULL,
	"property_data" jsonb NOT NULL,
	"source" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"validation_errors" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "import_staging_staging_id_unique" UNIQUE("staging_id")
);
--> statement-breakpoint
CREATE TABLE "improvements" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"improvement_type" text NOT NULL,
	"year_built" integer,
	"square_feet" numeric,
	"bedrooms" integer,
	"bathrooms" numeric,
	"quality" text,
	"condition" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "land_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"land_use_code" text NOT NULL,
	"zoning" text NOT NULL,
	"topography" text,
	"frontage" numeric,
	"depth" numeric,
	"shape" text,
	"utilities" text,
	"flood_zone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_paths" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"difficulty_level" text NOT NULL,
	"estimated_hours" integer,
	"topics" text[],
	"prerequisites" jsonb,
	"modules" jsonb NOT NULL,
	"resources" jsonb,
	"created_by" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"enrollment_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"update_id" varchar(100) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"update_type" varchar(20) NOT NULL,
	"source_experiences" jsonb NOT NULL,
	"payload" jsonb NOT NULL,
	"applied_to" jsonb DEFAULT '[]'::jsonb,
	"metrics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "learning_updates_update_id_unique" UNIQUE("update_id")
);
--> statement-breakpoint
CREATE TABLE "mcp_tool_execution_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_name" text NOT NULL,
	"request_id" text NOT NULL,
	"agent_id" integer,
	"user_id" integer,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"status" text NOT NULL,
	"result" jsonb,
	"error" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"formula" text NOT NULL,
	"output_variable_id" integer,
	"depends_on" jsonb DEFAULT '[]'::jsonb,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"component_type" text NOT NULL,
	"implementation" jsonb NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_by_id" integer NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_test_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"inputs" jsonb NOT NULL,
	"expected_outputs" jsonb NOT NULL,
	"is_automated" boolean DEFAULT true,
	"last_run_at" timestamp,
	"last_run_status" text,
	"last_run_result" jsonb,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_validation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rule_type" text NOT NULL,
	"implementation" jsonb NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "model_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"variable_key" text NOT NULL,
	"type" text NOT NULL,
	"default_value" jsonb,
	"required" boolean DEFAULT false,
	"validation" jsonb DEFAULT '{}'::jsonb,
	"source_type" text NOT NULL,
	"source_mapping" jsonb DEFAULT '{}'::jsonb,
	"display_order" integer DEFAULT 0,
	"is_advanced" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pacs_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"module_name" text NOT NULL,
	"source" text NOT NULL,
	"integration" text NOT NULL,
	"description" text,
	"category" text,
	"api_endpoints" jsonb,
	"data_schema" jsonb,
	"sync_status" text DEFAULT 'pending',
	"last_sync_timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pacs_modules_module_name_unique" UNIQUE("module_name")
);
--> statement-breakpoint
CREATE TABLE "personality_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"traits" jsonb NOT NULL,
	"visual_theme" jsonb NOT NULL,
	"system_prompt" text NOT NULL,
	"example_messages" jsonb DEFAULT '[]'::jsonb,
	"is_official" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personalized_developer_agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"specialization" text DEFAULT 'full_stack' NOT NULL,
	"personality_id" integer,
	"system_prompt" text NOT NULL,
	"example_messages" jsonb DEFAULT '[]'::jsonb,
	"supported_languages" text[] DEFAULT '{}',
	"capabilities" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_shared" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"ai_provider" text DEFAULT 'anthropic',
	"ai_model" text DEFAULT 'claude-3-7-sonnet-20250219',
	"preferred_tools" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preview_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"port" integer,
	"command" text NOT NULL,
	"env" jsonb DEFAULT '{}'::jsonb,
	"auto_refresh" boolean DEFAULT true,
	"status" text DEFAULT 'stopped' NOT NULL,
	"last_started" timestamp,
	"last_stopped" timestamp,
	"logs" text[] DEFAULT '{}',
	"pid" integer,
	"config_file" text,
	CONSTRAINT "preview_settings_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "project_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"project_id" text NOT NULL,
	"path" text NOT NULL,
	"name" text NOT NULL,
	"content" text NOT NULL,
	"type" text NOT NULL,
	"size" integer NOT NULL,
	"is_directory" boolean DEFAULT false,
	"parent_path" text,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "project_files_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
CREATE TABLE "project_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"language" text NOT NULL,
	"framework" text,
	"thumbnail" text,
	"files" jsonb NOT NULL,
	"dependencies" jsonb DEFAULT '{}'::jsonb,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_official" boolean DEFAULT false,
	"category" text,
	"tags" text[],
	CONSTRAINT "project_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE "project_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version_id" text NOT NULL,
	"project_id" text NOT NULL,
	"version_number" text NOT NULL,
	"commit_message" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_deployed" boolean DEFAULT false,
	"deployment_info" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "project_versions_version_id_unique" UNIQUE("version_id")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"address" text NOT NULL,
	"parcel_number" text NOT NULL,
	"property_type" text NOT NULL,
	"acres" numeric NOT NULL,
	"value" numeric,
	"status" text DEFAULT 'active' NOT NULL,
	"extra_fields" jsonb DEFAULT '{}'::jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_property_id_unique" UNIQUE("property_id")
);
--> statement-breakpoint
CREATE TABLE "property_insight_shares" (
	"id" serial PRIMARY KEY NOT NULL,
	"share_id" text NOT NULL,
	"property_id" text NOT NULL,
	"property_name" text,
	"property_address" text,
	"title" text NOT NULL,
	"insight_type" text NOT NULL,
	"insight_data" jsonb NOT NULL,
	"format" text DEFAULT 'detailed' NOT NULL,
	"created_by" integer,
	"access_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"password" text,
	"allowed_domains" text[],
	CONSTRAINT "property_insight_shares_share_id_unique" UNIQUE("share_id")
);
--> statement-breakpoint
CREATE TABLE "schema_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"source_type" text NOT NULL,
	"target_type" text NOT NULL,
	"mapping_rules" jsonb NOT NULL,
	"custom_functions" jsonb,
	"created_by" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_workflow_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"shared_workflow_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_workflow_collaborators" (
	"id" serial PRIMARY KEY NOT NULL,
	"shared_workflow_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"invited_by" integer NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shared_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"workflow_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'active' NOT NULL,
	"share_code" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_by" integer NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_workflows_share_code_unique" UNIQUE("share_code")
);
--> statement-breakpoint
CREATE TABLE "system_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_type" text NOT NULL,
	"component" text NOT NULL,
	"status" text DEFAULT 'info' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"attachments" text[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "team_feedbacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"category" text NOT NULL,
	"task_id" uuid
);
--> statement-breakpoint
CREATE TABLE "team_knowledge_base_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tags" text[] DEFAULT '{}',
	"attachments" text[] DEFAULT '{}',
	"related_item_ids" uuid[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"capabilities" jsonb NOT NULL,
	"avatar" text,
	"email" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"assigned_to" integer,
	"created_by" integer NOT NULL,
	"status" text DEFAULT 'backlog' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"estimated_hours" numeric,
	"actual_hours" numeric,
	"tags" text[] DEFAULT '{}',
	"attachments" text[] DEFAULT '{}'
);
--> statement-breakpoint
CREATE TABLE "ui_component_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"component_type" text NOT NULL,
	"framework" text NOT NULL,
	"code" text NOT NULL,
	"preview_image" text,
	"tags" text[],
	"created_by" integer NOT NULL,
	"is_public" boolean DEFAULT false,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_personality_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"personality_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "validation_issues" (
	"id" serial PRIMARY KEY NOT NULL,
	"issue_id" varchar(100) NOT NULL,
	"rule_id" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"property_id" varchar(100),
	"level" varchar(20) NOT NULL,
	"message" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"resolution" text,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "validation_issues_issue_id_unique" UNIQUE("issue_id")
);
--> statement-breakpoint
CREATE TABLE "validation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"level" varchar(20) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"implementation" text,
	"parameters" jsonb DEFAULT '{}'::jsonb,
	"reference" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	CONSTRAINT "validation_rules_rule_id_unique" UNIQUE("rule_id")
);
--> statement-breakpoint
CREATE TABLE "voice_command_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"user_id" integer,
	"total_commands" integer DEFAULT 0 NOT NULL,
	"successful_commands" integer DEFAULT 0 NOT NULL,
	"failed_commands" integer DEFAULT 0 NOT NULL,
	"ambiguous_commands" integer DEFAULT 0 NOT NULL,
	"avg_response_time" integer,
	"command_type_counts" jsonb,
	"top_commands" jsonb,
	"top_error_triggers" jsonb,
	"avg_confidence_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_command_help_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"command_type" text NOT NULL,
	"context_id" text,
	"title" text NOT NULL,
	"example_phrases" text[] NOT NULL,
	"description" text NOT NULL,
	"parameters" jsonb,
	"response_example" text,
	"priority" integer DEFAULT 0,
	"is_hidden" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_command_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer NOT NULL,
	"raw_command" text NOT NULL,
	"processed_command" text,
	"command_type" text NOT NULL,
	"intent_recognized" text,
	"parameters" jsonb,
	"status" text NOT NULL,
	"response_time" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"context_data" jsonb,
	"confidence_score" real,
	"error_message" text,
	"agent_responses" jsonb,
	"device_info" jsonb,
	"speed_factor" real
);
--> statement-breakpoint
CREATE TABLE "voice_command_shortcuts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"shortcut_phrase" text NOT NULL,
	"expanded_command" text NOT NULL,
	"command_type" text NOT NULL,
	"description" text,
	"priority" integer DEFAULT 0,
	"is_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp,
	"usage_count" integer DEFAULT 0,
	"is_global" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "workflow_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"definition_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"steps" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	CONSTRAINT "workflow_definitions_definition_id_unique" UNIQUE("definition_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"definition_id" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar(100) NOT NULL,
	"current_step_id" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"assigned_to" integer,
	"priority" varchar(20) DEFAULT 'normal',
	"data" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_instances_instance_id_unique" UNIQUE("instance_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"shared_workflow_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"created_by" integer NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"participants" jsonb DEFAULT '[]'::jsonb,
	CONSTRAINT "workflow_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_step_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" varchar(100) NOT NULL,
	"step_id" varchar(100) NOT NULL,
	"status" varchar(20) NOT NULL,
	"assigned_to" integer,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"workspace_theme" text DEFAULT 'system',
	"code_editor_theme" text DEFAULT 'dark',
	"workspace_layout" text DEFAULT 'standard',
	"font_size" integer DEFAULT 14,
	"font_family" text DEFAULT 'JetBrains Mono',
	"line_height" numeric DEFAULT 1.5,
	"show_minimap" boolean DEFAULT true,
	"tab_size" integer DEFAULT 2,
	"word_wrap" boolean DEFAULT false,
	"auto_save" boolean DEFAULT true,
	"live_code_completion" boolean DEFAULT true,
	"preferred_languages" text[] DEFAULT '{"typescript","javascript"}',
	"favorite_tools" text[] DEFAULT '{}',
	"custom_ui_colors" jsonb DEFAULT '{}'::jsonb,
	"dashboard_layout" jsonb DEFAULT '{}'::jsonb,
	"sidebar_configuration" jsonb DEFAULT '{}'::jsonb,
	"notification_preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assessment_model_versions" ADD CONSTRAINT "assessment_model_versions_model_id_assessment_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assessment_models"("model_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_preview_settings" ADD CONSTRAINT "dev_preview_settings_project_id_dev_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dev_projects"("project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dev_project_files" ADD CONSTRAINT "dev_project_files_project_id_dev_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."dev_projects"("project_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_calculations" ADD CONSTRAINT "model_calculations_model_id_assessment_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assessment_models"("model_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_calculations" ADD CONSTRAINT "model_calculations_output_variable_id_model_variables_id_fk" FOREIGN KEY ("output_variable_id") REFERENCES "public"."model_variables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_components" ADD CONSTRAINT "model_components_model_id_assessment_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assessment_models"("model_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_test_cases" ADD CONSTRAINT "model_test_cases_model_id_assessment_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assessment_models"("model_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_validation_rules" ADD CONSTRAINT "model_validation_rules_model_id_assessment_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assessment_models"("model_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_variables" ADD CONSTRAINT "model_variables_model_id_assessment_models_model_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."assessment_models"("model_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personalized_developer_agents" ADD CONSTRAINT "personalized_developer_agents_personality_id_assistant_personalities_id_fk" FOREIGN KEY ("personality_id") REFERENCES "public"."assistant_personalities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_workflow_activities" ADD CONSTRAINT "shared_workflow_activities_shared_workflow_id_shared_workflows_id_fk" FOREIGN KEY ("shared_workflow_id") REFERENCES "public"."shared_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_workflow_collaborators" ADD CONSTRAINT "shared_workflow_collaborators_shared_workflow_id_shared_workflows_id_fk" FOREIGN KEY ("shared_workflow_id") REFERENCES "public"."shared_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_workflows" ADD CONSTRAINT "shared_workflows_workflow_id_workflow_definitions_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflow_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_team_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."team_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_feedbacks" ADD CONSTRAINT "team_feedbacks_task_id_team_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."team_tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_personality_preferences" ADD CONSTRAINT "user_personality_preferences_personality_id_assistant_personalities_id_fk" FOREIGN KEY ("personality_id") REFERENCES "public"."assistant_personalities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_sessions" ADD CONSTRAINT "workflow_sessions_shared_workflow_id_shared_workflows_id_fk" FOREIGN KEY ("shared_workflow_id") REFERENCES "public"."shared_workflows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_experiences_agent_id_idx" ON "agent_experiences" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_experiences_priority_idx" ON "agent_experiences" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "agent_experiences_entity_type_idx" ON "agent_experiences" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "agent_knowledge_base_agent_type_idx" ON "agent_knowledge_base" USING btree ("agent_id","knowledge_type");--> statement-breakpoint
CREATE INDEX "agent_knowledge_base_title_idx" ON "agent_knowledge_base" USING btree ("title");--> statement-breakpoint
CREATE INDEX "agent_learning_events_agent_id_idx" ON "agent_learning_events" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_learning_events_event_type_idx" ON "agent_learning_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "agent_learning_events_created_at_idx" ON "agent_learning_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_learning_models_agent_model_version_idx" ON "agent_learning_models" USING btree ("agent_id","model_name","version");--> statement-breakpoint
CREATE INDEX "agent_learning_models_active_idx" ON "agent_learning_models" USING btree ("active");--> statement-breakpoint
CREATE INDEX "agent_perf_metrics_agent_metric_time_idx" ON "agent_performance_metrics" USING btree ("agent_id","metric_type","timeframe");--> statement-breakpoint
CREATE INDEX "agent_perf_metrics_created_at_idx" ON "agent_performance_metrics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "agent_user_feedback_agent_id_idx" ON "agent_user_feedback" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_user_feedback_sentiment_idx" ON "agent_user_feedback" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX "api_documentation_name_version_idx" ON "api_documentation" USING btree ("name","version");--> statement-breakpoint
CREATE INDEX "api_documentation_created_by_idx" ON "api_documentation" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "assistant_personality_name_idx" ON "assistant_personalities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "assistant_personality_user_idx" ON "assistant_personalities" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "code_snippets_language_type_idx" ON "code_snippets" USING btree ("language","snippet_type");--> statement-breakpoint
CREATE INDEX "code_snippets_created_by_idx" ON "code_snippets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "compatibility_layers_project_id_idx" ON "compatibility_layers" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "compatibility_layers_name_idx" ON "compatibility_layers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "connection_templates_name_idx" ON "connection_templates" USING btree ("name");--> statement-breakpoint
CREATE INDEX "connection_templates_created_by_idx" ON "connection_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "connection_templates_type_idx" ON "connection_templates" USING btree ("database_type");--> statement-breakpoint
CREATE INDEX "conversion_logs_project_id_idx" ON "conversion_logs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "conversion_logs_timestamp_idx" ON "conversion_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "conversion_logs_level_idx" ON "conversion_logs" USING btree ("level");--> statement-breakpoint
CREATE INDEX "data_pipelines_name_idx" ON "data_pipelines" USING btree ("name");--> statement-breakpoint
CREATE INDEX "data_pipelines_created_by_idx" ON "data_pipelines" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "data_pipelines_type_idx" ON "data_pipelines" USING btree ("pipeline_type");--> statement-breakpoint
CREATE INDEX "data_visualizations_name_idx" ON "data_visualizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "data_visualizations_created_by_idx" ON "data_visualizations" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "data_visualizations_type_idx" ON "data_visualizations" USING btree ("visualization_type");--> statement-breakpoint
CREATE INDEX "db_conversion_projects_name_idx" ON "database_conversion_projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "db_conversion_projects_created_by_idx" ON "database_conversion_projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "db_conversion_projects_status_idx" ON "database_conversion_projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "debugging_sessions_project_id_idx" ON "debugging_sessions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "debugging_sessions_created_by_idx" ON "debugging_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "design_systems_name_idx" ON "design_systems" USING btree ("name");--> statement-breakpoint
CREATE INDEX "design_systems_created_by_idx" ON "design_systems" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "dev_activity_user_activity_idx" ON "developer_activity_sessions" USING btree ("user_id","activity_type");--> statement-breakpoint
CREATE INDEX "dev_activity_time_range_idx" ON "developer_activity_sessions" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "dev_productivity_user_date_idx" ON "developer_productivity_metrics" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "dev_productivity_energy_level_idx" ON "developer_productivity_metrics" USING btree ("energy_level");--> statement-breakpoint
CREATE INDEX "dev_project_files_project_path_idx" ON "development_project_files" USING btree ("project_id","path");--> statement-breakpoint
CREATE INDEX "energy_rec_user_level_idx" ON "energy_level_recommendations" USING btree ("user_id","energy_level");--> statement-breakpoint
CREATE INDEX "enhanced_dev_projects_name_idx" ON "enhanced_dev_projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "enhanced_dev_projects_created_by_idx" ON "enhanced_dev_projects" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "enhanced_team_sessions_name_idx" ON "enhanced_team_sessions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "enhanced_team_sessions_created_by_idx" ON "enhanced_team_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "enhanced_team_sessions_type_idx" ON "enhanced_team_sessions" USING btree ("collaboration_type");--> statement-breakpoint
CREATE INDEX "learning_paths_name_idx" ON "learning_paths" USING btree ("name");--> statement-breakpoint
CREATE INDEX "learning_paths_created_by_idx" ON "learning_paths" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "learning_paths_difficulty_idx" ON "learning_paths" USING btree ("difficulty_level");--> statement-breakpoint
CREATE INDEX "personality_template_category_idx" ON "personality_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "personalized_dev_agents_name_user_idx" ON "personalized_developer_agents" USING btree ("name","user_id");--> statement-breakpoint
CREATE INDEX "personalized_dev_agents_specialization_idx" ON "personalized_developer_agents" USING btree ("specialization");--> statement-breakpoint
CREATE INDEX "schema_mappings_name_idx" ON "schema_mappings" USING btree ("name");--> statement-breakpoint
CREATE INDEX "schema_mappings_source_target_idx" ON "schema_mappings" USING btree ("source_type","target_type");--> statement-breakpoint
CREATE INDEX "shared_workflow_activities_workflow_idx" ON "shared_workflow_activities" USING btree ("shared_workflow_id");--> statement-breakpoint
CREATE INDEX "shared_workflow_collaborators_unique_user_workflow_idx" ON "shared_workflow_collaborators" USING btree ("shared_workflow_id","user_id");--> statement-breakpoint
CREATE INDEX "shared_workflows_share_code_idx" ON "shared_workflows" USING btree ("share_code");--> statement-breakpoint
CREATE INDEX "shared_workflows_created_by_idx" ON "shared_workflows" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "shared_workflows_status_idx" ON "shared_workflows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ui_component_templates_created_by_idx" ON "ui_component_templates" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "ui_component_templates_type_idx" ON "ui_component_templates" USING btree ("component_type");--> statement-breakpoint
CREATE INDEX "user_personality_pref_idx" ON "user_personality_preferences" USING btree ("user_id","personality_id");--> statement-breakpoint
CREATE INDEX "validation_issues_rule_id_idx" ON "validation_issues" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "validation_issues_entity_type_id_idx" ON "validation_issues" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "validation_issues_property_id_idx" ON "validation_issues" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "validation_issues_status_idx" ON "validation_issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "validation_issues_level_idx" ON "validation_issues" USING btree ("level");--> statement-breakpoint
CREATE INDEX "voice_command_analytics_user_date_idx" ON "voice_command_analytics" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "voice_command_analytics_date_idx" ON "voice_command_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "voice_command_help_context_type_idx" ON "voice_command_help_contents" USING btree ("context_id","command_type");--> statement-breakpoint
CREATE INDEX "voice_command_shortcuts_user_shortcut_idx" ON "voice_command_shortcuts" USING btree ("user_id","shortcut_phrase");--> statement-breakpoint
CREATE INDEX "workflow_instances_definition_id_idx" ON "workflow_instances" USING btree ("definition_id");--> statement-breakpoint
CREATE INDEX "workflow_instances_entity_type_id_idx" ON "workflow_instances" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_instances_assigned_to_idx" ON "workflow_instances" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "workflow_sessions_active_idx" ON "workflow_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workflow_step_history_instance_id_idx" ON "workflow_step_history" USING btree ("instance_id");--> statement-breakpoint
CREATE INDEX "workspace_preferences_user_idx" ON "workspace_preferences" USING btree ("user_id");