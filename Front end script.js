const API_BASE = "http://localhost:5000/api";

async function loadMenu() {
  const res = await fetch(`${API_BASE}/menu`);
  const items = await res.json();
  const tbody = document.querySelector("#menuTable tbody");
  tbody.innerHTML = "";
  for (const it of items) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${it.name}</td><td>${it.type}</td><td>Rs. ${it.price}</td>`;
    tbody.appendChild(tr);
  }
}

async function submitContact(e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message })
  });

  if (res.ok) {
    alert("Message sent successfully!");
    document.getElementById("contactForm").reset();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(`Error: ${err.error || "Unable to send"}`);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMenu();
  document.getElementById("contactForm").addEventListener("submit", submitContact);
});
    
