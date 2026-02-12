// Time Tracker Plugin Implementation

let manifest = #{
    id: "time-tracker",
    name: "Time Tracker",
    version: "1.0.0"
};

let config = #{
    auto_track: true,
    idle_threshold: 5,
    daily_goal: 8,
    export_format: "csv"
};

let tracking_state = #{
    current_phase: "",
    session_start: 0,
    total_today: 0,
    is_tracking: false,
    last_activity: 0
};

let time_data = #{
    sessions: [],
    daily_totals: #{}
};

fn on_load(context) {
    print("Time tracker plugin loaded");
    
    // Load configuration
    let plugin_config = context.api.get_config("time-tracker");
    if plugin_config != () {
        config.auto_track = plugin_config.auto_track || true;
        config.idle_threshold = plugin_config.idle_threshold || 5;
        config.daily_goal = plugin_config.daily_goal || 8;
        config.export_format = plugin_config.export_format || "csv";
    }
    
    // Load existing time data
    load_time_data();
}

fn on_enable() {
    print("Time tracker plugin enabled");
    
    if config.auto_track {
        // Subscribe to phase events
        context.api.subscribe_event("phase-changed", "on_phase_changed");
        context.api.subscribe_event("phase-completed", "on_phase_completed");
        context.api.subscribe_event("user-activity", "on_user_activity");
    }
}

fn on_disable() {
    print("Time tracker plugin disabled");
    
    // Stop current tracking session
    if tracking_state.is_tracking {
        stop_tracking();
    }
    
    // Unsubscribe from events
    context.api.unsubscribe_event("phase-changed", "on_phase_changed");
    context.api.unsubscribe_event("phase-completed", "on_phase_completed");
    context.api.unsubscribe_event("user-activity", "on_user_activity");
}

fn on_unload() {
    print("Time tracker plugin unloaded");
    save_time_data();
}

fn start() {
    print("Time tracker service started");
    
    // Start background timer to check for idle time
    context.api.set_interval("check_idle", 60000); // Check every minute
}

fn stop() {
    print("Time tracker service stopped");
    
    if tracking_state.is_tracking {
        stop_tracking();
    }
    
    context.api.clear_interval("check_idle");
}

fn status() {
    let now = timestamp();
    let session_duration = if tracking_state.is_tracking {
        (now - tracking_state.session_start) / 1000 / 60 // minutes
    } else {
        0
    };
    
    #{
        running: tracking_state.is_tracking,
        current_phase: tracking_state.current_phase,
        session_duration: session_duration,
        daily_total: get_daily_total(today_date()),
        daily_goal: config.daily_goal * 60, // in minutes
        start_time: tracking_state.session_start
    }
}

fn get_capabilities() {
    [
        #{
            id: "start-tracking",
            name: "Start Time Tracking",
            description: "Start tracking time for current phase",
            category: "time",
            params_schema: #{
                type: "object",
                properties: #{
                    phase: #{ type: "string" }
                }
            }
        },
        #{
            id: "stop-tracking",
            name: "Stop Time Tracking",
            description: "Stop current time tracking session",
            category: "time",
            params_schema: #{}
        },
        #{
            id: "get-report",
            name: "Generate Time Report",
            description: "Generate a time tracking report",
            category: "reports",
            params_schema: #{
                type: "object",
                properties: #{
                    start_date: #{ type: "string" },
                    end_date: #{ type: "string" },
                    format: #{ type: "string", enum: ["json", "csv", "markdown"] }
                }
            }
        }
    ]
}

fn execute_action(action, params) {
    if action == "start-tracking" {
        let phase = params.phase || "unknown";
        start_tracking(phase)
    } else if action == "stop-tracking" {
        stop_tracking()
    } else if action == "get-report" {
        generate_report(
            params.start_date || "",
            params.end_date || "",
            params.format || config.export_format
        )
    } else {
        throw "Unknown action: " + action;
    }
}

fn on_phase_changed(event_data) {
    let new_phase = event_data.phase || "unknown";
    
    if tracking_state.is_tracking && tracking_state.current_phase != new_phase {
        // Stop current tracking and start new one
        stop_tracking();
        start_tracking(new_phase);
    } else if !tracking_state.is_tracking && config.auto_track {
        start_tracking(new_phase);
    }
}

fn on_phase_completed(event_data) {
    if tracking_state.is_tracking {
        stop_tracking();
    }
}

fn on_user_activity(event_data) {
    tracking_state.last_activity = timestamp();
}

fn start_tracking(phase) {
    if tracking_state.is_tracking {
        stop_tracking();
    }
    
    tracking_state.current_phase = phase;
    tracking_state.session_start = timestamp();
    tracking_state.is_tracking = true;
    tracking_state.last_activity = timestamp();
    
    print(`Started tracking time for phase: ${phase}`);
    
    // Emit event
    context.api.emit_event("time-tracking-started", #{
        phase: phase,
        start_time: tracking_state.session_start
    });
    
    return #{
        success: true,
        phase: phase,
        start_time: tracking_state.session_start
    };
}

