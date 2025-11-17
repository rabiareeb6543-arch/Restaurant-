PRAGMA foreign_keys = ON;

-- Users (for auth: admin, staff)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','staff'))
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('Starter','Main','Dessert','Drink')),
  price INTEGER NOT NULL CHECK(price >= 0),
  is_active INTEGER NOT NULL DEFAULT 1
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Preparing','Ready','Completed','Cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL CHECK(quantity > 0)
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  phone TEXT,
  table_no INTEGER NOT NULL,
  reserved_at TEXT NOT NULL, -- ISO datetime
  notes TEXT
);

-- Contact messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed minimal data
INSERT OR IGNORE INTO users (email, password_hash, role)
VALUES
('admin@delishdine.pk', '$2a$10$kzo3XvYqE3YHsamplehashReplaceInSetup', 'admin');

INSERT OR IGNORE INTO menu_items (id, name, type, price, is_active) VALUES
(1, 'Chicken Alfredo Pasta', 'Main', 850, 1),
(2, 'Caesar Salad', 'Starter', 450, 1),
(3, 'Grilled Fish', 'Main', 950, 1),
(4, 'Chocolate Lava Cake', 'Dessert', 550, 1),
(5, 'French Fries', 'Starter', 300, 1);
