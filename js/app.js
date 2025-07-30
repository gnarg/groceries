// Alpine.js components using global scripts (not ES6 modules)

// Main grocery app Alpine.js data
function groceryApp() {
    return {
        purchased: false,
        filterTag: null,
        search: null,
        items: [],
        loading: false,
        searchTimeout: null,
        newItem: {
            name: '',
            tags: '',
            purchased: false,
            notes: ''
        },

        async loadItems() {
            this.loading = true;

            // Check if user is authenticated
            if (!window.pb.authStore.isValid) {
                window.location.href = 'auth.html';
                return;
            }

            try {
                this.items = await window.groceryAPI.listItems(this.purchased, this.filterTag, this.search);
                // Ensure tags is always a string
                this.items = this.items.map(item => ({
                    ...item,
                    tags: item.tags || ''
                }));
            } catch (error) {
                console.error('Error loading items:', error);
                this.items = [];
            } finally {
                this.loading = false;
            }
        },

        debouncedLoadItems() {
            // Clear existing timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            // Set new timeout for 300ms delay
            this.searchTimeout = setTimeout(() => {
                this.loadItems();
            }, 300);
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
                await window.groceryAPI.createItem(this.newItem);
                this.newItem = { name: '', tags: '', purchased: false, notes: '' };
                this.loadItems();
            } catch (error) {
                console.error('Error creating item:', error);
            }
        }
    };
}

// Item component for each individual grocery item
function itemComponent(item) {
    return {
        item: item,
        mode: 'view',

        async togglePurchased() {
            try {
                if (this.item.purchased) {
                    await window.groceryAPI.needItem(this.item.id);
                    this.item.purchased = false;
                } else {
                    await window.groceryAPI.boughtItem(this.item);
                    this.item.purchased = true;
                }
                // Trigger parent reload by dispatching event
                this.$dispatch('reload-items');
            } catch (error) {
                console.error('Error toggling purchased status:', error);
            }
        },

        async updateItem() {
            try {
                await window.groceryAPI.updateItem(this.item);
                this.mode = 'view';
                this.$dispatch('reload-items');
            } catch (error) {
                console.error('Error updating item:', error);
            }
        },

        async deleteItem() {
            if (confirm(`Really delete ${this.item.name}?`)) {
                try {
                    await window.groceryAPI.deleteItem(this.item.id);
                    this.$dispatch('reload-items');
                } catch (error) {
                    console.error('Error deleting item:', error);
                }
            }
        }
    };
}

// Make functions globally available for Alpine.js
window.groceryApp = groceryApp;
window.itemComponent = itemComponent;
