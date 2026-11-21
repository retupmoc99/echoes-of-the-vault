// Config for `npm run sim`: runs only the balance report (src/**/*.sim.ts).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.sim.ts'],
    // Show the report (Vitest hides console output from passing tests by default).
    silent: false,
  },
});
