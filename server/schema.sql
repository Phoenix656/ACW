-- Alert System Database Schema

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'master')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Documents table for tracking expirable items
CREATE TABLE IF NOT EXISTS documents (
    doc_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    issue_date DATE,
    expiration_date DATE NOT NULL,
    renewal_status VARCHAR(20) DEFAULT 'active' CHECK (renewal_status IN ('active', 'pending', 'expired', 'renewed')),
    renewal_due_days INTEGER DEFAULT 30,
    file_path VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications/alerts table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    doc_id INTEGER REFERENCES documents(doc_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) CHECK (notification_type IN ('alert', 'reminder', 'urgent')),
    scheduled_date DATE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for document updates
CREATE TABLE IF NOT EXISTS audit_log (
    log_id SERIAL PRIMARY KEY,
    doc_id INTEGER REFERENCES documents(doc_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiration ON documents(expiration_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);

-- Insert default master user (password: master123 - should be changed)
INSERT IF NOT EXISTS INTO users (username, password_hash, role)
VALUES ('master', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'master')
ON CONFLICT (username) DO NOTHING;