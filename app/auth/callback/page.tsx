import { Suspense } from "react";
import CallbackHandler from "./CallbackHandler";

export const dynamic = "force-dynamic";

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
