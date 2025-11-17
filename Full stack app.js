// app.js
// Single-file, working Restaurant Management System (frontend + backend) using only Node.js built-ins.
// How to run:
// 1) Save this file as app.js
// 2) Run: node app.js
// 3) Open: http://localhost:8080

const http = require("http");
const url = require("url");

// In-memory data (simple, demo-ready)
const state = {
  menu: [
    { id: 1, name: "Chicken Alfredo Pasta", type: "Main", price: 850, is_active: true },
    { id: 2, name: "Caesar Salad", type: "Starter", price: 450, is_active: true },
    { id: 3, name: "Grilled Fish", type: "Main", price: 950, is_active: true },
    { id: 4, name: "Chocolate Lava Cake", type: "Dessert", price: 550, is_active: true },
    { id: 5, name: "French Fries", type: "Starter", price: 300, is_active: true }
  ],
  contacts: [],
  orders: [],         // { id, customer_name, status, created_at, items: [{menu_item_id, quantity}] }
  reservations: []    // { id, customer_name, phone, table_no, reserved_at, notes }
};

// Helpers
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1e6) { // 1MB guard
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
  });
}

function validate(obj, rules) {
  for (const [key, rule] of Object.entries(rules)) {
    const val = obj[key];
    if (!rule.optional && (val === undefined || val === null || val === "")) return `${key} is required`;
    if (val === undefined || val === null) continue;
    if (rule.type && typeof val !== rule.type) return `${key} must be ${rule.type}`;
    if (rule.minLength && typeof val === "string" && val.length < rule.minLength) return `${key} must have at least ${rule.minLength} characters`;
    if (rule.maxLength && typeof val === "string" && val.length > rule.maxLength) return `${key} must have at most ${rule.maxLength} characters`;
    if (rule.enum && !rule.enum.includes(val)) return `${key} must be one of ${rule.enum.join(", ")}`;
    if (rule.min && typeof val === "number" && val < rule.min) return `${key} must be >= ${rule.min}`;
    if (rule.int && (typeof val !== "number" || !Number.isInteger(val))) return `${key} must be an integer`;
    if (rule.pattern && typeof val === "string" && !rule.pattern.test(val)) return `${key} format is invalid`;
  }
  return null;
}

