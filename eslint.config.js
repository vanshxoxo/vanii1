import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // Supabase PostgREST joins are untyped until database types are generated from the user's project schema.
    // Keep this exception scoped to dynamic data adapters and provider payload parsing.
    files: [
      'src/lib/catalog.ts', 'src/lib/cms.ts', 'src/pages/AdminPage.tsx', 'src/components/admin/**',
      'src/pages/CheckoutPage.tsx', 'src/pages/OrdersPage.tsx', 'src/store.tsx',
      'supabase/functions/razorpay-webhook/index.ts', 'supabase/functions/refund-payment/index.ts',
      'supabase/functions/shiprocket/index.ts', 'supabase/functions/verify-payment/index.ts',
    ],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
