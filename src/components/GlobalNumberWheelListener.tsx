"use client";

import { useEffect } from "react";

/**
 * GlobalNumberWheelListener
 * Enables smooth mouse wheel increment/decrement on numeric inputs across the application.
 * - Works on hover without requiring prior click/focus
 * - Prevents unwanted page or modal scrolling while hovering over inputs
 * - Supports Shift for 5x fast scroll & Alt/Ctrl for 0.1x micro precision
 * - Dispatches native input/change events to update React controlled state cleanly
 */
export default function GlobalNumberWheelListener() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLInputElement)) return;

      // Skip disabled, readonly, or already handled inputs
      if (target.disabled || target.readOnly) return;
      if ((e as any).__wheelHandled) return;

      const isTypeNumber = target.type === "number";
      const isInputModeNumeric =
        target.inputMode === "numeric" || target.inputMode === "decimal";
      const hasNumericData = target.dataset.numeric === "true";
      const valStr = target.value.trim();
      const isNumericVal = valStr !== "" && !isNaN(Number(valStr));

      // Only operate on numeric inputs
      if (!isTypeNumber && !isInputModeNumeric && !hasNumericData && !isNumericVal) {
        return;
      }

      // Determine step, min, and max
      let step = 1;
      let min: number | undefined = undefined;
      let max: number | undefined = undefined;

      const parentLabel = target.parentElement?.textContent?.toLowerCase() || "";
      const isLot =
        target.name?.toLowerCase().includes("lot") ||
        target.id?.toLowerCase().includes("lot") ||
        target.placeholder?.toLowerCase().includes("lot") ||
        target.className?.toLowerCase().includes("lot") ||
        parentLabel.includes("lot") ||
        target.closest("[data-lot-container='true']") !== null;

      if (isLot) {
        // Standard Forex/CFD micro lots: strictly 0.01 steps, 2 decimals, min 0.01
        step = e.shiftKey ? 0.05 : 0.01;
        min = 0.01;
      } else if (target.step && target.step !== "any") {
        const parsedStep = parseFloat(target.step);
        if (!isNaN(parsedStep) && parsedStep > 0) step = parsedStep;
      } else if (valStr.includes(".")) {
        const dec = valStr.split(".")[1]?.length || 2;
        step = Math.pow(10, -dec);
      }

      // Modifiers for non-lot fields: Shift = fast (5x), Alt/Ctrl = fine (0.1x)
      if (!isLot) {
        if (e.shiftKey) {
          step = step * 5;
        } else if (e.altKey || e.ctrlKey) {
          step = Math.max(0.001, step / 10);
        }
      }

      // Min & Max bounds for non-lot fields
      if (!isLot && target.min !== "") {
        const parsedMin = parseFloat(target.min);
        if (!isNaN(parsedMin)) min = parsedMin;
      }

      if (target.max !== "") {
        const parsedMax = parseFloat(target.max);
        if (!isNaN(parsedMax)) max = parsedMax;
      }

      // Current value & Next value calculation
      const curNum = parseFloat(valStr);
      const baseNum = isNaN(curNum) ? (min ?? 0) : curNum;

      // deltaY < 0 = scrolled UP (increase), deltaY > 0 = scrolled DOWN (decrease)
      const isUp = e.deltaY < 0;
      let nextNum = isUp ? baseNum + step : baseNum - step;

      if (min !== undefined) nextNum = Math.max(min, nextNum);
      if (max !== undefined) nextNum = Math.min(max, nextNum);

      // Prevent outer page / modal scrolling while scrolling on the input
      e.preventDefault();
      e.stopPropagation();
      (e as any).__wheelHandled = true;

      // Formatting with clean decimal precision
      // For lot size, strictly enforce standard 2 decimal places (e.g. 0.01, 0.02, 0.10, 1.00)
      const stepDecimals = (step.toString().split(".")[1] || "").length;
      const valDecimals = (valStr.split(".")[1] || "").length;
      const decimals = isLot ? 2 : Math.max(stepDecimals, valDecimals);

      const formattedVal =
        decimals > 0 ? nextNum.toFixed(decimals) : String(Math.round(nextNum));

      // Update input element and notify React
      const proto = window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) {
        setter.call(target, formattedVal);
      } else {
        target.value = formattedVal;
      }

      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return null;
}
