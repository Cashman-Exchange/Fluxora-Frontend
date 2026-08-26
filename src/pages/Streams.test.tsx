import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecipientStreams, type Stream } from "../components/recipient/RecipientStreams";

const activeStream: Stream = {
  id: "active",
  sender: "GACTIVE",
  amount: "100",
  status: "active",
};

const pausedStream: Stream = {
  id: "paused",
  sender: "GPAUSED",
  amount: "200",
  status: "paused",
};

describe("Streams filter/sort announcement debounce", () => {
  beforeEach(() => {
    th.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      th.runOnlyPendingTimers();
    });
    th.useRealTimers();
  });

  it("debounces rapid filter and sort announcements", async () => {
    const user = userEvent.setup({ advanceTimers: thi.advanceTimersByTime });
    const { unmount } = render(
      <RecipientStreams streams={[activeStream, pausedStream]} pollIntervalMs={0} />,
    );

    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveTextContent("");

    // Rapid burst of filter and sort changes.
    await user.click(screen.getByRole("button", { name: /^Active$/i }));
    await user.click(screen.getByRole("button", { name: /^Paused$/i }));

    // Toggle a pin to force a sort change.
    const pinButton = screen.getAllByRole("button", { name: /pin stream/i })[0];
    await user.click(pinButton);

    // No announcement should be made during the debounce window.
    expect(liveRegion).toHaveTextContent("");

    // Advance past the debounce delay.
    act(() => {
      thi.advanceTimersByTime(500);
    });

    // Exactly one final announcement.
    expect(liveRegion).toHaveTextContent("Showing Paused streams");

    // Cleanup on unmount should cancel pending timers.
    unmount();
    expect(thi.getTimerCount()).toBe(0);
  });
});