// Frontend HTML (inline CSS + JS)
const INDEX_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Delish Dine Restaurant</title>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f9f6f2; margin: 0; padding: 0; }
    .header { background-color: #a9441b; color: white; text-align: center; padding: 20px; }
    .header h3 { font-style: italic; color: #ffddb6; }
    .intro { text-align: center; margin: 10px auto; width: 80%; font-size: 16px; }
    hr { width: 70%; border: 1px solid #fff; }
    .menu { text-align: center; margin-top: 20px; }
    table { width: 60%; margin: 0 auto; border-collapse: collapse; }
    th, td { border: 1px solid #a9441b; padding: 10px; text-align: center; }
    th { background-color: #ffe5cc; color: #a9441b; }
    td { background-color: #fff8f2; }
    .offers { width: 60%; margin: 30px auto; background-color: #fff3e0; border-left: 5px solid #a9441b; padding: 15px; }
    .offers h3 { text-align: center; color: #a9441b; }
    .offers ul { font-size: 15px; line-height: 1.8; }
    .contact, .orders, .reservations { width: 60%; margin: 30px auto; background-color: #ffe7cc; padding: 20px; border-radius: 8px; }
    .contact h3, .orders h3, .reservations h3 { text-align: center; color: #a9441b; }
    input, textarea, select { width: 95%; padding: 8px; margin: 6px 0; border: 1px solid #a9441b; border-radius: 4px; }
    textarea { height: 80px; }
    button { display: inline-block; padding: 10px 16px; background-color: #a9441b; color: white; border: none; border-radius: 4px; cursor: pointer; }
    button:hover { background-color: #802f0f; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .row > div { flex: 1; min-width: 240px; }
    .badge { display:inline-block; padding:2px 8px; border-radius:12px; background:#a9441b; color:#fff; font-size:12px; }
    .list { margin-top: 10px; }
    .list-item { background: #fff; border: 1px solid #a9441b; border-radius: 6px; padding: 8px; margin: 6px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Delish Dine Restaurant</h1>
    <h3>Taste that touches your heart"</h3>
    <hr>
    <p class="intro">Welcome to <b>Delish Dine</b> - where every meal is crafted with <i>love</i>, <u>flavor</u>, and <big>freshness</big>.</p>
    <p>We serve <small>happiness</small> in every bite!</p>
  </div>

  <div class="menu">
    <h2><u>Our Menu</u></h2>
    <table id="menuTable">
      <thead><tr><th>Dish Name</th><th>Type</th><th>Price</th></tr></thead>
      <tbody></tbody>
    </table>
  </div>

  <div class="offers">
    <h3>Our Special Offers</h3>
    <ul>
      <li>Buy One Get One Free on Weekends</li>
      <li>Free Dessert with Family Combo</li>
      <li>20% Discount for Students</li>
      <li>Home Delivery Available</li>
    </ul>
  </div>

  <div class="contact">
    <h3>Contact Us</h3>
    <form id="contactForm">
      <label>Name:</label><br>
      <input type="text" id="name" placeholder="Enter your name"><br>
      <label>Email:</label><br>
      <input type="email" id="email" placeholder="Enter your email"><br>
      <label>Message:</label><br>
      <textarea id="message" placeholder="Your message here..."></textarea><br>
      <button type="submit">Send Message</button>
    </form>
    <div id="contactStatus" class="list"></div>
  </div>

  <div class="orders">
    <h3>Place Order</h3>
    <div class="row">
      <div>
        <label>Customer name (optional):</label>
        <input type="text" id="orderCustomer" placeholder="e.g., Ali Khan" />
      </div>
      <div>
        <label>Select item:</label>
        <select id="orderItem"></select>
      </div>
      <div>
        <label>Quantity:</label>
        <input type="number" id="orderQty" value="1" min="1" />
      </div>
    </div>
    <button id="addToOrder">Add to order</button>
    <button id="submitOrder">Submit order</button>
    <div id="orderItems" class="list"></div>

    <h3 style="margin-top:20px;">Recent Orders <span class="badge" id="ordersCount">0</span></h3>
    <div id="ordersList" class="list"></div>
  </div>

  <div class="reservations">
    <h3>Create Reservation</h3>
    <div class="row">
      <div>
        <label>Customer name:</label>
        <input type="text" id="resName" placeholder="e.g., Ayesha" />
      </div>
      <div>
        <label>Phone:</label>
        <input type="text" id="resPhone" placeholder="+92XXXXXXXXXX" />
      </div>
      <div>
        <label>Table no:</label>
        <input type="number" id="resTable" min="1" value="1" />
      </div>
      <div>
        <label>Reserved at:</label>
        <input type="datetime-local" id="resAt" />
      </div>
    </div>
    <label>Notes:</label>
    <textarea id="resNotes" placeholder="Special requests..."></textarea>
    <button id="submitRes">Create reservation</button>

    <h3 style="margin-top:20px;">Reservations <span class="badge" id="resCount">0</span></h3>
    <div id="resList" class="list"></div>
  </div>

  <script>
    const API = {
      menu: () => fetch("/api/menu").then(r => r.json()),
      contact: (payload) => fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(r => r.json()),
      orderCreate: (payload) => fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(async r => ({ ok: r.ok, data: await r.json().catch(()=>({})) })),
      ordersList: () => fetch("/api/orders").then(r => r.json()),
      resCreate: (payload) => fetch("/api/reservations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then(async r => ({ ok: r.ok, data: await r.json().catch(()=>({})) })),
      resList: () => fetch("/api/reservations").then(r => r.json()),
    };

    const orderCart = []; // {menu_item_id, quantity}

    function renderMenu(items) {
      const tbody = document.querySelector("#menuTable tbody");
      tbody.innerHTML = items.map(it => \`<tr><td>\${it.name}</td><td>\${it.type}</td><td>Rs. \${it.price}</td></tr>\`).join("");
      const sel = document.getElementById("orderItem");
      sel.innerHTML = items.map(it => \`<option value="\${it.id}">\${it.name} (Rs. \${it.price})</option>\`).join("");
    }

    function renderOrderCart() {
      const list = document.getElementById("orderItems");
      if (orderCart.length === 0) { list.innerHTML = "<div class='list-item'>No items in order.</div>"; return; }
      list.innerHTML = orderCart.map((it, idx) => \`<div class='list-item'>Item #\${idx+1} — ID: \${it.menu_item_id}, Qty: \${it.quantity}</div>\`).join("");
    }

    function renderOrders(orders) {
      document.getElementById("ordersCount").textContent = orders.length;
      const list = document.getElementById("ordersList");
      list.innerHTML = orders.map(o => {
        const items = (o.items || []).map(i => \`<span class='badge'>#\${i.menu_item_id} x\${i.quantity}</span>\`).join(" ");
        return \`<div class='list-item'><b>Order \${o.id}</b> — \${o.customer_name || "Walk-in"} — \${o.status} — \${new Date(o.created_at).toLocaleString()}<br/>\${items}</div>\`;
      }).join("");
    }

    function renderReservations(rows) {
      document.getElementById("resCount").textContent = rows.length;
      const list = document.getElementById("resList");
      list.innerHTML = rows.map(r => \`<div class='list-item'><b>Res \${r.id}</b> — \${r.customer_name} — Table \${r.table_no} — \${new Date(r.reserved_at).toLocaleString()}<br/>\${r.phone || ""} \${r.notes ? (" | " + r.notes) : ""}</div>\`).join("");
    }

    async function init() {
      try {
        const menu = await API.menu();
        renderMenu(menu);
        renderOrderCart();
        const orders = await API.ordersList();
        renderOrders(orders);
        const res = await API.resList();
        renderReservations(res);
      } catch (e) {
        console.error(e);
        alert("Failed to load initial data.");
      }
    }

    document.addEventListener("DOMContentLoaded", () => {
      init();

      document.getElementById("contactForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const message = document.getElementById("message").value.trim();
        const status = document.getElementById("contactStatus");

        const resp = await API.contact({ name, email, message });
        status.innerHTML = "<div class='list-item'>"+(resp.message || resp.error || "Submitted")+"</div>";
        if (!resp.error) document.getElementById("contactForm").reset();
      });

      document.getElementById("addToOrder").addEventListener("click", () => {
        const id = parseInt(document.getElementById("orderItem").value, 10);
        const qty = Math.max(1, parseInt(document.getElementById("orderQty").value, 10) || 1);
        orderCart.push({ menu_item_id: id, quantity: qty });
        renderOrderCart();
      });

      document.getElementById("submitOrder").addEventListener("click", async () => {
        const name = document.getElementById("orderCustomer").value.trim() || undefined;
        if (orderCart.length === 0) { alert("Add at least one item."); return; }
        const { ok, data } = await API.orderCreate({ customer_name: name, items: orderCart });
        if (ok) {
          alert("Order placed: #" + data.order_id);
          orderCart.length = 0;
          renderOrderCart();
          const orders = await API.ordersList();
          renderOrders(orders);
        } else {
          alert("Order error: " + (data.error || "Unknown"));
        }
      });

      document.getElementById("submitRes").addEventListener("click", async () => {
        const customer_name = document.getElementById("resName").value.trim();
        const phone = document.getElementById("resPhone").value.trim();
        const table_no = parseInt(document.getElementById("resTable").value, 10);
        const reserved_at = document.getElementById("resAt").value;
        const notes = document.getElementById("resNotes").value.trim() || undefined;
        const { ok, data } = await API.resCreate({ customer_name, phone, table_no, reserved_at, notes });
        if (ok) {
          alert("Reservation created: #" + data.id);
          const res = await API.resList();
          renderReservations(res);
        } else {
          alert("Reservation error: " + (data.error || "Unknown"));
        }
      });
    });
  </script>
</body>
</html>`;

// Router
async function handleApi(req, res) {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;
  const method = req.method;

  // GET /api/menu
  if (method === "GET" && path === "/api/menu") {
    const active = state.menu.filter(m => m.is_active);
    return sendJson(res, 200, active);
  }

  // POST /api/contact
  if (method === "POST" && path === "/api/contact") {
    try {
      const body = await readBody(req);
      const err = validate(body, {
        name: { type: "string", minLength: 2 },
        email: { type: "string", pattern: /^[^@\s]+@[^@\s]+\.[^@\s]+$/ },
        message: { type: "string", minLength: 5 }
      });
      if (err) return sendJson(res, 400, { error: err });
      const msg = { id: state.contacts.length + 1, name: body.name, email: body.email, message: body.message, created_at: new Date().toISOString() };
      state.contacts.push(msg);
      return sendJson(res, 201, { id: msg.id, message: "Form submitted successfully!" });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // POST /api/orders
  if (method === "POST" && path === "/api/orders") {
    try {
      const body = await readBody(req);
      const items = Array.isArray(body.items) ? body.items : [];
      if (items.length === 0) return sendJson(res, 400, { error: "items is required (non-empty array)" });
      for (const it of items) {
        if (!it || typeof it.menu_item_id !== "number" || typeof it.quantity !== "number" || it.quantity <= 0) {
          return sendJson(res, 400, { error: "Invalid order items" });
        }
        const exists = state.menu.find(m => m.id === it.menu_item_id && m.is_active);
        if (!exists) return sendJson(res, 400, { error: "Menu item not found or inactive: " + it.menu_item_id });
      }
      const order = {
        id: state.orders.length + 1,
        customer_name: body.customer_name || null,
        status: "Pending",
        created_at: new Date().toISOString(),
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity }))
      };
      state.orders.push(order);
      return sendJson(res, 201, { order_id: order.id });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // GET /api/orders
  if (method === "GET" && path === "/api/orders") {
    const data = state.orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sendJson(res, 200, data);
  }

  // POST /api/reservations
  if (method === "POST" && path === "/api/reservations") {
    try {
      const body = await readBody(req);
      const err = validate(body, {
        customer_name: { type: "string", minLength: 2 },
        phone: { type: "string", optional: true },
        table_no: { type: "number", int: true, min: 1 },
        reserved_at: { type: "string", minLength: 10 },
        notes: { type: "string", optional: true }
      });
      if (err) return sendJson(res, 400, { error: err });
      const resv = {
        id: state.reservations.length + 1,
        customer_name: body.customer_name,
        phone: body.phone || null,
        table_no: body.table_no,
        reserved_at: body.reserved_at,
        notes: body.notes || null
      };
      state.reservations.push(resv);
      return sendJson(resv, 201, { id: resv.id });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  // GET /api/reservations
  if (method === "GET" && path === "/api/reservations") {
    const data = state.reservations.slice().sort((a, b) => new Date(b.reserved_at) - new Date(a.reserved_at));
    return sendJson(res, 200, data);
  }

  return notFound(res);
}

// Server
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname.startsWith("/api/")) {
    return handleApi(req, res);
  }

  // Serve the single-page app for all non-API routes
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(INDEX_HTML);
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Delish Dine running at http://localhost:${PORT}`);
});
