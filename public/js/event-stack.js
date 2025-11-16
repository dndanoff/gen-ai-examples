export class EventStack {
    constructor(containerElement) {
        this.container = containerElement;
        this.initialize();
    }

    initialize() {
        this.showPlaceholder();
    }

    createItem(id, { name, status, statusText, details }) {
        this.removePlaceholder();

        const stackItem = document.createElement('div');
        stackItem.className = 'stack-item';
        stackItem.dataset.id = id;

        stackItem.innerHTML = `
            <div class="stack-item-header">
                <div class="stack-item-title">
                    <div class="stack-item-icon ${status}"></div>
                    <div class="stack-item-label">
                        <div class="stack-item-name">${name}</div>
                        <div class="stack-item-status">${statusText}</div>
                    </div>
                </div>
                <div class="stack-item-expand">▼</div>
            </div>
            <div class="stack-item-content">
                <div class="stack-item-details">
                    <pre style="margin: 0; font-size: 0.85rem; line-height: 1.6; overflow-x: auto;">${JSON.stringify(details, null, 2)}</pre>
                </div>
            </div>
        `;

        const header = stackItem.querySelector('.stack-item-header');
        header.addEventListener('click', () => {
            stackItem.classList.toggle('expanded');
        });

        // Prepend to show newest on top
        this.container.insertBefore(stackItem, this.container.firstChild);
    }

    updateItem(id, { status, statusText, details }) {
        const stackItem = this.container.querySelector(`[data-id="${id}"]`);
        if (!stackItem) return;

        const icon = stackItem.querySelector('.stack-item-icon');
        icon.className = `stack-item-icon ${status}`;

        const statusEl = stackItem.querySelector('.stack-item-status');
        statusEl.textContent = statusText;

        const detailsEl = stackItem.querySelector('.stack-item-details pre');
        detailsEl.textContent = JSON.stringify(details, null, 2);
    }

    clear() {
        this.container.innerHTML = '';
        this.showPlaceholder();
    }

    showPlaceholder() {
        this.container.innerHTML = '<div class="execution-placeholder">Click "Generate" to start the workflow</div>';
    }

    removePlaceholder() {
        const placeholder = this.container.querySelector('.execution-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    }
}
