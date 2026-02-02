import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Item from './Item.svelte';

// Mock the pocketbase module to prevent actual API calls during tests
vi.mock('$lib/pocketbase', () => ({
  needItem: vi.fn(),
  boughtItem: vi.fn(),
  deleteItem: vi.fn(),
  updateItem: vi.fn(),
}));

describe('Item.svelte', () => {
  describe('Notes Visibility in View Mode', () => {
    it('Test 1.1: displays notes when item is not purchased and has notes', () => {
      const mockItem = {
        id: '123',
        name: 'Test Item',
        purchased: false,
        notes: 'These are test notes',
        tags: 'tag1 tag2',
        collectionId: '', // Add required properties from your item type
        collectionName: '',
        created: '',
        updated: '',
        expand: {},
      };

      render(Item, { props: { item: mockItem, filter_tag: '' } });

      // Check if the notes text is present
      // The text content in Item.svelte is "Notes: {item.notes}"
      expect(screen.getByText(`Notes: ${mockItem.notes}`)).toBeInTheDocument();
    });

    it('Test 1.2: does not display notes when item is purchased, even if notes exist', () => {
      const mockItem = {
        id: '456',
        name: 'Purchased Item With Notes',
        purchased: true,
        notes: 'These notes should not be visible',
        tags: 'tag3 tag4',
        collectionId: '',
        collectionName: '',
        created: '',
        updated: '',
        expand: {},
      };

      render(Item, { props: { item: mockItem, filter_tag: '' } });

      // Check that the notes text is not present
      // screen.queryByText returns null if not found, which is what we want
      expect(screen.queryByText(`Notes: ${mockItem.notes}`)).toBeNull();
    });

    it('Test 1.3: does not display notes section when item is not purchased and has no notes', () => {
      const mockItem = {
        id: '789',
        name: 'Item With No Notes',
        purchased: false,
        notes: '', // or null
        tags: 'tag5 tag6',
        collectionId: '',
        collectionName: '',
        created: '',
        updated: '',
        expand: {},
      };

      render(Item, { props: { item: mockItem, filter_tag: '' } });

      // Check that the "Notes:" label (or any notes content) is not present
      expect(screen.queryByText('Notes: ')).toBeNull();
    });

  });


  describe('Notes Editability in Edit Mode', () => {
    it('Test 2.1: displays notes input with correct value when item is not purchased and has notes', async () => {
      const user = userEvent.setup();
      const mockItem = {
        id: 'edit001',
        name: 'Item to Edit',
        purchased: false,
        notes: 'Initial notes for editing',
        tags: 'editable',
        collectionId: '',
        collectionName: '',
        created: '',
        updated: '',
        expand: {},
      };

      const mockOnUpdate = vi.fn();
      const mockOnDelete = vi.fn();
      const mockOnToggleTag = vi.fn();

      const { container } = render(Item, { props: { item: mockItem, filter_tag: '' } });

      // Click the Edit button
      // The edit button has an accessible name "Edit" due to <span class="sr-only">Edit</span>
      const editButton = within(container).getByRole('button', { name: 'Edit' });
      await user.click(editButton);

      // Check if the notes input field is present and has the correct value
      const notesInput = screen.getByPlaceholderText(/Notes \(e.g., quantity, variety\)/i) as HTMLInputElement;
      expect(notesInput).toBeInTheDocument();
      expect(notesInput.value).toBe(mockItem.notes);
    });
    // Future tests for edit mode can be added here
  }); // Closes 'Notes Editability in Edit Mode'

  // We can add tests for Notes Clearing later (or this comment can be removed/updated)
}); // This is the new final closing brace for the main 'Item.svelte' describe block
