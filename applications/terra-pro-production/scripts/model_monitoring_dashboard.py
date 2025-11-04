#!/usr/bin/env python3
"""
TerraFusion Model Monitoring Dashboard
Visualizes model performance metrics and audit logs

Usage:
  python model_monitoring_dashboard.py
"""

import os
import sys
import csv
import json
import datetime
import argparse
import webbrowser
from pathlib import Path
from typing import Dict, Any, List, Optional

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import audit inference module
from backend.audit_inference import AUDIT_PATH, get_inference_stats

try:
    import pandas as pd
    import matplotlib.pyplot as plt
    import numpy as np
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    import tkinter as tk
    from tkinter import ttk
    DASHBOARD_AVAILABLE = True
except ImportError:
    DASHBOARD_AVAILABLE = False
    print("Dashboard dependencies not installed. Please install pandas, matplotlib, and numpy.")
    print("Run: pip install pandas matplotlib numpy")

# Define dashboard class
class ModelMonitoringDashboard:
    """Dashboard for monitoring model performance"""
    
    def __init__(self, master):
        self.master = master
        master.title("TerraFusion Model Monitoring Dashboard")
        master.geometry("1200x800")
        
        # Create tab control
        self.tab_control = ttk.Notebook(master)
        
        # Create tabs
        self.overview_tab = ttk.Frame(self.tab_control)
        self.version_tab = ttk.Frame(self.tab_control)
        self.feedback_tab = ttk.Frame(self.tab_control)
        self.fallback_tab = ttk.Frame(self.tab_control)
        self.logs_tab = ttk.Frame(self.tab_control)
        
        # Add tabs to notebook
        self.tab_control.add(self.overview_tab, text="Overview")
        self.tab_control.add(self.version_tab, text="Version Analysis")
        self.tab_control.add(self.feedback_tab, text="Feedback Analysis")
        self.tab_control.add(self.fallback_tab, text="Fallback Metrics")
        self.tab_control.add(self.logs_tab, text="Raw Logs")
        
        self.tab_control.pack(expand=1, fill="both")
        
        # Initialize data
        self.load_data()
        
        # Render tabs
        self.render_overview_tab()
        self.render_version_tab()
        self.render_feedback_tab()
        self.render_fallback_tab()
        self.render_logs_tab()
        
        # Refresh button
        refresh_button = ttk.Button(master, text="Refresh Data", command=self.refresh_data)
        refresh_button.pack(pady=10)
        
        # Status label
        self.status_label = ttk.Label(master, text="Dashboard loaded successfully")
        self.status_label.pack(pady=5)
    
    def load_data(self):
        """Load data from audit logs"""
        try:
            # Check if audit log exists
            if not os.path.exists(AUDIT_PATH):
                self.df = pd.DataFrame(columns=[
                    "timestamp", "filename", "model_name", "model_version", 
                    "score", "confidence", "execution_time_ms", "fallback_used", 
                    "user_id", "metadata"
                ])
                self.status_label.config(text="No audit logs found. Dashboard showing sample data.")
                return
            
            # Load audit log as DataFrame
            self.df = pd.read_csv(AUDIT_PATH)
            
            # Convert timestamp to datetime
            self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])
            
            # Convert score to float
            self.df['score'] = pd.to_numeric(self.df['score'], errors='coerce')
            
            # Convert execution_time_ms to float
            self.df['execution_time_ms'] = pd.to_numeric(self.df['execution_time_ms'], errors='coerce')
            
            # Convert fallback_used to boolean
            self.df['fallback_used'] = self.df['fallback_used'].map({'True': True, 'False': False, True: True, False: False})
            
            # Extract feedback information from metadata
            self.df['has_feedback'] = self.df['metadata'].apply(
                lambda x: 'feedback' in str(x).lower() and 'true' in str(x).lower()
            )
            
            self.status_label.config(text=f"Loaded {len(self.df)} inference records from audit log")
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            self.status_label.config(text=f"Error loading data: {str(e)}")
            # Create empty DataFrame
            self.df = pd.DataFrame(columns=[
                "timestamp", "filename", "model_name", "model_version", 
                "score", "confidence", "execution_time_ms", "fallback_used", 
                "user_id", "metadata"
            ])
    
    def refresh_data(self):
        """Refresh data and update all tabs"""
        self.load_data()
        
        # Clear and redraw all tabs
        for widget in self.overview_tab.winfo_children():
            widget.destroy()
        for widget in self.version_tab.winfo_children():
            widget.destroy()
        for widget in self.feedback_tab.winfo_children():
            widget.destroy()
        for widget in self.fallback_tab.winfo_children():
            widget.destroy()
        for widget in self.logs_tab.winfo_children():
            widget.destroy()
        
        # Render tabs again
        self.render_overview_tab()
        self.render_version_tab()
        self.render_feedback_tab()
        self.render_fallback_tab()
        self.render_logs_tab()
        
        self.status_label.config(text=f"Data refreshed at {datetime.datetime.now().strftime('%H:%M:%S')}")
    
    def render_overview_tab(self):
        """Render the overview tab"""
        # Create a frame for the overview tab
        overview_frame = ttk.Frame(self.overview_tab)
        overview_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Header
        header_label = ttk.Label(
            overview_frame, 
            text="TerraFusion Model Performance Overview", 
            font=("Arial", 16, "bold")
        )
        header_label.pack(pady=10)
        
        # Statistics frame
        stats_frame = ttk.Frame(overview_frame)
        stats_frame.pack(fill="x", pady=10)
        
        # Calculate statistics
        if len(self.df) > 0:
            total_inferences = len(self.df)
            unique_versions = self.df['model_version'].nunique()
            avg_score = self.df['score'].mean()
            fallback_rate = (self.df['fallback_used'] == True).mean() * 100
            
            # Recent performance (last day)
            recent_df = self.df[self.df['timestamp'] > pd.Timestamp.now() - pd.Timedelta(days=1)]
            recent_count = len(recent_df)
            
            # Get score distribution
            score_dist = {
                "1.0-1.9": len(self.df[(self.df['score'] >= 1.0) & (self.df['score'] < 2.0)]),
                "2.0-2.9": len(self.df[(self.df['score'] >= 2.0) & (self.df['score'] < 3.0)]),
                "3.0-3.9": len(self.df[(self.df['score'] >= 3.0) & (self.df['score'] < 4.0)]),
                "4.0-5.0": len(self.df[(self.df['score'] >= 4.0) & (self.df['score'] <= 5.0)])
            }
        else:
            total_inferences = 0
            unique_versions = 0
            avg_score = 0
            fallback_rate = 0
            recent_count = 0
            score_dist = {"1.0-1.9": 0, "2.0-2.9": 0, "3.0-3.9": 0, "4.0-5.0": 0}
        
        # Create statistics grid
        stat_items = [
            ("Total Inferences", f"{total_inferences:,}"),
            ("Model Versions Used", f"{unique_versions}"),
            ("Average Condition Score", f"{avg_score:.2f}"),
            ("Fallback Rate", f"{fallback_rate:.2f}%"),
            ("Inferences (Last 24h)", f"{recent_count:,}")
        ]
        
        # Create grid of statistic cards
        for i, (label, value) in enumerate(stat_items):
            card_frame = ttk.Frame(stats_frame, borderwidth=2, relief="solid")
            card_frame.grid(row=0, column=i, padx=10, pady=5, sticky="nsew")
            
            label_widget = ttk.Label(card_frame, text=label, font=("Arial", 10))
            label_widget.pack(pady=(10, 5))
            
            value_widget = ttk.Label(card_frame, text=value, font=("Arial", 16, "bold"))
            value_widget.pack(pady=(0, 10))
        
        # Configure grid columns to be equal width
        for i in range(len(stat_items)):
            stats_frame.grid_columnconfigure(i, weight=1)
        
        # Create plots frame
        plots_frame = ttk.Frame(overview_frame)
        plots_frame.pack(fill="both", expand=True, pady=10)
        
        # Create left and right plot frames
        left_plot_frame = ttk.Frame(plots_frame)
        left_plot_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
        
        right_plot_frame = ttk.Frame(plots_frame)
        right_plot_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))
        
        # Create score distribution plot
        if len(self.df) > 0:
            fig1, ax1 = plt.subplots(figsize=(6, 4))
            colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']
            labels = list(score_dist.keys())
            sizes = list(score_dist.values())
            
            # Plot pie chart
            ax1.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
            ax1.axis('equal')
            ax1.set_title('Condition Score Distribution')
            
            canvas1 = FigureCanvasTkAgg(fig1, left_plot_frame)
            canvas1.draw()
            canvas1.get_tk_widget().pack(fill="both", expand=True)
            
            # Plot inference trend over time
            fig2, ax2 = plt.subplots(figsize=(6, 4))
            
            # Group by day and count
            daily_counts = self.df.resample('D', on='timestamp').size()
            
            # Plot last 30 days or all if less than 30
            days_to_plot = min(30, len(daily_counts))
            if days_to_plot > 0:
                daily_counts.tail(days_to_plot).plot(ax=ax2)
                ax2.set_xlabel('Date')
                ax2.set_ylabel('Number of Inferences')
                ax2.set_title('Daily Inference Volume')
                ax2.grid(True, linestyle='--', alpha=0.7)
                
                canvas2 = FigureCanvasTkAgg(fig2, right_plot_frame)
                canvas2.draw()
                canvas2.get_tk_widget().pack(fill="both", expand=True)
            else:
                # Not enough data
                no_data_label = ttk.Label(
                    right_plot_frame, 
                    text="Not enough data to display inference trend", 
                    font=("Arial", 12)
                )
                no_data_label.pack(pady=50)
        else:
            # No data available
            no_data_label1 = ttk.Label(
                left_plot_frame, 
                text="No data available for visualization", 
                font=("Arial", 12)
            )
            no_data_label1.pack(pady=50)
            
            no_data_label2 = ttk.Label(
                right_plot_frame, 
                text="No data available for visualization", 
                font=("Arial", 12)
            )
            no_data_label2.pack(pady=50)
    
    def render_version_tab(self):
        """Render the version analysis tab"""
        # Create a frame for the version tab
        version_frame = ttk.Frame(self.version_tab)
        version_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Header
        header_label = ttk.Label(
            version_frame, 
            text="Model Version Performance Analysis", 
            font=("Arial", 16, "bold")
        )
        header_label.pack(pady=10)
        
        if len(self.df) > 0:
            # Group by version
            version_stats = self.df.groupby('model_version').agg({
                'model_name': 'count',
                'score': ['mean', 'min', 'max', 'std'],
                'execution_time_ms': ['mean', 'std'],
                'fallback_used': 'mean'
            }).reset_index()
            
            # Rename columns
            version_stats.columns = [
                'Version', 'Count', 'Avg Score', 'Min Score', 'Max Score', 'Score Std Dev',
                'Avg Exec Time (ms)', 'Exec Time Std Dev', 'Fallback Rate'
            ]
            
            # Convert fallback rate to percentage
            version_stats['Fallback Rate'] = version_stats['Fallback Rate'] * 100
            
            # Create tree view
            tree_frame = ttk.Frame(version_frame)
            tree_frame.pack(fill="both", expand=True, pady=10)
            
            # Scrollbar
            scrollbar = ttk.Scrollbar(tree_frame)
            scrollbar.pack(side="right", fill="y")
            
            # Create treeview
            tree = ttk.Treeview(
                tree_frame, 
                columns=list(version_stats.columns), 
                show="headings",
                yscrollcommand=scrollbar.set
            )
            
            # Configure scrollbar
            scrollbar.config(command=tree.yview)
            
            # Set column headings
            for col in version_stats.columns:
                tree.heading(col, text=col)
                if col == 'Version':
                    tree.column(col, width=100)
                elif col == 'Count':
                    tree.column(col, width=80)
                else:
                    tree.column(col, width=120)
            
            # Add data to tree
            for i, row in version_stats.iterrows():
                values = [
                    row['Version'],
                    f"{row['Count']:,}",
                    f"{row['Avg Score']:.2f}",
                    f"{row['Min Score']:.2f}",
                    f"{row['Max Score']:.2f}",
                    f"{row['Score Std Dev']:.2f}",
                    f"{row['Avg Exec Time (ms)']:.2f}",
                    f"{row['Exec Time Std Dev']:.2f}",
                    f"{row['Fallback Rate']:.2f}%"
                ]
                tree.insert("", "end", values=values)
            
            tree.pack(fill="both", expand=True)
            
            # Create plots
            plots_frame = ttk.Frame(version_frame)
            plots_frame.pack(fill="both", expand=True, pady=10)
            
            # Create left and right plot frames
            left_plot_frame = ttk.Frame(plots_frame)
            left_plot_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
            
            right_plot_frame = ttk.Frame(plots_frame)
            right_plot_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))
            
            # Version usage pie chart
            fig1, ax1 = plt.subplots(figsize=(6, 4))
            colors = plt.cm.tab10.colors
            
            # Get version counts
            version_counts = self.df['model_version'].value_counts()
            
            # Plot pie chart
            ax1.pie(
                version_counts.values, 
                labels=version_counts.index, 
                colors=colors[:len(version_counts)], 
                autopct='%1.1f%%', 
                startangle=90
            )
            ax1.axis('equal')
            ax1.set_title('Model Version Usage')
            
            canvas1 = FigureCanvasTkAgg(fig1, left_plot_frame)
            canvas1.draw()
            canvas1.get_tk_widget().pack(fill="both", expand=True)
            
            # Version performance comparison
            fig2, ax2 = plt.subplots(figsize=(6, 4))
            
            # Prepare data
            versions = version_stats['Version']
            avg_scores = version_stats['Avg Score']
            error = version_stats['Score Std Dev']
            
            # Bar positions
            positions = np.arange(len(versions))
            
            # Create bars
            bars = ax2.barh(positions, avg_scores, xerr=error, align='center', alpha=0.7)
            
            # Labels and title
            ax2.set_yticks(positions)
            ax2.set_yticklabels(versions)
            ax2.set_xlabel('Average Condition Score')
            ax2.set_title('Average Score by Model Version')
            ax2.grid(True, linestyle='--', alpha=0.7, axis='x')
            
            # Add value labels
            for i, v in enumerate(avg_scores):
                ax2.text(v + 0.1, i, f"{v:.2f}", va='center')
            
            canvas2 = FigureCanvasTkAgg(fig2, right_plot_frame)
            canvas2.draw()
            canvas2.get_tk_widget().pack(fill="both", expand=True)
        else:
            # No data available
            no_data_label = ttk.Label(
                version_frame, 
                text="No data available for version analysis", 
                font=("Arial", 12)
            )
            no_data_label.pack(pady=50)
    
    def render_feedback_tab(self):
        """Render the feedback analysis tab"""
        # Create a frame for the feedback tab
        feedback_frame = ttk.Frame(self.feedback_tab)
        feedback_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Header
        header_label = ttk.Label(
            feedback_frame, 
            text="User Feedback Analysis", 
            font=("Arial", 16, "bold")
        )
        header_label.pack(pady=10)
        
        # Filter to only records with feedback
        feedback_df = self.df[self.df['has_feedback'] == True]
        
        if len(feedback_df) > 0:
            # Create feedback statistics section
            stats_frame = ttk.Frame(feedback_frame)
            stats_frame.pack(fill="x", pady=10)
            
            # Extract feedback details from metadata
            try:
                # Function to extract user score
                def extract_user_score(metadata_str):
                    try:
                        if isinstance(metadata_str, str) and 'user_score' in metadata_str:
                            # Try to extract as JSON first
                            try:
                                metadata = json.loads(metadata_str.replace("'", "\""))
                                if 'user_score' in metadata:
                                    return float(metadata['user_score'])
                            except:
                                pass
                            
                            # Try regex-based extraction
                            import re
                            match = re.search(r"'user_score':\s*([\d\.]+)", metadata_str)
                            if match:
                                return float(match.group(1))
                        return None
                    except:
                        return None
                
                # Function to extract score difference
                def extract_score_diff(metadata_str):
                    try:
                        if isinstance(metadata_str, str) and 'score_difference' in metadata_str:
                            # Try to extract as JSON first
                            try:
                                metadata = json.loads(metadata_str.replace("'", "\""))
                                if 'score_difference' in metadata:
                                    return float(metadata['score_difference'])
                            except:
                                pass
                            
                            # Try regex-based extraction
                            import re
                            match = re.search(r"'score_difference':\s*([-\d\.]+)", metadata_str)
                            if match:
                                return float(match.group(1))
                        return None
                    except:
                        return None
                
                # Extract scores and differences
                feedback_df['user_score'] = feedback_df['metadata'].apply(extract_user_score)
                feedback_df['score_diff'] = feedback_df['metadata'].apply(extract_score_diff)
                
                # Calculate statistics
                total_feedback = len(feedback_df)
                avg_ai_score = feedback_df['score'].mean()
                avg_user_score = feedback_df['user_score'].dropna().mean()
                avg_difference = feedback_df['score_diff'].dropna().mean()
                
                # Calculate agreement rate (within 0.5 points)
                close_match = feedback_df[feedback_df['score_diff'].abs() <= 0.5]
                agreement_rate = len(close_match) / total_feedback * 100 if total_feedback > 0 else 0
                
                # Create statistics grid
                stat_items = [
                    ("Total Feedback Records", f"{total_feedback:,}"),
                    ("Avg AI Score", f"{avg_ai_score:.2f}"),
                    ("Avg User Score", f"{avg_user_score:.2f}"),
                    ("Avg Difference", f"{avg_difference:.2f}"),
                    ("Agreement Rate", f"{agreement_rate:.2f}%")
                ]
                
                # Create grid of statistic cards
                for i, (label, value) in enumerate(stat_items):
                    card_frame = ttk.Frame(stats_frame, borderwidth=2, relief="solid")
                    card_frame.grid(row=0, column=i, padx=10, pady=5, sticky="nsew")
                    
                    label_widget = ttk.Label(card_frame, text=label, font=("Arial", 10))
                    label_widget.pack(pady=(10, 5))
                    
                    value_widget = ttk.Label(card_frame, text=value, font=("Arial", 16, "bold"))
                    value_widget.pack(pady=(0, 10))
                
                # Configure grid columns to be equal width
                for i in range(len(stat_items)):
                    stats_frame.grid_columnconfigure(i, weight=1)
                
                # Create plots
                plots_frame = ttk.Frame(feedback_frame)
                plots_frame.pack(fill="both", expand=True, pady=10)
                
                # Split into two sides
                left_plot_frame = ttk.Frame(plots_frame)
                left_plot_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
                
                right_plot_frame = ttk.Frame(plots_frame)
                right_plot_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))
                
                # Scatter plot of AI vs User scores
                fig1, ax1 = plt.subplots(figsize=(6, 4))
                
                # Filter to records with both scores
                valid_scores = feedback_df.dropna(subset=['score', 'user_score'])
                
                if len(valid_scores) > 0:
                    # Plot scatter with a bit of jitter for visibility
                    jitter = np.random.normal(0, 0.05, len(valid_scores))
                    sc = ax1.scatter(
                        valid_scores['score'] + jitter,
                        valid_scores['user_score'],
                        alpha=0.7,
                        c=valid_scores['score_diff'].abs(),
                        cmap='viridis'
                    )
                    
                    # Add perfect agreement line
                    min_val = min(valid_scores['score'].min(), valid_scores['user_score'].min())
                    max_val = max(valid_scores['score'].max(), valid_scores['user_score'].max())
                    ax1.plot([min_val, max_val], [min_val, max_val], 'r--', alpha=0.7)
                    
                    # Add colorbar
                    cbar = plt.colorbar(sc, ax=ax1)
                    cbar.set_label('Absolute Difference')
                    
                    # Labels and title
                    ax1.set_xlabel('AI Score')
                    ax1.set_ylabel('User Score')
                    ax1.set_title('AI vs User Score Comparison')
                    ax1.grid(True, linestyle='--', alpha=0.7)
                    
                    # Set equal aspect and limits
                    ax1.set_xlim(0.5, 5.5)
                    ax1.set_ylim(0.5, 5.5)
                    
                    canvas1 = FigureCanvasTkAgg(fig1, left_plot_frame)
                    canvas1.draw()
                    canvas1.get_tk_widget().pack(fill="both", expand=True)
                else:
                    no_data_label = ttk.Label(
                        left_plot_frame, 
                        text="No valid score pairs available", 
                        font=("Arial", 12)
                    )
                    no_data_label.pack(pady=50)
                
                # Histogram of score differences
                fig2, ax2 = plt.subplots(figsize=(6, 4))
                
                valid_diffs = feedback_df.dropna(subset=['score_diff'])
                
                if len(valid_diffs) > 0:
                    # Create histogram
                    ax2.hist(valid_diffs['score_diff'], bins=20, alpha=0.7, color='blue')
                    
                    # Add vertical line at 0 (perfect agreement)
                    ax2.axvline(x=0, color='r', linestyle='--', alpha=0.7)
                    
                    # Labels and title
                    ax2.set_xlabel('Score Difference (User - AI)')
                    ax2.set_ylabel('Frequency')
                    ax2.set_title('Distribution of Score Differences')
                    ax2.grid(True, linestyle='--', alpha=0.7)
                    
                    canvas2 = FigureCanvasTkAgg(fig2, right_plot_frame)
                    canvas2.draw()
                    canvas2.get_tk_widget().pack(fill="both", expand=True)
                else:
                    no_data_label = ttk.Label(
                        right_plot_frame, 
                        text="No valid score differences available", 
                        font=("Arial", 12)
                    )
                    no_data_label.pack(pady=50)
                
            except Exception as e:
                # If extraction fails
                error_label = ttk.Label(
                    feedback_frame, 
                    text=f"Error extracting feedback data: {str(e)}", 
                    font=("Arial", 12)
                )
                error_label.pack(pady=10)
                print(f"Error extracting feedback data: {str(e)}")
        else:
            # No feedback data available
            no_data_label = ttk.Label(
                feedback_frame, 
                text="No feedback data available for analysis", 
                font=("Arial", 12)
            )
            no_data_label.pack(pady=50)
    
    def render_fallback_tab(self):
        """Render the fallback metrics tab"""
        # Create a frame for the fallback tab
        fallback_frame = ttk.Frame(self.fallback_tab)
        fallback_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Header
        header_label = ttk.Label(
            fallback_frame, 
            text="Fallback System Analysis", 
            font=("Arial", 16, "bold")
        )
        header_label.pack(pady=10)
        
        if len(self.df) > 0:
            # Calculate fallback statistics
            fallback_records = self.df[self.df['fallback_used'] == True]
            total_fallbacks = len(fallback_records)
            fallback_rate = total_fallbacks / len(self.df) * 100 if len(self.df) > 0 else 0
            
            # Calculate fallback by version
            fallback_by_version = fallback_records.groupby('model_version').size()
            total_by_version = self.df.groupby('model_version').size()
            
            # Calculate rates
            fallback_rates = {}
            for version in total_by_version.index:
                if version in fallback_by_version:
                    fallback_rates[version] = fallback_by_version[version] / total_by_version[version] * 100
                else:
                    fallback_rates[version] = 0
            
            # Create fallback statistics section
            stats_frame = ttk.Frame(fallback_frame)
            stats_frame.pack(fill="x", pady=10)
            
            # Create statistics cards
            stat_items = [
                ("Total Fallbacks", f"{total_fallbacks:,}"),
                ("Overall Fallback Rate", f"{fallback_rate:.2f}%"),
                ("Primary Version", self.df['model_version'].value_counts().index[0] if not self.df.empty else "N/A"),
                ("Fallback Version", "1.0.0"),
                ("Avg Score with Fallback", f"{fallback_records['score'].mean():.2f}" if not fallback_records.empty else "N/A")
            ]
            
            # Create grid of statistic cards
            for i, (label, value) in enumerate(stat_items):
                card_frame = ttk.Frame(stats_frame, borderwidth=2, relief="solid")
                card_frame.grid(row=0, column=i, padx=10, pady=5, sticky="nsew")
                
                label_widget = ttk.Label(card_frame, text=label, font=("Arial", 10))
                label_widget.pack(pady=(10, 5))
                
                value_widget = ttk.Label(card_frame, text=value, font=("Arial", 16, "bold"))
                value_widget.pack(pady=(0, 10))
            
            # Configure grid columns to be equal width
            for i in range(len(stat_items)):
                stats_frame.grid_columnconfigure(i, weight=1)
            
            # Create plots frame
            plots_frame = ttk.Frame(fallback_frame)
            plots_frame.pack(fill="both", expand=True, pady=10)
            
            # Split into two sides
            left_plot_frame = ttk.Frame(plots_frame)
            left_plot_frame.pack(side="left", fill="both", expand=True, padx=(0, 5))
            
            right_plot_frame = ttk.Frame(plots_frame)
            right_plot_frame.pack(side="right", fill="both", expand=True, padx=(5, 0))
            
            # Fallback pie chart
            fig1, ax1 = plt.subplots(figsize=(6, 4))
            labels = ['Primary Model', 'Fallback']
            sizes = [len(self.df) - total_fallbacks, total_fallbacks]
            colors = ['#66b3ff', '#ff9999']
            
            # Plot pie chart
            ax1.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
            ax1.axis('equal')
            ax1.set_title('Fallback Usage')
            
            canvas1 = FigureCanvasTkAgg(fig1, left_plot_frame)
            canvas1.draw()
            canvas1.get_tk_widget().pack(fill="both", expand=True)
            
            # Fallback trend over time
            fig2, ax2 = plt.subplots(figsize=(6, 4))
            
            # Group by day and calculate fallback rate
            daily_data = self.df.resample('D', on='timestamp').agg({
                'fallback_used': 'mean',
                'model_version': 'count'
            })
            
            # Convert to percentage
            daily_data['fallback_rate'] = daily_data['fallback_used'] * 100
            
            # Plot fallback rate over time
            daily_data['fallback_rate'].plot(ax=ax2)
            
            # Labels and title
            ax2.set_xlabel('Date')
            ax2.set_ylabel('Fallback Rate (%)')
            ax2.set_title('Daily Fallback Rate')
            ax2.grid(True, linestyle='--', alpha=0.7)
            
            # Set y-axis limits
            ax2.set_ylim(0, 100)
            
            canvas2 = FigureCanvasTkAgg(fig2, right_plot_frame)
            canvas2.draw()
            canvas2.get_tk_widget().pack(fill="both", expand=True)
            
            # Create table of fallback rates by version
            table_frame = ttk.Frame(fallback_frame)
            table_frame.pack(fill="x", pady=10)
            
            # Create table header
            headers = ["Version", "Total Inferences", "Fallback Count", "Fallback Rate"]
            
            for i, header in enumerate(headers):
                header_label = ttk.Label(
                    table_frame, 
                    text=header,
                    font=("Arial", 10, "bold"),
                    borderwidth=1,
                    relief="solid",
                    padding=5,
                    width=20 if i > 0 else 15,
                    anchor="center"
                )
                header_label.grid(row=0, column=i, sticky="nsew")
            
            # Add data rows
            row_index = 1
            for version in sorted(total_by_version.index):
                version_label = ttk.Label(
                    table_frame,
                    text=version,
                    borderwidth=1,
                    relief="solid",
                    padding=5,
                    width=15,
                    anchor="center"
                )
                version_label.grid(row=row_index, column=0, sticky="nsew")
                
                total_label = ttk.Label(
                    table_frame,
                    text=f"{total_by_version[version]:,}",
                    borderwidth=1,
                    relief="solid",
                    padding=5,
                    width=20,
                    anchor="center"
                )
                total_label.grid(row=row_index, column=1, sticky="nsew")
                
                fallback_count = fallback_by_version[version] if version in fallback_by_version else 0
                count_label = ttk.Label(
                    table_frame,
                    text=f"{fallback_count:,}",
                    borderwidth=1,
                    relief="solid",
                    padding=5,
                    width=20,
                    anchor="center"
                )
                count_label.grid(row=row_index, column=2, sticky="nsew")
                
                rate_label = ttk.Label(
                    table_frame,
                    text=f"{fallback_rates[version]:.2f}%",
                    borderwidth=1,
                    relief="solid",
                    padding=5,
                    width=20,
                    anchor="center"
                )
                rate_label.grid(row=row_index, column=3, sticky="nsew")
                
                row_index += 1
            
            # Configure grid columns
            for i in range(len(headers)):
                table_frame.grid_columnconfigure(i, weight=1)
        else:
            # No data available
            no_data_label = ttk.Label(
                fallback_frame, 
                text="No data available for fallback analysis", 
                font=("Arial", 12)
            )
            no_data_label.pack(pady=50)
    
    def render_logs_tab(self):
        """Render the raw logs tab"""
        # Create a frame for the logs tab
        logs_frame = ttk.Frame(self.logs_tab)
        logs_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Header
        header_label = ttk.Label(
            logs_frame, 
            text="Raw Inference Logs", 
            font=("Arial", 16, "bold")
        )
        header_label.pack(pady=10)
        
        # Controls frame
        controls_frame = ttk.Frame(logs_frame)
        controls_frame.pack(fill="x", pady=10)
        
        # Filter label
        filter_label = ttk.Label(controls_frame, text="Filter by version:")
        filter_label.pack(side="left", padx=5)
        
        # Get unique versions
        versions = ["All"] + list(self.df['model_version'].unique())
        
        # Version combobox
        version_var = tk.StringVar(value="All")
        version_combo = ttk.Combobox(controls_frame, textvariable=version_var, values=versions, state="readonly")
        version_combo.pack(side="left", padx=5)
        
        # Export button
        export_button = ttk.Button(
            controls_frame, 
            text="Export Logs", 
            command=lambda: self.export_logs()
        )
        export_button.pack(side="right", padx=5)
        
        # Create tree view for logs
        tree_frame = ttk.Frame(logs_frame)
        tree_frame.pack(fill="both", expand=True, pady=10)
        
        # Scrollbars
        y_scrollbar = ttk.Scrollbar(tree_frame)
        y_scrollbar.pack(side="right", fill="y")
        
        x_scrollbar = ttk.Scrollbar(tree_frame, orient="horizontal")
        x_scrollbar.pack(side="bottom", fill="x")
        
        # Create treeview
        columns = ["timestamp", "filename", "model_name", "model_version", "score", 
                  "execution_time_ms", "fallback_used", "metadata"]
        
        tree = ttk.Treeview(
            tree_frame, 
            columns=columns,
            show="headings",
            yscrollcommand=y_scrollbar.set,
            xscrollcommand=x_scrollbar.set
        )
        
        # Configure scrollbars
        y_scrollbar.config(command=tree.yview)
        x_scrollbar.config(command=tree.xview)
        
        # Set column headings
        column_widths = {
            "timestamp": 200,
            "filename": 150,
            "model_name": 100,
            "model_version": 100,
            "score": 80,
            "execution_time_ms": 120,
            "fallback_used": 100,
            "metadata": 400
        }
        
        column_headers = {
            "timestamp": "Timestamp",
            "filename": "Filename",
            "model_name": "Model Name",
            "model_version": "Version",
            "score": "Score",
            "execution_time_ms": "Exec Time (ms)",
            "fallback_used": "Fallback Used",
            "metadata": "Metadata"
        }
        
        for col in columns:
            tree.heading(col, text=column_headers[col])
            tree.column(col, width=column_widths[col], stretch=True if col == "metadata" else False)
        
        # Add data to tree (most recent first)
        if len(self.df) > 0:
            # Sort by timestamp descending
            sorted_df = self.df.sort_values(by='timestamp', ascending=False)
            
            # Take the most recent 1000 records to avoid overwhelming the tree
            display_df = sorted_df.head(1000)
            
            for i, row in display_df.iterrows():
                values = [
                    row['timestamp'],
                    row['filename'],
                    row['model_name'],
                    row['model_version'],
                    f"{row['score']:.2f}" if pd.notna(row['score']) else "",
                    f"{row['execution_time_ms']:.2f}" if pd.notna(row['execution_time_ms']) else "",
                    "Yes" if row['fallback_used'] else "No",
                    str(row['metadata'])
                ]
                tree.insert("", "end", values=values)
        
        tree.pack(fill="both", expand=True)
        
        # Update function for version filter
        def update_tree(*args):
            # Clear current tree
            for item in tree.get_children():
                tree.delete(item)
            
            # Filter by version
            if version_var.get() == "All":
                filtered_df = self.df
            else:
                filtered_df = self.df[self.df['model_version'] == version_var.get()]
            
            # Sort by timestamp descending
            sorted_df = filtered_df.sort_values(by='timestamp', ascending=False)
            
            # Take the most recent 1000 records
            display_df = sorted_df.head(1000)
            
            # Populate tree
            for i, row in display_df.iterrows():
                values = [
                    row['timestamp'],
                    row['filename'],
                    row['model_name'],
                    row['model_version'],
                    f"{row['score']:.2f}" if pd.notna(row['score']) else "",
                    f"{row['execution_time_ms']:.2f}" if pd.notna(row['execution_time_ms']) else "",
                    "Yes" if row['fallback_used'] else "No",
                    str(row['metadata'])
                ]
                tree.insert("", "end", values=values)
        
        # Bind update function to combobox
        version_combo.bind("<<ComboboxSelected>>", update_tree)
    
    def export_logs(self):
        """Export logs to CSV or Excel file"""
        try:
            from tkinter import filedialog
            
            # Ask for file path
            file_path = filedialog.asksaveasfilename(
                defaultextension=".csv",
                filetypes=[("CSV files", "*.csv"), ("Excel files", "*.xlsx"), ("All files", "*.*")]
            )
            
            if not file_path:
                return
            
            # Export based on file extension
            if file_path.endswith(".csv"):
                self.df.to_csv(file_path, index=False)
                self.status_label.config(text=f"Logs exported to {file_path}")
            elif file_path.endswith(".xlsx"):
                self.df.to_excel(file_path, index=False)
                self.status_label.config(text=f"Logs exported to {file_path}")
            else:
                # Default to CSV
                self.df.to_csv(file_path, index=False)
                self.status_label.config(text=f"Logs exported to {file_path}")
        except Exception as e:
            self.status_label.config(text=f"Error exporting logs: {str(e)}")
            print(f"Error exporting logs: {str(e)}")

