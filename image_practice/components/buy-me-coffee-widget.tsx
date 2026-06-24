"use client";

import { Coffee } from "lucide-react";
import { useEffect } from "react";

const widgetId = "bmc-widget-script";

export function BuyMeCoffeeWidget() {
  useEffect(() => {
    if (document.getElementById(widgetId)) {
      return;
    }

    const script = document.createElement("script");
    script.id = widgetId;
    script.dataset.name = "BMC-Widget";
    script.dataset.cfasync = "false";
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js";
    script.dataset.id = "futura_freeeee";
    script.dataset.description = "Support me on Buy me a coffee!";
    script.dataset.message = "방문해주셔서 감사합니다!";
    script.dataset.color = "#40DCA5";
    script.dataset.position = "Right";
    script.dataset.x_margin = "18";
    script.dataset.y_margin = "18";
    script.async = true;

    document.body.append(script);
  }, []);

  return (
    <a
      aria-label="Buy me a coffee"
      className="fixed bottom-[18px] right-[18px] z-[9999] inline-flex size-14 items-center justify-center rounded-full bg-[#40DCA5] text-zinc-950 shadow-xl shadow-zinc-950/20 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
      href="https://www.buymeacoffee.com/futura_freeeee"
      rel="noreferrer"
      target="_blank"
      title="Buy me a coffee"
    >
      <Coffee aria-hidden className="size-6" />
    </a>
  );
}
