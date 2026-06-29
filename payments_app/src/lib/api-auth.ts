import { NextRequest, NextResponse } from "next/server";

/**
 * Verifica que el request incluya el header Authorization con
 * el token `Bearer <SERVICE_API_KEY>`. Si la API key es válida o la variable
 * de entorno no está definida (dev-only), retorna `null`. De lo contrario
 * retorna una respuesta JSON 401 para devolver al cliente.
 */
export function verifyServiceApiKey(
  req: NextRequest,
): NextResponse | null {
  const apiKey = process.env.SERVICE_API_KEY;

  // En desarrollo sin SERVICE_API_KEY configurado, permitir paso (útil para tests locales)
  if (!apiKey) {
    return null;
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token || token !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