def create_dashboard():
    """Create and run the dashboard"""
    if not DASHBOARD_AVAILABLE:
        print("Dashboard dependencies not installed. Cannot create dashboard.")
        print("Please install pandas, matplotlib, and numpy.")
        return
    
    root = tk.Tk()
    app = ModelMonitoringDashboard(root)
    root.mainloop()

def create_html_report():
    """Create an HTML report of model performance"""
    try:
        import pandas as pd
        import matplotlib.pyplot as plt
        import numpy as np
        import base64
        from io import BytesIO
    except ImportError:
        print("Report generation dependencies not installed. Cannot create report.")
        print("Please install pandas, matplotlib, and numpy.")
        return
    
    # Load data
    if not os.path.exists(AUDIT_PATH):
        print(f"Error: Audit log file not found at {AUDIT_PATH}")
        return
    
    # Read the audit log
    df = pd.read_csv(AUDIT_PATH)
    
    # Create report directory
    report_dir = os.path.join(os.getcwd(), "models", "reports")
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)
    
    # Generate timestamp for report
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report_path = os.path.join(report_dir, f"model_performance_report_{timestamp}.html")
    
    # Function to convert plot to base64 for embedding in HTML
    def plot_to_base64(fig):
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        buf.close()
        return img_str
    
    # Prepare HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>TerraFusion Model Performance Report</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1, h2 {{ color: #2c3e50; }}
            .dashboard-card {{ 
                background-color: #f9f9f9; 
                border-radius: 5px; 
                padding: 20px; 
                margin-bottom: 20px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }}
            .stats-grid {{ 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); 
                gap: 15px; 
                margin: 20px 0;
            }}
            .stat-card {{ 
                background-color: white; 
                border-radius: 5px; 
                padding: 15px; 
                text-align: center;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            .stat-label {{ font-size: 14px; color: #7f8c8d; margin-bottom: 5px; }}
            .stat-value {{ font-size: 24px; font-weight: bold; color: #2c3e50; }}
            .plots-grid {{ 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin: 20px 0;
            }}
            .plot {{ width: 100%; }}
            table {{ 
                width: 100%; 
                border-collapse: collapse; 
                margin: 20px 0;
            }}
            th, td {{ 
                padding: 12px; 
                text-align: left; 
                border-bottom: 1px solid #ddd;
            }}
            th {{ background-color: #f2f2f2; }}
            tr:hover {{ background-color: #f5f5f5; }}
            .footer {{ 
                margin-top: 40px; 
                padding-top: 20px; 
                border-top: 1px solid #eee; 
                color: #7f8c8d; 
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <h1>TerraFusion Model Performance Report</h1>
        <p>Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    """
    
    # Convert timestamp to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Convert score to float
    df['score'] = pd.to_numeric(df['score'], errors='coerce')
    
    # Convert execution_time_ms to float
    df['execution_time_ms'] = pd.to_numeric(df['execution_time_ms'], errors='coerce')
    
    # Convert fallback_used to boolean
    df['fallback_used'] = df['fallback_used'].map({'True': True, 'False': False, True: True, False: False})
    
    # Extract feedback information from metadata
    df['has_feedback'] = df['metadata'].apply(
        lambda x: 'feedback' in str(x).lower() and 'true' in str(x).lower()
    )
    
    # Calculate statistics
    total_inferences = len(df)
    unique_versions = df['model_version'].nunique()
    avg_score = df['score'].mean()
    fallback_rate = (df['fallback_used'] == True).mean() * 100 if len(df) > 0 else 0
    
    # Recent performance (last day)
    recent_df = df[df['timestamp'] > pd.Timestamp.now() - pd.Timedelta(days=1)]
    recent_count = len(recent_df)
    
    # Get score distribution
    score_dist = {
        "1.0-1.9": len(df[(df['score'] >= 1.0) & (df['score'] < 2.0)]),
        "2.0-2.9": len(df[(df['score'] >= 2.0) & (df['score'] < 3.0)]),
        "3.0-3.9": len(df[(df['score'] >= 3.0) & (df['score'] < 4.0)]),
        "4.0-5.0": len(df[(df['score'] >= 4.0) & (df['score'] <= 5.0)])
    }
    
    # Add overview section
    html_content += f"""
        <div class="dashboard-card">
            <h2>Overview</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Inferences</div>
                    <div class="stat-value">{total_inferences:,}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Model Versions Used</div>
                    <div class="stat-value">{unique_versions}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Average Condition Score</div>
                    <div class="stat-value">{avg_score:.2f}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Fallback Rate</div>
                    <div class="stat-value">{fallback_rate:.2f}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Inferences (Last 24h)</div>
                    <div class="stat-value">{recent_count:,}</div>
                </div>
            </div>
    """
    
    # Add plots if data exists
    if len(df) > 0:
        # Score distribution pie chart
        fig1, ax1 = plt.subplots(figsize=(8, 6))
        colors = ['#ff9999', '#66b3ff', '#99ff99', '#ffcc99']
        labels = list(score_dist.keys())
        sizes = list(score_dist.values())
        
        ax1.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax1.axis('equal')
        ax1.set_title('Condition Score Distribution')
        
        # Daily inference volume
        fig2, ax2 = plt.subplots(figsize=(8, 6))
        
        # Group by day and count
        daily_counts = df.resample('D', on='timestamp').size()
        
        # Plot last 30 days or all if less than 30
        days_to_plot = min(30, len(daily_counts))
        if days_to_plot > 0:
            daily_counts.tail(days_to_plot).plot(ax=ax2)
            ax2.set_xlabel('Date')
            ax2.set_ylabel('Number of Inferences')
            ax2.set_title('Daily Inference Volume')
            ax2.grid(True, linestyle='--', alpha=0.7)
        
        # Convert plots to base64
        plot1_base64 = plot_to_base64(fig1)
        plot2_base64 = plot_to_base64(fig2)
        
        # Add plots to HTML
        html_content += f"""
            <div class="plots-grid">
                <div>
                    <img src="data:image/png;base64,{plot1_base64}" class="plot" alt="Score Distribution">
                </div>
                <div>
                    <img src="data:image/png;base64,{plot2_base64}" class="plot" alt="Daily Inference Volume">
                </div>
            </div>
        </div>
        """
    else:
        html_content += f"""
            <p>No data available for visualization.</p>
        </div>
        """
    
    # Version analysis section
    html_content += f"""
        <div class="dashboard-card">
            <h2>Version Analysis</h2>
    """
    
    if len(df) > 0:
        # Group by version
        version_stats = df.groupby('model_version').agg({
            'model_name': 'count',
            'score': ['mean', 'min', 'max', 'std'],
            'execution_time_ms': ['mean', 'std'],
            'fallback_used': 'mean'
        }).reset_index()
        
        # Rename columns
        version_stats.columns = [
            'Version', 'Count', 'Avg Score', 'Min Score', 'Max Score', 'Score Std Dev',
            'Avg Exec Time (ms)', 'Exec Time Std Dev', 'Fallback Rate'
        ]
        
        # Convert fallback rate to percentage
        version_stats['Fallback Rate'] = version_stats['Fallback Rate'] * 100
        
        # Create HTML table
        html_content += f"""
            <table>
                <tr>
                    <th>Version</th>
                    <th>Count</th>
                    <th>Avg Score</th>
                    <th>Min Score</th>
                    <th>Max Score</th>
                    <th>Score Std Dev</th>
                    <th>Avg Exec Time (ms)</th>
                    <th>Fallback Rate</th>
                </tr>
        """
        
        # Add rows
        for i, row in version_stats.iterrows():
            html_content += f"""
                <tr>
                    <td>{row['Version']}</td>
                    <td>{row['Count']:,}</td>
                    <td>{row['Avg Score']:.2f}</td>
                    <td>{row['Min Score']:.2f}</td>
                    <td>{row['Max Score']:.2f}</td>
                    <td>{row['Score Std Dev']:.2f}</td>
                    <td>{row['Avg Exec Time (ms)']:.2f}</td>
                    <td>{row['Fallback Rate']:.2f}%</td>
                </tr>
            """
        
        html_content += "</table>"
        
        # Version usage pie chart
        fig3, ax3 = plt.subplots(figsize=(8, 6))
        colors = plt.cm.tab10.colors
        
        # Get version counts
        version_counts = df['model_version'].value_counts()
        
        # Plot pie chart
        ax3.pie(
            version_counts.values, 
            labels=version_counts.index, 
            colors=colors[:len(version_counts)], 
            autopct='%1.1f%%', 
            startangle=90
        )
        ax3.axis('equal')
        ax3.set_title('Model Version Usage')
        
        # Version performance comparison
        fig4, ax4 = plt.subplots(figsize=(8, 6))
        
        # Prepare data
        versions = version_stats['Version']
        avg_scores = version_stats['Avg Score']
        error = version_stats['Score Std Dev']
        
        # Bar positions
        positions = np.arange(len(versions))
        
        # Create bars
        bars = ax4.barh(positions, avg_scores, xerr=error, align='center', alpha=0.7)
        
        # Labels and title
        ax4.set_yticks(positions)
        ax4.set_yticklabels(versions)
        ax4.set_xlabel('Average Condition Score')
        ax4.set_title('Average Score by Model Version')
        ax4.grid(True, linestyle='--', alpha=0.7, axis='x')
        
        # Add value labels
        for i, v in enumerate(avg_scores):
            ax4.text(v + 0.1, i, f"{v:.2f}", va='center')
        
        # Convert plots to base64
        plot3_base64 = plot_to_base64(fig3)
        plot4_base64 = plot_to_base64(fig4)
        
        # Add plots to HTML
        html_content += f"""
            <div class="plots-grid">
                <div>
                    <img src="data:image/png;base64,{plot3_base64}" class="plot" alt="Version Usage">
                </div>
                <div>
                    <img src="data:image/png;base64,{plot4_base64}" class="plot" alt="Version Performance">
                </div>
            </div>
        </div>
        """
    else:
        html_content += f"""
            <p>No data available for version analysis.</p>
        </div>
        """
    
    # Fallback section
    html_content += f"""
        <div class="dashboard-card">
            <h2>Fallback Analysis</h2>
    """
    
    if len(df) > 0:
        # Calculate fallback statistics
        fallback_records = df[df['fallback_used'] == True]
        total_fallbacks = len(fallback_records)
        fallback_rate = total_fallbacks / len(df) * 100 if len(df) > 0 else 0
        
        # Stats grid
        html_content += f"""
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Fallbacks</div>
                    <div class="stat-value">{total_fallbacks:,}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Overall Fallback Rate</div>
                    <div class="stat-value">{fallback_rate:.2f}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Primary Version</div>
                    <div class="stat-value">{df['model_version'].value_counts().index[0] if not df.empty else "N/A"}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Fallback Version</div>
                    <div class="stat-value">1.0.0</div>
                </div>
            </div>
        """
        
        # Fallback trend over time
        fig5, ax5 = plt.subplots(figsize=(8, 6))
        
        # Group by day and calculate fallback rate
        daily_data = df.resample('D', on='timestamp').agg({
            'fallback_used': 'mean',
            'model_version': 'count'
        })
        
        # Convert to percentage
        daily_data['fallback_rate'] = daily_data['fallback_used'] * 100
        
        # Plot fallback rate over time
        daily_data['fallback_rate'].plot(ax=ax5)
        
        # Labels and title
        ax5.set_xlabel('Date')
        ax5.set_ylabel('Fallback Rate (%)')
        ax5.set_title('Daily Fallback Rate')
        ax5.grid(True, linestyle='--', alpha=0.7)
        
        # Set y-axis limits
        ax5.set_ylim(0, 100)
        
        # Convert plot to base64
        plot5_base64 = plot_to_base64(fig5)
        
        # Add plot to HTML
        html_content += f"""
            <div>
                <img src="data:image/png;base64,{plot5_base64}" class="plot" alt="Fallback Rate Trend">
            </div>
        </div>
        """
    else:
        html_content += f"""
            <p>No data available for fallback analysis.</p>
        </div>
        """
    
    # Add footer
    html_content += f"""
        <div class="footer">
            <p>Generated by TerraFusion Model Monitoring Dashboard</p>
        </div>
    </body>
    </html>
    """
    
    # Write HTML to file
    with open(report_path, 'w') as f:
        f.write(html_content)
    
    print(f"Report generated successfully: {report_path}")
    
    # Try to open in browser
    try:
        webbrowser.open('file://' + report_path)
    except:
        print("Could not open report in browser automatically.")
    
    return report_path

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="TerraFusion Model Monitoring Dashboard")
    
    parser.add_argument("--dashboard", action="store_true", help="Launch the monitoring dashboard")
    parser.add_argument("--report", action="store_true", help="Generate an HTML report")
    
    args = parser.parse_args()
    
    if args.dashboard:
        create_dashboard()
    elif args.report:
        create_html_report()
    else:
        # Default to dashboard
        create_dashboard()

if __name__ == "__main__":
    main()