fn stop_tracking() {
    if !tracking_state.is_tracking {
        return #{
            success: false,
            error: "No active tracking session"
        };
    }
    
    let end_time = timestamp();
    let duration = (end_time - tracking_state.session_start) / 1000 / 60; // minutes
    
    // Save session data
    let session = #{
        phase: tracking_state.current_phase,
        start_time: tracking_state.session_start,
        end_time: end_time,
        duration: duration,
        date: today_date()
    };
    
    time_data.sessions.push(session);
    
    // Update daily total
    let today = today_date();
    if time_data.daily_totals[today] == () {
        time_data.daily_totals[today] = 0;
    }
    time_data.daily_totals[today] += duration;
    
    print(`Stopped tracking. Session duration: ${duration} minutes`);
    
    // Reset tracking state
    tracking_state.current_phase = "";
    tracking_state.session_start = 0;
    tracking_state.is_tracking = false;
    
    // Save data
    save_time_data();
    
    // Emit event
    context.api.emit_event("time-tracking-stopped", #{
        duration: duration,
        daily_total: time_data.daily_totals[today]
    });
    
    return #{
        success: true,
        duration: duration,
        daily_total: time_data.daily_totals[today]
    };
}

fn check_idle() {
    if !tracking_state.is_tracking {
        return;
    }
    
    let now = timestamp();
    let idle_time = (now - tracking_state.last_activity) / 1000 / 60; // minutes
    
    if idle_time > config.idle_threshold {
        print(`User idle for ${idle_time} minutes, stopping tracking`);
        stop_tracking();
        
        context.api.emit_event("user-idle-detected", #{
            idle_time: idle_time,
            threshold: config.idle_threshold
        });
    }
}

fn generate_report(start_date, end_date, format) {
    let sessions = filter_sessions_by_date(start_date, end_date);
    
    if format == "json" {
        return generate_json_report(sessions);
    } else if format == "csv" {
        return generate_csv_report(sessions);
    } else if format == "markdown" {
        return generate_markdown_report(sessions);
    } else {
        throw "Unsupported format: " + format;
    }
}

fn generate_json_report(sessions) {
    let report = #{
        summary: calculate_summary(sessions),
        sessions: sessions,
        generated_at: timestamp()
    };
    
    return #{
        success: true,
        format: "json",
        data: report
    };
}

fn generate_csv_report(sessions) {
    let csv = "Date,Phase,Duration (minutes),Start Time,End Time\n";
    
    for session in sessions {
        csv += `${session.date},${session.phase},${session.duration},${format_timestamp(session.start_time)},${format_timestamp(session.end_time)}\n`;
    }
    
    return #{
        success: true,
        format: "csv",
        data: csv
    };
}

fn generate_markdown_report(sessions) {
    let summary = calculate_summary(sessions);
    
    let markdown = "# Time Tracking Report\n\n";
    markdown += `**Total Time:** ${summary.total_hours} hours (${summary.total_minutes} minutes)\n`;
    markdown += `**Sessions:** ${summary.session_count}\n`;
    markdown += `**Average Session:** ${summary.avg_session} minutes\n\n`;
    
    markdown += "## Phase Breakdown\n\n";
    for phase in summary.by_phase {
        markdown += `- **${phase.name}:** ${phase.duration} minutes (${phase.percentage}%)\n`;
    }
    
    markdown += "\n## Sessions\n\n";
    markdown += "| Date | Phase | Duration | Start | End |\n";
    markdown += "|------|-------|----------|-------|-----|\n";
    
    for session in sessions {
        markdown += `| ${session.date} | ${session.phase} | ${session.duration}m | ${format_timestamp(session.start_time)} | ${format_timestamp(session.end_time)} |\n`;
    }
    
    return #{
        success: true,
        format: "markdown",
        data: markdown
    };
}

fn calculate_summary(sessions) {
    let total_minutes = 0;
    let by_phase = #{};
    
    for session in sessions {
        total_minutes += session.duration;
        
        if by_phase[session.phase] == () {
            by_phase[session.phase] = 0;
        }
        by_phase[session.phase] += session.duration;
    }
    
    let phase_breakdown = [];
    for phase in by_phase {
        phase_breakdown.push(#{
            name: phase,
            duration: by_phase[phase],
            percentage: round((by_phase[phase] / total_minutes) * 100, 1)
        });
    }
    
    #{
        total_minutes: total_minutes,
        total_hours: round(total_minutes / 60, 2),
        session_count: sessions.len(),
        avg_session: round(total_minutes / sessions.len(), 1),
        by_phase: phase_breakdown
    }
}

fn filter_sessions_by_date(start_date, end_date) {
    if start_date == "" && end_date == "" {
        return time_data.sessions;
    }
    
    let filtered = [];
    for session in time_data.sessions {
        let session_date = session.date;
        
        let include = true;
        if start_date != "" && session_date < start_date {
            include = false;
        }
        if end_date != "" && session_date > end_date {
            include = false;
        }
        
        if include {
            filtered.push(session);
        }
    }
    
    return filtered;
}

fn get_daily_total(date) {
    return time_data.daily_totals[date] || 0;
}

fn load_time_data() {
    // Load from storage
    let stored_data = context.api.get_storage("time-tracker-data");
    if stored_data != () {
        time_data = stored_data;
    }
}

fn save_time_data() {
    context.api.set_storage("time-tracker-data", time_data);
}

// Helper functions
fn timestamp() {
    // Current timestamp in milliseconds
    unix_timestamp() * 1000
}

fn today_date() {
    // Return date in YYYY-MM-DD format
    format_date(timestamp())
}

fn format_timestamp(ts) {
    // Format timestamp for display
    format_datetime(ts)
}

fn round(value, decimals) {
    let factor = pow(10, decimals);
    floor(value * factor + 0.5) / factor
}