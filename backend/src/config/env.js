import dotenv from 'dotenv';

dotenv.config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_PRICE_PLUS',
  'STRIPE_PRICE_PRO',
  'STRIPE_DONATION_PRICE',
  'STRIPE_SUCCESS_URL',
  'STRIPE_CANCEL_URL',
  'OPENAI_API_KEY',
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`[env] Missing value for ${key}. Make sure it is set before running in production.`);
  }
});

const parseOrigins = () => {
  const configured =
    process.env.CLIENT_URLS ||
    process.env.CLIENT_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:5173';

  return configured
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      if (value.startsWith('http')) {
        return value;
      }
      return `https://${value}`;
    });
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripePricePlus: process.env.STRIPE_PRICE_PLUS,
  stripePricePro: process.env.STRIPE_PRICE_PRO,
  stripeDonationPrice: process.env.STRIPE_DONATION_PRICE,
  stripeSuccessUrl: process.env.STRIPE_SUCCESS_URL,
  stripeDonationSuccessUrl: process.env.STRIPE_DONATION_SUCCESS_URL || process.env.STRIPE_SUCCESS_URL,
  stripeCancelUrl: process.env.STRIPE_CANCEL_URL,
  openAiApiKey: process.env.OPENAI_API_KEY,
  clientOrigins: parseOrigins(),
  railwayUrl: process.env.RAILWAY_URL,
};
