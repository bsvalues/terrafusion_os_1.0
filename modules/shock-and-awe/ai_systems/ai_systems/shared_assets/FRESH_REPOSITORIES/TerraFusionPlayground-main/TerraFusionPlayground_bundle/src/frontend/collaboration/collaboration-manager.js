class CollaborationManager {
    constructor() {
        this.socket = null;
        this.room = null;
        this.users = new Map();
        this.cursors = new Map();
        this.selections = new Map();
        this.changes = [];
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async connect(roomId, userId, username) {
        try {
            this.room = roomId;
            this.userId = userId;
            this.username = username;

            this.socket = new WebSocket(`ws://${window.location.host}/ws/collaboration/${roomId}`);

            this.socket.onopen = () => {
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.sendUserJoin();
                this.setupEventListeners();
            };

            this.socket.onclose = () => {
                this.isConnected = false;
                this.handleDisconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.handleError(error);
            };

            this.socket.onmessage = (event) => {
                this.handleMessage(JSON.parse(event.data));
            };

            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            return false;
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
    }

    sendUserJoin() {
        this.send({
            type: 'user_join',
            data: {
                userId: this.userId,
                username: this.username,
                cursor: this.getCursorPosition()
            }
        });
    }

    handleUserJoin(data) {
        this.users.set(data.userId, {
            username: data.username,
            cursor: data.cursor
        });
        this.updateUserList();
    }

    handleUserLeave(userId) {
        this.users.delete(userId);
        this.cursors.delete(userId);
        this.selections.delete(userId);
        this.updateUserList();
    }

    handleCursorUpdate(data) {
        this.cursors.set(data.userId, data.cursor);
        this.updateCursors();
    }

    handleSelectionUpdate(data) {
        this.selections.set(data.userId, data.selection);
        this.updateSelections();
    }

    handleChange(data) {
        this.changes.push(data);
        this.applyChange(data);
    }

    applyChange(change) {
        // Apply the change to the document
        const { type, position, content } = change;
        const editor = document.querySelector('.CodeMirror').CodeMirror;
        
        switch (type) {
            case 'insert':
                editor.replaceRange(content, position);
                break;
            case 'delete':
                editor.replaceRange('', position, {
                    line: position.line,
                    ch: position.ch + content.length
                });
                break;
            case 'replace':
                editor.replaceRange(content, position, {
                    line: position.line,
                    ch: position.ch + content.length
                });
                break;
        }
    }

    getCursorPosition() {
        const editor = document.querySelector('.CodeMirror').CodeMirror;
        const cursor = editor.getCursor();
        return {
            line: cursor.line,
            ch: cursor.ch
        };
    }

    getSelection() {
        const editor = document.querySelector('.CodeMirror').CodeMirror;
        const selection = editor.getSelection();
        const from = editor.getCursor('from');
        const to = editor.getCursor('to');
        return {
            text: selection,
            from,
            to
        };
    }

    handleKeyPress(event) {
        if (!this.isConnected) return;

        const editor = document.querySelector('.CodeMirror').CodeMirror;
        const cursor = this.getCursorPosition();
        const selection = this.getSelection();

        this.send({
            type: 'cursor_update',
            data: {
                userId: this.userId,
                cursor
            }
        });

        if (selection.text) {
            this.send({
                type: 'selection_update',
                data: {
                    userId: this.userId,
                    selection
                }
            });
        }
    }

    handleMouseMove(event) {
        if (!this.isConnected) return;

        const editor = document.querySelector('.CodeMirror').CodeMirror;
        const cursor = this.getCursorPosition();

        this.send({
            type: 'cursor_update',
            data: {
                userId: this.userId,
                cursor
            }
        });
    }

    handleSelectionChange() {
        if (!this.isConnected) return;

        const selection = this.getSelection();
        if (selection.text) {
            this.send({
                type: 'selection_update',
                data: {
                    userId: this.userId,
                    selection
                }
            });
        }
    }

    handleMessage(message) {
        switch (message.type) {
            case 'user_join':
                this.handleUserJoin(message.data);
                break;
            case 'user_leave':
                this.handleUserLeave(message.data.userId);
                break;
            case 'cursor_update':
                this.handleCursorUpdate(message.data);
                break;
            case 'selection_update':
                this.handleSelectionUpdate(message.data);
                break;
            case 'change':
                this.handleChange(message.data);
                break;
        }
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect(this.room, this.userId, this.username);
            }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        }
    }

    handleError(error) {
        console.error('Collaboration error:', error);
        // Implement error handling logic
    }

    send(message) {
        if (this.isConnected && this.socket) {
            this.socket.send(JSON.stringify(message));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }

    updateUserList() {
        const userList = document.getElementById('user-list');
        if (!userList) return;

        userList.innerHTML = '';
        this.users.forEach((user, userId) => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <span class="user-avatar">${user.username[0].toUpperCase()}</span>
                <span class="user-name">${user.username}</span>
            `;
            userList.appendChild(userElement);
        });
    }

    updateCursors() {
        const editor = document.querySelector('.CodeMirror').CodeMirror;
        this.cursors.forEach((cursor, userId) => {
            const user = this.users.get(userId);
            if (!user) return;

            const cursorElement = document.createElement('div');
            cursorElement.className = 'remote-cursor';
            cursorElement.style.left = `${cursor.ch * 8}px`;
            cursorElement.style.top = `${cursor.line * 19}px`;
            cursorElement.innerHTML = `
                <span class="cursor-name">${user.username}</span>
            `;

            const existingCursor = document.querySelector(`.remote-cursor[data-user="${userId}"]`);
            if (existingCursor) {
                existingCursor.remove();
            }

            editor.getWrapperElement().appendChild(cursorElement);
        });
    }

    updateSelections() {
        const editor = document.querySelector('.CodeMirror').CodeMirror;
        this.selections.forEach((selection, userId) => {
            const user = this.users.get(userId);
            if (!user) return;

            editor.markText(selection.from, selection.to, {
                className: `remote-selection remote-selection-${userId}`,
                css: `background-color: ${this.getUserColor(userId)}`
            });
        });
    }

    getUserColor(userId) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'
        ];
        return colors[userId.charCodeAt(0) % colors.length];
    }
}

// Export the collaboration manager
window.CollaborationManager = CollaborationManager; 