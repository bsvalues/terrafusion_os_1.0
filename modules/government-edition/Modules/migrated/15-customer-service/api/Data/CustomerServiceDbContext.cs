using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;

namespace TerraFusion.API.Data
{
    /// <summary>
    /// Database context for Customer Service module
    /// Manages tickets, chat history, and AI agent interactions
    /// </summary>
    public class CustomerServiceDbContext : DbContext
    {
        public CustomerServiceDbContext(DbContextOptions<CustomerServiceDbContext> options)
            : base(options)
        {
        }

        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<AgentAssignment> AgentAssignments { get; set; }
        public DbSet<SwarmDeployment> SwarmDeployments { get; set; }
        public DbSet<ResolutionMetric> ResolutionMetrics { get; set; }
        public DbSet<CustomerSatisfaction> CustomerSatisfactions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Ticket configuration
            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasMaxLength(50);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).IsRequired();
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.Property(e => e.Priority).HasMaxLength(20);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.Status);
            });

            // Chat Message configuration
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Message).IsRequired();
                entity.Property(e => e.AgentId).HasMaxLength(50);
                entity.HasOne(e => e.Ticket)
                    .WithMany(t => t.ChatMessages)
                    .HasForeignKey(e => e.TicketId);
            });

            // Agent Assignment configuration
            modelBuilder.Entity<AgentAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AgentId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AgentName).HasMaxLength(100);
                entity.HasOne(e => e.Ticket)
                    .WithMany(t => t.AgentAssignments)
                    .HasForeignKey(e => e.TicketId);
            });

            // Swarm Deployment configuration
            modelBuilder.Entity<SwarmDeployment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Commander).HasMaxLength(50);
                entity.Property(e => e.Status).HasMaxLength(50);
                entity.HasOne(e => e.Ticket)
                    .WithMany(t => t.SwarmDeployments)
                    .HasForeignKey(e => e.TicketId);
            });

            // Resolution Metrics configuration
            modelBuilder.Entity<ResolutionMetric>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TicketId).HasMaxLength(50);
                entity.HasIndex(e => e.ResolutionTime);
                entity.HasIndex(e => e.Confidence);
            });

            // Customer Satisfaction configuration
            modelBuilder.Entity<CustomerSatisfaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TicketId).HasMaxLength(50);
                entity.Property(e => e.Feedback).HasMaxLength(1000);
                entity.HasIndex(e => e.Rating);
            });

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed AI Agent configurations
            modelBuilder.Entity<AgentConfiguration>().HasData(
                new AgentConfiguration { Id = 1, AgentId = "einstein", Name = "Einstein", IQ = 250, Specialty = "Complex Problem Solving" },
                new AgentConfiguration { Id = 2, AgentId = "socrates", Name = "Socrates", IQ = 220, Specialty = "Critical Thinking" },
                new AgentConfiguration { Id = 3, AgentId = "tesla", Name = "Tesla", IQ = 200, Specialty = "Innovation & Engineering" },
                new AgentConfiguration { Id = 4, AgentId = "darwin", Name = "Darwin", IQ = 180, Specialty = "Adaptive Solutions" },
                new AgentConfiguration { Id = 5, AgentId = "watson", Name = "Watson", IQ = 160, Specialty = "Data Analysis" },
                new AgentConfiguration { Id = 6, AgentId = "franklin", Name = "Franklin", IQ = 140, Specialty = "Practical Solutions" },
                new AgentConfiguration { Id = 7, AgentId = "edison", Name = "Edison", IQ = 120, Specialty = "Technical Support" },
                new AgentConfiguration { Id = 8, AgentId = "helper", Name = "Helper", IQ = 100, Specialty = "Basic Assistance" }
            );
        }
    }

    // Entity Models
    public class Ticket
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public string CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ResolvedAt { get; set; }
        public string AssignedAgentId { get; set; }
        public double ConfidenceScore { get; set; }
        public int ResolutionTimeSeconds { get; set; }

        // Navigation properties
        public virtual ICollection<ChatMessage> ChatMessages { get; set; }
        public virtual ICollection<AgentAssignment> AgentAssignments { get; set; }
        public virtual ICollection<SwarmDeployment> SwarmDeployments { get; set; }
    }

    public class ChatMessage
    {
        public int Id { get; set; }
        public string TicketId { get; set; }
        public string Message { get; set; }
        public string SenderType { get; set; } // User, Agent
        public string AgentId { get; set; }
        public DateTime Timestamp { get; set; }
        public double Confidence { get; set; }

        // Navigation property
        public virtual Ticket Ticket { get; set; }
    }

    public class AgentAssignment
    {
        public int Id { get; set; }
        public string TicketId { get; set; }
        public string AgentId { get; set; }
        public string AgentName { get; set; }
        public int AgentIQ { get; set; }
        public DateTime AssignedAt { get; set; }
        public string Role { get; set; } // Primary, Support, Observer

        // Navigation property
        public virtual Ticket Ticket { get; set; }
    }

    public class SwarmDeployment
    {
        public int Id { get; set; }
        public string TicketId { get; set; }
        public string DeploymentId { get; set; }
        public int AgentsDeployed { get; set; }
        public string Commander { get; set; }
        public string FieldGeneral { get; set; }
        public DateTime DeployedAt { get; set; }
        public string Status { get; set; }
        public double Progress { get; set; }

        // Navigation property
        public virtual Ticket Ticket { get; set; }
    }

    public class ResolutionMetric
    {
        public int Id { get; set; }
        public string TicketId { get; set; }
        public int ResolutionTime { get; set; } // seconds
        public double Confidence { get; set; }
        public int AgentsUsed { get; set; }
        public int MessagesExchanged { get; set; }
        public bool FirstContactResolution { get; set; }
        public DateTime RecordedAt { get; set; }
    }

    public class CustomerSatisfaction
    {
        public int Id { get; set; }
        public string TicketId { get; set; }
        public int Rating { get; set; } // 1-5
        public string Feedback { get; set; }
        public bool WouldRecommend { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

    public class AgentConfiguration
    {
        public int Id { get; set; }
        public string AgentId { get; set; }
        public string Name { get; set; }
        public int IQ { get; set; }
        public string Specialty { get; set; }
    }
}