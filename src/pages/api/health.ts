
type Request = {
  method?: string;
};

type Response = {
  status: (code: number) => Response;
  json: (data: any) => void;
};

export default async function handler(req: Request, res: Response) {
  // Check if the API is responsive
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
}
