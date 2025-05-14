
// Simplified request/response types
type Request = {
  method?: string;
};

type Response = {
  status: (code: number) => Response;
  json: (data: any) => void;
};

export default async function handler(
  req: Request,
  res: Response
) {
  try {
    // Check environment variables are set
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const flowiseUrl = import.meta.env.VITE_FLOWISE_URL;
    const flowiseKey = import.meta.env.VITE_FLOWISE_API_KEY;
    
    const missingEnvVars = [];
    
    if (!supabaseUrl) missingEnvVars.push('VITE_SUPABASE_URL');
    if (!supabaseKey) missingEnvVars.push('VITE_SUPABASE_ANON_KEY');
    if (!flowiseUrl) missingEnvVars.push('VITE_FLOWISE_URL');
    if (!flowiseKey) missingEnvVars.push('VITE_FLOWISE_API_KEY');
    
    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'unknown',
      version: '1.0.0',
      missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : null,
      uptime: process.uptime()
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
