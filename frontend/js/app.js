// app.js - simple client for /metrics
(async () => {
  // Helpers
  const tenant = localStorage.getItem('xeno_tenant');
  const email = localStorage.getItem('xeno_email');

  if (!tenant || !email) {
    // not logged in — go back
    location.href = '/';
    return;
  }

  // Elements
  const tenantBadge = document.getElementById('tenantBadge');
  const logoutBtn = document.getElementById('logoutBtn');
  const totalCustomersEl = document.getElementById('totalCustomers');
  const totalOrdersEl = document.getElementById('totalOrders');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const topCustomersEl = document.getElementById('topCustomers');
  const ordersTable = document.getElementById('ordersTable');

  const fromDateEl = document.getElementById('fromDate');
  const toDateEl = document.getElementById('toDate');
  const refreshBtn = document.getElementById('refreshBtn');

  tenantBadge.textContent = `${email} · tenant: ${tenant}`;

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('xeno_email');
    localStorage.removeItem('xeno_tenant');
    location.href = '/';
  });

  // Chart.js setup
  const ctx = document.getElementById('revenueChart').getContext('2d');
  const revenueChart = new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Revenue', data: [], tension: 0.3, fill: true }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Build headers
  function buildHeaders() {
    // if tenant looks numeric, use x-tenant-id else use x-shop-domain
    const headers = {};
    if (/^\d+$/.test(tenant)) headers['x-tenant-id'] = tenant;
    else headers['x-shop-domain'] = tenant;
    return headers;
  }

  // Fetch metrics
  async function fetchMetrics() {
    try {
      const headers = buildHeaders();
      const params = new URLSearchParams();
      if (fromDateEl.value) params.set('from', fromDateEl.value);
      if (toDateEl.value) params.set('to', toDateEl.value);
      const url = `/metrics?${params.toString()}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error('Failed to fetch metrics: ' + res.statusText);
      const data = await res.json();

      // update UI
      totalCustomersEl.textContent = data.totalCustomers ?? 0;
      totalOrdersEl.textContent = data.totalOrders ?? 0;
      totalRevenueEl.textContent = Number(data.totalRevenue ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

      // top customers
      topCustomersEl.innerHTML = '';
      (data.topCustomers || []).forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.email ?? (c.firstName || '—')} — ${Number(c.totalSpent ?? 0).toLocaleString()}`;
        topCustomersEl.appendChild(li);
      });

      // orders by date -> chart
      const ob = data.ordersByDate || [];
      const labels = ob.map(r => {
        const d = new Date(r.date || r.day || r.day);
        return d.toLocaleDateString();
      });
      const revenues = ob.map(r => Number(r.revenue ?? r.sum ?? 0));

      revenueChart.data.labels = labels;
      revenueChart.data.datasets[0].data = revenues;
      revenueChart.update();

      // latest orders table (we don't have an API for paginated orders by default; use a quick /orders fallback)
      // If backend has /orders?limit=10 we can call it; otherwise show orders from ordersByDate is fine.
      // For now show last 10 orders summary if backend exposes orders endpoint:
      try {
        const ordersRes = await fetch('/orders?limit=10', { headers });
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          ordersTable.innerHTML = '';
          (orders || []).forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td class="p-2">${new Date(o.createdAt).toLocaleString()}</td>
                            <td class="p-2">${o.shopId}</td>
                            <td class="p-2">${Number(o.total ?? 0).toLocaleString()}</td>`;
            ordersTable.appendChild(tr);
          });
        } else {
          // fallback: clear table
          ordersTable.innerHTML = '<tr><td class="p-2 text-gray-400" colspan="3">Orders endpoint not available</td></tr>';
        }
      } catch (err) {
        ordersTable.innerHTML = '<tr><td class="p-2 text-gray-400" colspan="3">Orders fetch error</td></tr>';
      }

    } catch (err) {
      console.error(err);
      alert('Error loading metrics: ' + (err.message || err));
    }
  }

  // initial date range: last 30 days
  const t = new Date();
  toDateEl.value = t.toISOString().slice(0,10);
  t.setDate(t.getDate() - 30);
  fromDateEl.value = t.toISOString().slice(0,10);

  refreshBtn.addEventListener('click', fetchMetrics);

  // load on open
  await fetchMetrics();

  // optional: auto refresh every 5 minutes
  setInterval(fetchMetrics, 5 * 60 * 1000);
})();
