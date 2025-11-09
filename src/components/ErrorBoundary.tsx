import * as Sentry from "@sentry/react";
import { AlertTriangle, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError: () => void;
}

function ErrorFallback({ error, componentStack, eventId, resetError }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <CardTitle className="text-2xl">Algo deu errado</CardTitle>
              <CardDescription>
                Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDev && (
            <div className="bg-gray-100 rounded-lg p-4 space-y-2">
              <div>
                <h4 className="font-semibold text-sm text-gray-700">Erro:</h4>
                <p className="text-sm font-mono text-red-600">{error.message}</p>
              </div>
              {componentStack && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Stack:</h4>
                  <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                    {componentStack}
                  </pre>
                </div>
              )}
              {eventId && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700">Event ID:</h4>
                  <p className="text-sm font-mono text-gray-600">{eventId}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recarregar Página
            </Button>

            {eventId && (
              <Button
                variant="outline"
                onClick={() => {
                  Sentry.showReportDialog({
                    eventId,
                    lang: "pt-BR",
                    title: "Parece que estamos com problemas.",
                    subtitle: "Nossa equipe foi notificada. Se você gostaria de ajudar, conte-nos o que aconteceu.",
                    subtitle2: "Nos diga o que aconteceu abaixo.",
                    labelName: "Nome",
                    labelEmail: "Email",
                    labelComments: "O que aconteceu?",
                    labelClose: "Fechar",
                    labelSubmit: "Enviar",
                    errorGeneric: "Ocorreu um erro desconhecido ao enviar seu relatório. Por favor, tente novamente.",
                    errorFormEntry: "Alguns campos são inválidos. Por favor, corrija os erros e tente novamente.",
                    successMessage: "Seu feedback foi enviado. Obrigado!",
                  });
                }}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Reportar Feedback
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Por favor, tente recarregar a página. Se o problema persistir, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryWrapperProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, eventId, resetError }) => (
        <ErrorFallback
          error={error}
          componentStack={componentStack}
          eventId={eventId}
          resetError={resetError}
        />
      )}
      showDialog={false}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
