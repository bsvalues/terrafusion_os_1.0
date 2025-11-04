using Stripe;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PACSIntegration.Services
{
    public class BillingService : IBillingService
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<BillingService> _logger;
        private readonly string _stripeSecretKey;
        private readonly IEmailService _emailService;

        public BillingService(
            DatabaseContext context,
            IConfiguration configuration,
            ILogger<BillingService> logger,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _stripeSecretKey = configuration["Stripe:SecretKey"];
            _emailService = emailService;
            StripeConfiguration.ApiKey = _stripeSecretKey;
        }

        public async Task<BillingSubscription> CreateSubscriptionAsync(int tenantId, string plan)
        {
            try
            {
                var tenant = await _context.Tenants
                    .Include(t => t.BillingInfo)
                    .FirstOrDefaultAsync(t => t.TenantID == tenantId);

                if (tenant == null)
                    throw new NotFoundException($"Tenant {tenantId} not found");

                // Create or update Stripe customer
                var customerOptions = new CustomerCreateOptions
                {
                    Email = tenant.BillingInfo.Email,
                    Name = tenant.TenantName,
                    Metadata = new Dictionary<string, string>
                    {
                        { "TenantId", tenantId.ToString() }
                    }
                };

                var customerService = new CustomerService();
                var customer = await customerService.CreateAsync(customerOptions);

                // Create subscription
                var subscriptionOptions = new SubscriptionCreateOptions
                {
                    Customer = customer.Id,
                    Items = new List<SubscriptionItemOptions>
                    {
                        new SubscriptionItemOptions
                        {
                            Price = GetPriceIdForPlan(plan)
                        }
                    },
                    PaymentBehavior = "default_incomplete",
                    PaymentSettings = new SubscriptionPaymentSettingsOptions
                    {
                        PaymentMethodTypes = new List<string> { "card" }
                    }
                };

                var subscriptionService = new SubscriptionService();
                var subscription = await subscriptionService.CreateAsync(subscriptionOptions);

                // Save billing info
                var billing = new Billing
                {
                    TenantID = tenantId,
                    Plan = plan,
                    StripeCustomerId = customer.Id,
                    StripeSubscriptionId = subscription.Id,
                    Status = subscription.Status,
                    Amount = GetPlanAmount(plan),
                    BillingDate = DateTime.UtcNow,
                    NextBillingDate = DateTime.UtcNow.AddMonths(1)
                };

                _context.Billing.Add(billing);
                await _context.SaveChangesAsync();

                return new BillingSubscription
                {
                    SubscriptionId = subscription.Id,
                    ClientSecret = subscription.LatestInvoice.PaymentIntent.ClientSecret,
                    Status = subscription.Status
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subscription for tenant {TenantId}", tenantId);
                throw;
            }
        }

        public async Task HandleWebhookAsync(string json, string signature)
        {
            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    signature,
                    _configuration["Stripe:WebhookSecret"]
                );

                switch (stripeEvent.Type)
                {
                    case Events.InvoicePaid:
                        await HandleInvoicePaidAsync(stripeEvent);
                        break;
                    case Events.InvoicePaymentFailed:
                        await HandlePaymentFailedAsync(stripeEvent);
                        break;
                    case Events.SubscriptionDeleted:
                        await HandleSubscriptionDeletedAsync(stripeEvent);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling Stripe webhook");
                throw;
            }
        }

        private async Task HandleInvoicePaidAsync(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            var billing = await _context.Billing
                .FirstOrDefaultAsync(b => b.StripeSubscriptionId == invoice.SubscriptionId);

            if (billing != null)
            {
                billing.Status = "active";
                billing.LastPaymentDate = DateTime.UtcNow;
                billing.NextBillingDate = DateTime.UtcNow.AddMonths(1);
                
                await _context.SaveChangesAsync();
                
                await _emailService.SendEmailAsync(
                    billing.Tenant.BillingInfo.Email,
                    "Payment Successful",
                    $"Your payment of ${invoice.AmountPaid / 100.0:F2} was successful."
                );
            }
        }

        private async Task HandlePaymentFailedAsync(Event stripeEvent)
        {
            var invoice = stripeEvent.Data.Object as Invoice;
            var billing = await _context.Billing
                .FirstOrDefaultAsync(b => b.StripeSubscriptionId == invoice.SubscriptionId);

            if (billing != null)
            {
                billing.Status = "payment_failed";
                await _context.SaveChangesAsync();

                await _emailService.SendEmailAsync(
                    billing.Tenant.BillingInfo.Email,
                    "Payment Failed",
                    "Your payment failed. Please update your payment method."
                );
            }
        }

        private async Task HandleSubscriptionDeletedAsync(Event stripeEvent)
        {
            var subscription = stripeEvent.Data.Object as Subscription;
            var billing = await _context.Billing
                .FirstOrDefaultAsync(b => b.StripeSubscriptionId == subscription.Id);

            if (billing != null)
            {
                billing.Status = "cancelled";
                billing.CancelledAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        private string GetPriceIdForPlan(string plan)
        {
            return plan.ToLower() switch
            {
                "basic" => _configuration["Stripe:Prices:Basic"],
                "professional" => _configuration["Stripe:Prices:Professional"],
                "enterprise" => _configuration["Stripe:Prices:Enterprise"],
                _ => throw new ArgumentException($"Invalid plan: {plan}")
            };
        }

        private decimal GetPlanAmount(string plan)
        {
            return plan.ToLower() switch
            {
                "basic" => 99.99m,
                "professional" => 199.99m,
                "enterprise" => 499.99m,
                _ => throw new ArgumentException($"Invalid plan: {plan}")
            };
        }
    }
}
