import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { renderWithProviders } from "./test/render";
import { resetStore } from "./test/mocks/handlers";
import { makeTodo } from "./test/mocks/data";

describe("App", () => {
  it("shows an empty state when there are no todos", async () => {
    renderWithProviders(<App />);
    expect(await screen.findByText(/no todos match/i)).toBeInTheDocument();
  });

  it("creates a new todo from the quick-add form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText(/no todos match/i);

    await user.type(screen.getByLabelText(/todo title/i), "Write integration tests");
    await user.click(screen.getByRole("button", { name: /add todo/i }));

    expect(await screen.findByText("Write integration tests")).toBeInTheDocument();
  });

  it("does not submit an empty todo", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText(/no todos match/i);

    await user.click(screen.getByRole("button", { name: /add todo/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(screen.getByText(/no todos match/i)).toBeInTheDocument();
  });

  it("toggles a todo as completed and updates stats", async () => {
    resetStore([makeTodo({ id: 1, title: "Existing task" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    const item = await screen.findByText("Existing task");
    const checkbox = within(item.closest("li")!).getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() => expect(checkbox).toBeChecked());
    await waitFor(() =>
      expect(screen.getByTestId("progress-percent")).toHaveTextContent("100%"),
    );
  });

  it("deletes a todo", async () => {
    resetStore([makeTodo({ id: 1, title: "Task to remove" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Task to remove");
    await user.click(screen.getByRole("button", { name: /delete "task to remove"/i }));

    await waitFor(() => expect(screen.queryByText("Task to remove")).not.toBeInTheDocument());
    expect(await screen.findByText(/no todos match/i)).toBeInTheDocument();
  });

  it("filters todos by search text", async () => {
    resetStore([
      makeTodo({ id: 1, title: "Buy milk" }),
      makeTodo({ id: 2, title: "Read a book" }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Buy milk");
    await user.type(screen.getByLabelText(/search todos/i), "milk");

    await waitFor(() => expect(screen.queryByText("Read a book")).not.toBeInTheDocument());
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
  });

  it("filters todos by status", async () => {
    resetStore([
      makeTodo({ id: 1, title: "Active task", completed: false }),
      makeTodo({ id: 2, title: "Done task", completed: true }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Active task");
    await user.click(screen.getByRole("button", { name: "Completed" }));

    await waitFor(() => expect(screen.queryByText("Active task")).not.toBeInTheDocument());
    expect(screen.getByText("Done task")).toBeInTheDocument();
  });

  it("edits a todo's title", async () => {
    resetStore([makeTodo({ id: 1, title: "Old title" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Old title");
    await user.click(screen.getByRole("button", { name: /edit "old title"/i }));

    const titleInput = screen
      .getAllByLabelText(/todo title/i)
      .find((el) => (el as HTMLInputElement).value === "Old title")!;
    await user.clear(titleInput);
    await user.type(titleInput, "New title");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByText("New title")).toBeInTheDocument();
    expect(screen.queryByText("Old title")).not.toBeInTheDocument();
  });

  it("shows an Undo toast after deleting and restores the todo on Undo", async () => {
    resetStore([makeTodo({ id: 1, title: "Task to remove" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Task to remove");
    await user.click(screen.getByRole("button", { name: /delete "task to remove"/i }));

    await waitFor(() => expect(screen.queryByText("Task to remove")).not.toBeInTheDocument());
    await user.click(await screen.findByRole("button", { name: /undo/i }));

    expect(await screen.findByText("Task to remove")).toBeInTheDocument();
  });

  it("selects todos and completes them in bulk", async () => {
    resetStore([
      makeTodo({ id: 1, title: "First" }),
      makeTodo({ id: 2, title: "Second" }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("First");
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByLabelText(/select "first"/i));
    expect(screen.getByText(/1 selected/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^complete$/i }));

    await waitFor(() => {
      const item = screen.getByText("First").closest("li")!;
      expect(within(item).getByRole("checkbox")).toBeChecked();
    });
    // select mode exits after applying an action
    expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
  });

  it("selects todos and deletes them in bulk", async () => {
    resetStore([
      makeTodo({ id: 1, title: "First" }),
      makeTodo({ id: 2, title: "Second" }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("First");
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByLabelText(/select "first"/i));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(screen.queryByText("First")).not.toBeInTheDocument());
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("adds a tag to selected todos in bulk", async () => {
    resetStore([makeTodo({ id: 1, title: "First", tags: [] })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("First");
    await user.click(screen.getByRole("button", { name: "Select" }));
    await user.click(screen.getByLabelText(/select "first"/i));
    await user.type(screen.getByLabelText(/tag to add/i), "urgent");
    await user.click(screen.getByRole("button", { name: /add tag/i }));

    expect(await screen.findByText("#urgent")).toBeInTheDocument();
  });

  it("adds, toggles, and removes a subtask", async () => {
    resetStore([makeTodo({ id: 1, title: "Plan trip" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Plan trip");
    await user.type(screen.getByLabelText(/new subtask title/i), "Book flights");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    const subtaskCheckbox = await screen.findByLabelText(/mark subtask "book flights" as completed/i);
    await user.click(subtaskCheckbox);
    await waitFor(() => expect(subtaskCheckbox).toBeChecked());

    await user.click(screen.getByLabelText(/delete subtask "book flights"/i));
    await waitFor(() => expect(screen.queryByText("Book flights")).not.toBeInTheDocument());
  });

  it("spawns the next occurrence when a recurring todo is completed", async () => {
    resetStore([
      makeTodo({ id: 1, title: "Standup", due_date: "2026-01-01", recurrence: "daily" }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    const item = await screen.findByText("Standup");
    const checkbox = within(item.closest("li")!).getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() => expect(screen.getAllByText("Standup")).toHaveLength(2));
  });

  it("focuses the search input with the '/' shortcut and the add form with 'n'", async () => {
    resetStore([]);
    const user = userEvent.setup();
    renderWithProviders(<App />);
    await screen.findByText(/no todos match/i);

    await user.keyboard("/");
    const searchInput = screen.getByLabelText(/search todos/i);
    expect(searchInput).toHaveFocus();

    searchInput.blur();
    await user.keyboard("n");
    expect(screen.getByLabelText(/todo title/i)).toHaveFocus();
  });

  it("navigates the list with arrow keys and toggles the focused item with Enter", async () => {
    resetStore([
      makeTodo({ id: 1, title: "First", completed: false }),
      makeTodo({ id: 2, title: "Second", completed: false }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("First");
    // move focus away from any input so shortcuts are active
    await user.click(document.body);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      const item = screen.getByText("Second").closest("li")!;
      expect(within(item).getByRole("checkbox")).toBeChecked();
    });
  });

  it("filters by tag when a tag chip is clicked", async () => {
    resetStore([
      makeTodo({ id: 1, title: "Tagged", tags: ["work"] }),
      makeTodo({ id: 2, title: "Untagged", tags: [] }),
    ]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("Tagged");
    await user.click(screen.getByText("#work"));

    await waitFor(() => expect(screen.queryByText("Untagged")).not.toBeInTheDocument());
    expect(screen.getByText("Tagged")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /#work ✕/i })).toBeInTheDocument();
  });

  it("edits the focused item with 'e' and Escape cancels editing", async () => {
    resetStore([makeTodo({ id: 1, title: "First" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("First");
    await user.click(document.body);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("e");

    expect(await screen.findByRole("button", { name: /save/i })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument(),
    );
  });

  it("hides drag handles when a search filter is active", async () => {
    resetStore([makeTodo({ id: 1, title: "First" })]);
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByText("First");
    expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search todos/i), "First");
    await waitFor(() => expect(screen.queryByLabelText(/drag to reorder/i)).not.toBeInTheDocument());
  });
});
