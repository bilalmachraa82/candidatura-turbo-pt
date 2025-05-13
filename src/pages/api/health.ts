
// Since we can't use Next.js API types in a Vite project, let's adapt our endpoint
// to use standard Express-like request/response types

type Request = {
  method?: string;
  body?: any;
  query?: Record<string, string | string[]>;
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
    // Simple health check
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
}
