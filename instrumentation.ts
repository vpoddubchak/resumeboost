export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateStartup } = await import('@/app/lib/startup-validation');
    validateStartup();
  }
}
