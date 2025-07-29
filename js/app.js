// Import PocketBase functions
import { listItems, createItem, updateItem, deleteItem, needItem, boughtItem } from './pocketbase.js';

// Main grocery app Alpine.js data
function groceryApp() {
    return {
        purchased: false,
        filterTag: null,
        search: null,
        items: [],
        loading: false,
        newItem: {
            name: '',
            tags: '',
            purchased: false,
            notes: ''
        },

        async loadItems() {
            this.loading = true;
            try {
                this.items = await listItems(this.purchased, this.filterTag, this.search);
            } catch (error) {
                console.error('Error loading items:', error);
            } finally {
                this.loading = false;
            }
        },

        setPurchased(value) {
            this.purchased = value;
            this.loadItems();
        },

        setFilter(tag) {
            this.filterTag = tag;
            this.loadItems();
        },

        clearFilter() {
            this.filterTag = null;
            this.loadItems();
        },

        clearSearch() {
            this.search = null;
            this.loadItems();
        },

        async addNewItem() {
            if (!this.newItem.name.trim()) return;
            
            try {
                await createItem(this.newItem);
                this.newItem = { name: '', tags: '', purchased: false, notes: '' };
                this.loadItems();
            } catch (error) {
                console.error('Error creating item:', error);
            }
        }
    }
}

// Item component for each individual grocery item
function itemComponent(item) {
    return {
        item: item,
        mode: 'view',

        async togglePurchased() {
            try {
                if (this.item.purchased) {
                    await needItem(this.item.id);
                    this.item.purchased = false;
                } else {
                    await boughtItem(this.item);
                    this.item.purchased = true;
                }
                // Trigger parent reload
                this.$root.loadItems();
            } catch (error) {
                console.error('Error toggling purchased status:', error);
            }
        },

        async updateItem() {
            try {
                await updateItem(this.item);
                this.mode = 'view';
                this.$root.loadItems();
            } catch (error) {
                console.error('Error updating item:', error);
            }
        },

        async deleteItem() {
            if (confirm(`Really delete ${this.item.name}?`)) {
                try {
                    await deleteItem(this.item.id);
                    this.$root.loadItems();
                } catch (error) {
                    console.error('Error deleting item:', error);
                }
            }
        }
    }
}

// Make functions globally available for Alpine.js
window.groceryApp = groceryApp;
window.itemComponent = itemComponent;