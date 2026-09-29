import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagChip } from "./TagChip";

describe("TagChip", () => {
  it("renders the tag with a hash prefix", () => {
    render(<TagChip tag="work" />);
    expect(screen.getByText("#work")).toBeInTheDocument();
  });

  it("calls onClick with the tag name when clicked", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<TagChip tag="urgent" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "#urgent" }));
    expect(onClick).toHaveBeenCalledWith("urgent");
  });
});
