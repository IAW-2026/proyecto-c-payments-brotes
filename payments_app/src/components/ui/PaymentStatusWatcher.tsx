"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface PaymentStatusWatcherProps {
  paymentId: string;
}

const TERMINAL_STATUSES = new Set(["approved", "rejected"]);

export function PaymentStatusWatcher({ paymentId }: PaymentStatusWatcherProps) {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource(`/api/payments/${paymentId}/status`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (TERMINAL_STATUSES.has(data.status)) {
          router.refresh();
          eventSource.close();
        }
      } catch {
        // ignore malformed events
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [paymentId, router]);

  return null;
}
