// app.js - Dashboard with JWT auth
(async () => {
  // Get auth token and tenant info
  const token = localStorage.getItem('xeno_token');
  const email = localStorage.getItem('xeno_email');
  const tenantId = localStorage.getItem('xeno_tenant');
  const shopDomain = localStorage.getItem('xeno_shop');

  if (!token || !email || !tenantId) {
    // Not authenticated — go back to login
    location.href = '/';
    return;
  }

  // Elements
  const tenantBadge = document.getElementById('tenantBadge');
  const logoutBtn = document.getElementById('logoutBtn');
  const syncBtn = document.getElementById('syncBtn');
  const syncText = document.getElementById('syncText');
  const totalCustomersEl = document.getElementById('totalCustomers');
  const totalOrdersEl = document.getElementById('totalOrders');
  const totalRevenueEl = document.getElementById('totalRevenue');
  const topCustomersEl = document.getElementById('topCustomers');
  const ordersTable = document.getElementById('ordersTable');
  const lastSyncEl = document.getElementById('lastSync');

  const fromDateEl = document.getElementById('fromDate');
  const toDateEl = document.getElementById('toDate');
  const refreshBtn = document.getElementById('refreshBtn');

  tenantBadge.textContent = `${email} • tenant: ${tenantId}`;

  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    location.href = '/';
  });

  // Build auth header with JWT
  function getHeaders() {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Chart setup
  const ctx = document.getElementById('revenueChart').getContext('2d');
  const revenueChart = new Chart(ctx, {
    type: 'line',
    data: { 
      labels: [], 
      datasets: [{
        label: 'Revenue',
        data: [],
        tension: 0.3,
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false }, 
        tooltip: { mode: 'index' } 
      },
      scales: { 
        y: { 
          beginAtZero: true,
          ticks: { color: '#9ca3af' },
          grid: { color: '#374151' }
        },
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: '#374151' }
        }
      }
    }
  });

  // Fetch metrics
  async function fetchMetrics() {
    try {
      const params = new URLSearchParams();
      if (fromDateEl.value) params.set('from', fromDateEl.value);
      if (toDateEl.value) params.set('to', toDateEl.value);

      const res = await fetch(`/metrics?${params}`, {
        headers: getHeaders()
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert('Session expired. Please login again.');
          location.href = '/';
          return;
        }
        throw new Error('Failed to fetch metrics: ' + res.statusText);
      }

      const data = await res.json();

      // Remove loading class
      totalCustomersEl.classList.remove('loading');
      totalOrdersEl.classList.remove('loading');
      totalRevenueEl.classList.remove('loading');

      // Update UI
      totalCustomersEl.textContent = data.totalCustomers ?? 0;
      totalOrdersEl.textContent = data.totalOrders ?? 0;
      totalRevenueEl.textContent = Number(data.totalRevenue ?? 0).toLocaleString(undefined, { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 2 
      });

      // Top customers
      topCustomersEl.innerHTML = '';
      (data.topCustomers || []).forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.email ?? (c.firstName || '—')} — ${Number(c.totalSpent ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}`;
        topCustomersEl.appendChild(li);
      });

      // Revenue chart
      const ob = data.ordersByDate || [];
      const labels = ob.map(r => {
        const d = new Date(r.day);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const revenues = ob.map(r => Number(r.revenue ?? 0));

      revenueChart.data.labels = labels;
      revenueChart.data.datasets[0].data = revenues;
      revenueChart.update();

      // Orders table
      try {
        const ordersRes = await fetch('/orders?limit=10', { headers: getHeaders() });
        if (ordersRes.ok) {
          const orderData = await ordersRes.json();
          ordersTable.innerHTML = '';
          (orderData.orders || []).forEach(o => {
            const tr = document.createElement('tr');
            tr.className = 'border-t border-gray-700 hover:bg-gray-800';
            tr.innerHTML = `
              <td class="p-2">${new Date(o.createdAt).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</td>
              <td class="p-2 font-mono text-xs">${o.shopId.slice(0, 8)}...</td>
              <td class="p-2">${Number(o.total ?? 0).toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}</td>
            `;
            ordersTable.appendChild(tr);
          });
        } else {
          ordersTable.innerHTML = '<tr><td class="p-2 text-gray-400" colspan="3">No orders available</td></tr>';
        }
      } catch (err) {
        ordersTable.innerHTML = '<tr><td class="p-2 text-gray-400" colspan="3">Orders load error</td></tr>';
      }

      // Get sync status
      try {
        const syncRes = await fetch('/sync/status', { headers: getHeaders() });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          const lastSync = syncData.lastSyncAt ? new Date(syncData.lastSyncAt).toLocaleString() : 'Never';
          lastSyncEl.textContent = `Last sync: ${lastSync}`;
        }
      } catch (err) {
        lastSyncEl.textContent = 'Sync status unavailable';
      }

    } catch (err) {
      console.error(err);
      alert('Error loading metrics: ' + (err.message || err));
    }
  }

  // Sync now button
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled = true;
    syncText.textContent = 'Syncing...';

    try {
      const res = await fetch('/sync/now', {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) {
        throw new Error('Sync failed');
      }

      const result = await res.json();
      alert(`Sync complete: ${result.customers} customers, ${result.orders} orders, ${result.products} products`);
      await fetchMetrics();
    } catch (err) {
      alert('Sync error: ' + err.message);
    } finally {
      syncBtn.disabled = false;
      syncText.textContent = 'Sync Now';
    }
  });

  // Set default date range: last 30 days
  const t = new Date();
  toDateEl.value = t.toISOString().slice(0, 10);
  t.setDate(t.getDate() - 30);
  fromDateEl.value = t.toISOString().slice(0, 10);

  // Event listeners
  refreshBtn.addEventListener('click', fetchMetrics);

  // Load metrics on page open
  await fetchMetrics();

  // Auto-refresh every 5 minutes
  setInterval(fetchMetrics, 5 * 60 * 1000);
})();
