import { stripe } from '../services/stripeClient.js';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { logger } from '../config/logger.js';

const SUBSCRIPTION_ACTIVE_STATUSES = new Set(['trialing', 'active', 'past_due']);

const updateCustomerOnProfile = async (userId, customerId) => {
  if (!userId || !customerId) return;
  await supabaseAdmin
    .from('profiles')
    .update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
};

const upsertSubscription = async ({ id, status, current_period_end, metadata, items, customer }) => {
  const userId = metadata?.userId;
  if (!userId) {
    return;
  }

  // Some events (e.g., invoices) may not include current_period_end; skip if missing
  if (!current_period_end) {
    logger.warn('Missing current_period_end on subscription event, skipping premium update');
    return;
  }

  const plan =
    metadata?.tier ||
    items?.data?.[0]?.price?.lookup_key ||
    items?.data?.[0]?.price?.nickname ||
    'pro';
  const normalizedPlan = plan === 'plus' ? 'plus' : plan === 'pro' ? 'pro' : 'pro';
  const expiresAtDate = new Date(Number(current_period_end) * 1000);
  const expiresAt = expiresAtDate.toISOString();
  const isWithinPaidPeriod = expiresAtDate.getTime() > Date.now();

  await supabaseAdmin.from('subscriptions').upsert(
    {
      id,
      user_id: userId,
      status,
      current_period_end: expiresAt,
      plan: normalizedPlan,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  await updateCustomerOnProfile(userId, customer);

  const shouldMarkPremium = SUBSCRIPTION_ACTIVE_STATUSES.has(status) || isWithinPaidPeriod;

  if (shouldMarkPremium) {
    await supabaseAdmin
      .from('profiles')
      .update({
        plan: normalizedPlan,
        is_premium: true,
        plan_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } else {
    await supabaseAdmin
      .from('profiles')
      .update({
        plan: 'free',
        is_premium: false,
        plan_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
};

const recordPayment = async ({ userId, sessionId, amountTotal, currency, type, status, tier }) => {
  if (!userId) return;
  await supabaseAdmin.from('payments').insert({
    user_id: userId,
    stripe_session_id: sessionId,
    amount: amountTotal,
    currency,
    type,
    status,
    tier,
  });
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { mode = 'subscription', tier = 'plus' } = req.body;

    const isDonation = mode === 'donation';
    const normalizedTier = tier === 'pro' ? 'pro' : 'plus';

    if (mode === 'subscription') {
      if (normalizedTier === 'pro' && req.profile?.plan === 'pro') {
        return res.status(400).json({ error: 'You already have an active Pro plan.' });
      }
      if (normalizedTier === 'plus' && ['plus', 'pro'].includes(req.profile?.plan)) {
        return res.status(400).json({ error: 'You already have an active subscription.' });
      }
    }

    const priceId = isDonation
      ? env.stripeDonationPrice
      : normalizedTier === 'pro'
      ? env.stripePricePro
      : env.stripePricePlus;

    const session = await stripe.checkout.sessions.create({
      mode: isDonation ? 'payment' : 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: isDonation ? env.stripeDonationSuccessUrl : env.stripeSuccessUrl,
      cancel_url: env.stripeCancelUrl,
      customer_email: req.user.email,
      metadata: {
        userId: req.userId,
        type: isDonation ? 'donation' : 'subscription',
        tier: isDonation ? undefined : normalizedTier,
      },
      subscription_data: isDonation
        ? undefined
        : {
            metadata: {
              userId: req.userId,
              tier: normalizedTier,
            },
          },
    });

    return res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    logger.error('createCheckoutSession failed', error);
    return res.status(500).json({ error: 'Unable to create checkout session' });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const body = req.rawBody;
    const event = stripe.webhooks.constructEvent(body, sig, env.stripeWebhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await updateCustomerOnProfile(session.metadata?.userId, session.customer);
        await recordPayment({
          userId: session.metadata?.userId,
          sessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          type: session.metadata?.type || session.mode,
          status: session.payment_status,
          tier: session.metadata?.tier,
        });

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscription(subscription);
        }

        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await upsertSubscription(subscription);
        break;
      }
      default:
        logger.info(`Unhandled Stripe event ${event.type}`);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const createBillingPortalSession = async (req, res) => {
  try {
    const stripeCustomerId = req.profile?.stripe_customer_id;
    if (!stripeCustomerId) {
      return res
        .status(400)
        .json({ error: 'Stripe customer not found. Start a subscription first so we can create portal access.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: env.stripeSuccessUrl,
    });

    return res.json({ url: session.url });
  } catch (error) {
    logger.error('createBillingPortalSession failed', error);
    return res.status(500).json({ error: 'Unable to create billing portal session' });
  }
};
