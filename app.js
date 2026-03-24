// app.js

// ============ DATA STORE ============
let pickupRequests = [];
let completedPickups = [];
let wasteInventory = {
    plastic: 0,
    paper: 0,
    metal: 0,
    organic: 0
};
let householdRequests = [];
let requestIdCounter = 1;
let currentClassifiedWaste = null;
let fillLevel = 35;

// Waste weights per pickup (in kg)
const wasteWeights = {
    plastic: 1.2,
    paper: 0.9,
    metal: 1.5,
    organic: 2.0
};

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateAllDisplays();
    
    // Add sample data for demo
    addSampleData();
});

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.addEventListener('click', () => switchDashboard(btn.dataset.role));
    });
    
    // Household: Image upload
    const uploadArea = document.getElementById('uploadArea');
    const wasteImage = document.getElementById('wasteImage');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', () => wasteImage.click());
    }
    if (wasteImage) {
        wasteImage.addEventListener('change', handleImageUpload);
    }
    
    // Household: Classify button
    const classifyBtn = document.getElementById('classifyBtn');
    if (classifyBtn) {
        classifyBtn.addEventListener('click', classifyWaste);
    }
    
    // Household: Request pickup
    const requestBtn = document.getElementById('requestPickupBtn');
    if (requestBtn) {
        requestBtn.addEventListener('click', requestPickup);
    }
    
    // Household: Simulate fill
    const fillBtn = document.getElementById('simulateFillBtn');
    if (fillBtn) {
        fillBtn.addEventListener('click', simulateFill);
    }
    
    // Recycler: Schedule bulk pickup
    const scheduleBtn = document.getElementById('scheduleRecyclerPickupBtn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', scheduleBulkPickup);
    }
}

// ============ DASHBOARD SWITCHING ============
function switchDashboard(role) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.role === role) {
            btn.classList.add('active');
        }
    });
    
    // Update active dashboard
    document.querySelectorAll('.dashboard').forEach(dashboard => {
        dashboard.classList.remove('active-dashboard');
    });
    
    const dashboardId = role + 'Dashboard';
    const activeDashboard = document.getElementById(dashboardId);
    if (activeDashboard) {
        activeDashboard.classList.add('active-dashboard');
    }
    
    // Refresh data when switching to certain dashboards
    if (role === 'collector') {
        renderPendingRequests();
        renderCompletedLog();
    } else if (role === 'recycler') {
        renderInventory();
    } else if (role === 'analytics') {
        updateAnalytics();
    }
}

// ============ IMAGE HANDLING ============
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            
            // Enable classify button
            const classifyBtn = document.getElementById('classifyBtn');
            if (classifyBtn) classifyBtn.disabled = false;
            
            // Reset result
            const aiResult = document.getElementById('aiResult');
            if (aiResult) {
                aiResult.style.display = 'none';
            }
            currentClassifiedWaste = null;
            const wasteDisplay = document.getElementById('currentWasteDisplay');
            if (wasteDisplay) wasteDisplay.innerHTML = 'Not classified';
        };
        reader.readAsDataURL(file);
    }
}

// ============ AI CLASSIFICATION (Simulated) ============
function classifyWaste() {
    const file = document.getElementById('wasteImage').files[0];
    if (!file) {
        showMessage('pickupStatus', 'Please upload an image first', 'error');
        return;
    }
    
    const aiResult = document.getElementById('aiResult');
    aiResult.style.display = 'block';
    aiResult.className = 'result-badge';
    aiResult.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Analyzing waste material...';
    
    // Simulate AI processing
    setTimeout(() => {
        // Realistic classification based on image name or random for demo
        const categories = ['plastic', 'paper', 'metal', 'organic'];
        const randomIndex = Math.floor(Math.random() * categories.length);
        const classifiedType = categories[randomIndex];
        
        currentClassifiedWaste = classifiedType;
        
        const typeDisplay = classifiedType.charAt(0).toUpperCase() + classifiedType.slice(1);
        aiResult.innerHTML = `<i class="fas fa-check-circle"></i> AI Classification: ${typeDisplay} (confidence: ${Math.floor(85 + Math.random() * 14)}%)`;
        aiResult.classList.add('success');
        
        const wasteDisplay = document.getElementById('currentWasteDisplay');
        if (wasteDisplay) wasteDisplay.innerHTML = typeDisplay;
        
        // Add to household history as classified event
        addToHouseholdHistory(`Classified ${typeDisplay} waste`, 'classification');
        
    }, 1500);
}

// ============ PICKUP REQUEST ============
function requestPickup() {
    if (!currentClassifiedWaste) {
        showMessage('pickupStatus', 'Please classify waste first using AI', 'error');
        return;
    }
    
    const locationInput = document.getElementById('locationInput');
    const location = locationInput ? locationInput.value.trim() : '';
    if (!location) {
        showMessage('pickupStatus', 'Please enter a location', 'error');
        return;
    }
    
    const newRequest = {
        id: requestIdCounter++,
        location: location,
        wasteType: currentClassifiedWaste,
        status: 'pending',
        timestamp: new Date(),
        dateStr: new Date().toLocaleString()
    };
    
    pickupRequests.unshift(newRequest);
    householdRequests.unshift(newRequest);
    
    // Add to household history
    addToHouseholdHistory(`Pickup requested for ${currentClassifiedWaste} at ${location}`, 'pickup');
    
    // Show success message
    showMessage('pickupStatus', `✓ Pickup requested for ${currentClassifiedWaste} at ${location}. Collector notified!`, 'success');
    
    // Reset after request
    currentClassifiedWaste = null;
    const wasteDisplay = document.getElementById('currentWasteDisplay');
    if (wasteDisplay) wasteDisplay.innerHTML = 'Not classified';
    
    const aiResult = document.getElementById('aiResult');
    if (aiResult) aiResult.style.display = 'none';
    
    const classifyBtn = document.getElementById('classifyBtn');
    if (classifyBtn) classifyBtn.disabled = true;
    
    // Refresh displays
    renderHouseholdRequests();
    renderPendingRequests();
    updateAnalytics();
}

// ============ CONFIRM PICKUP (Collector) ============
function confirmPickup(requestId) {
    const requestIndex = pickupRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
        const request = pickupRequests[requestIndex];
        
        // Move to completed
        request.status = 'completed';
        request.completedAt = new Date().toLocaleString();
        completedPickups.unshift(request);
        
        // Remove from pending
        pickupRequests.splice(requestIndex, 1);
        
        // Add to recycler inventory
        const weight = wasteWeights[request.wasteType] || 1.0;
        wasteInventory[request.wasteType] += weight;
        
        // Update household request status
        const householdRequestIndex = householdRequests.findIndex(r => r.id === requestId);
        if (householdRequestIndex !== -1) {
            householdRequests[householdRequestIndex].status = 'completed';
        }
        
        // Refresh displays
        renderPendingRequests();
        renderCompletedLog();
        renderHouseholdRequests();
        renderInventory();
        updateAnalytics();
        
        // Show notification
        showCollectorNotification(`Pickup confirmed! ${request.wasteType} waste collected from ${request.location}`);
    }
}

// ============ SCHEDULE BULK PICKUP (Recycler) ============
function scheduleBulkPickup() {
    const total = wasteInventory.plastic + wasteInventory.paper + wasteInventory.metal + wasteInventory.organic;
    
    if (total === 0) {
        const recyclerMsg = document.getElementById('recyclerMsg');
        if (recyclerMsg) {
            recyclerMsg.innerHTML = '⚠️ No waste inventory to collect. Wait for collector pickups.';
            recyclerMsg.className = 'status-message show error';
            setTimeout(() => {
                recyclerMsg.className = 'status-message';
            }, 3000);
        }
        return;
    }
    
    // Record what was collected
    const collected = {
        plastic: wasteInventory.plastic,
        paper: wasteInventory.paper,
        metal: wasteInventory.metal,
        organic: wasteInventory.organic,
        date: new Date().toLocaleString()
    };
    
    // Reset inventory
    wasteInventory = {
        plastic: 0,
        paper: 0,
        metal: 0,
        organic: 0
    };
    
    renderInventory();
    
    const recyclerMsg = document.getElementById('recyclerMsg');
    if (recyclerMsg) {
        recyclerMsg.innerHTML = `✓ Bulk pickup scheduled! ${collected.plastic.toFixed(1)}kg plastic, ${collected.paper.toFixed(1)}kg paper, ${collected.metal.toFixed(1)}kg metal, ${collected.organic.toFixed(1)}kg organic sent to recycling facility.`;
        recyclerMsg.className = 'status-message show success';
        setTimeout(() => {
            recyclerMsg.className = 'status-message';
        }, 5000);
    }
    
    updateAnalytics();
}

// ============ SIMULATE BIN FILL ============
function simulateFill() {
    fillLevel = Math.min(100, fillLevel + 20);
    const fillLevelSpan = document.getElementById('fillLevel');
    const fillProgressFill = document.getElementById('fillProgressFill');
    
    if (fillLevelSpan) fillLevelSpan.innerHTML = fillLevel;
    if (fillProgressFill) fillProgressFill.style.width = fillLevel + '%';
    
    if (fillLevel >= 85) {
        showMessage('pickupStatus', '⚠️ Bin is almost full! Consider requesting a pickup soon.', 'error');
    } else if (fillLevel >= 60) {
        addToHouseholdHistory(`Bin fill level at ${fillLevel}% - pickup recommended soon`, 'alert');
    }
}

// ============ RENDER FUNCTIONS ============
function renderHouseholdRequests() {
    const container = document.getElementById('householdRequestsList');
    if (!container) return;
    
    if (householdRequests.length === 0) {
        container.innerHTML = '<div class="empty-state">No requests yet</div>';
        return;
    }
    
    container.innerHTML = householdRequests.map(req => {
        if (req.isNotification) {
            return `
                <div class="history-item">
                    <div><i class="fas fa-bell"></i> ${req.action}</div>
                    <div style="font-size: 0.7rem; color: #6b7b6b; margin-top: 4px;">${req.dateStr}</div>
                </div>
            `;
        }
        return `
            <div class="history-item">
                <div><strong>${req.wasteType ? req.wasteType.charAt(0).toUpperCase() + req.wasteType.slice(1) : 'Waste'}</strong> - ${req.location}</div>
                <div style="font-size: 0.7rem; color: #6b7b6b; margin-top: 4px;">
                    ${req.dateStr || new Date(req.timestamp).toLocaleString()}
                    ${req.status === 'completed' ? '<span style="color: #4caf50;"> ✓ Completed</span>' : '<span style="color: #ff9800;"> ⏳ Pending</span>'}
                </div>
            </div>
        `;
    }).join('');
}

function renderPendingRequests() {
    const container = document.getElementById('pendingRequestsList');
    if (!container) return;
    
    const pending = pickupRequests.filter(r => r.status === 'pending');
    
    if (pending.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i> No pending requests. Great work!</div>';
        return;
    }
    
    container.innerHTML = pending.map(req => `
        <div class="request-item">
            <div class="request-info">
                <div class="request-location"><i class="fas fa-map-marker-alt"></i> ${req.location}</div>
                <div class="request-type"><i class="fas fa-trash"></i> ${req.wasteType.charAt(0).toUpperCase() + req.wasteType.slice(1)}</div>
                <div style="font-size: 0.7rem; color: #6b7b6b;">Requested: ${req.dateStr || new Date(req.timestamp).toLocaleTimeString()}</div>
            </div>
            <button class="confirm-btn" onclick="confirmPickup(${req.id})">
                <i class="fas fa-check"></i> Confirm
            </button>
        </div>
    `).join('');
}

function renderCompletedLog() {
    const container = document.getElementById('completedLog');
    if (!container) return;
    
    if (completedPickups.length === 0) {
        container.innerHTML = '<div class="empty-state">No completed pickups yet</div>';
        return;
    }
    
    container.innerHTML = completedPickups.slice(0, 10).map(req => `
        <li class="completed-item">
            <i class="fas fa-check-circle" style="color: #4caf50;"></i>
            <strong>${req.wasteType.charAt(0).toUpperCase() + req.wasteType.slice(1)}</strong> from ${req.location}
            <div style="font-size: 0.7rem; color: #6b7b6b;">${req.completedAt || 'Just now'}</div>
        </li>
    `).join('');
}

function renderInventory() {
    const container = document.getElementById('wasteInventory');
    if (!container) return;
    
    const items = [
        { type: 'plastic', icon: 'fas fa-plastic', color: '#2196f3', name: 'Plastic' },
        { type: 'paper', icon: 'fas fa-file-alt', color: '#ff9800', name: 'Paper' },
        { type: 'metal', icon: 'fas fa-cog', color: '#9e9e9e', name: 'Metal' },
        { type: 'organic', icon: 'fas fa-seedling', color: '#4caf50', name: 'Organic' }
    ];
    
    container.innerHTML = items.map(item => `
        <div class="inventory-item">
            <i class="${item.icon}" style="color: ${item.color}"></i>
            <span>${wasteInventory[item.type].toFixed(1)} kg</span>
            <small>${item.name}</small>
        </div>
    `).join('');
}

function updateAnalytics() {
    // Calculate totals
    let plasticTotal = 0, paperTotal = 0, metalTotal = 0, organicTotal = 0;
    
    completedPickups.forEach(pickup => {
        switch(pickup.wasteType) {
            case 'plastic': plasticTotal += wasteWeights.plastic; break;
            case 'paper': paperTotal += wasteWeights.paper; break;
            case 'metal': metalTotal += wasteWeights.metal; break;
            case 'organic': organicTotal += wasteWeights.organic; break;
        }
    });
    
    const totalWaste = plasticTotal + paperTotal + metalTotal + organicTotal;
    const recyclableWaste = plasticTotal + paperTotal + metalTotal;
    const recyclingRate = totalWaste > 0 ? ((recyclableWaste / totalWaste) * 100).toFixed(1) : 0;
    
    // Update stats display
    const statsContainer = document.getElementById('totalWasteStats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item"><span>♻️ Plastic</span><span class="stat-value">${plasticTotal.toFixed(1)} kg</span></div>
            <div class="stat-item"><span>📄 Paper</span><span class="stat-value">${paperTotal.toFixed(1)} kg</span></div>
            <div class="stat-item"><span>🥫 Metal</span><span class="stat-value">${metalTotal.toFixed(1)} kg</span></div>
            <div class="stat-item"><span>🍂 Organic</span><span class="stat-value">${organicTotal.toFixed(1)} kg</span></div>
            <div class="stat-item" style="border-top: 1px solid #e0e8e0; margin-top: 8px; padding-top: 8px;"><strong>Total</strong><strong>${totalWaste.toFixed(1)} kg</strong></div>
        `;
    }
    
    const recyclingRateSpan = document.getElementById('recyclingRate');
    if (recyclingRateSpan) recyclingRateSpan.innerHTML = recyclingRate + '%';
    
    const completedSpan = document.getElementById('totalPickupsCompleted');
    if (completedSpan) completedSpan.innerHTML = completedPickups.length;
}

function updateAllDisplays() {
    renderHouseholdRequests();
    renderPendingRequests();
    renderCompletedLog();
    renderInventory();
    updateAnalytics();
}

// ============ HELPER FUNCTIONS ============
function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = message;
        element.className = `status-message show ${type}`;
        setTimeout(() => {
            element.className = 'status-message';
        }, 4000);
    }
}

function addToHouseholdHistory(action, type) {
    // This adds system notifications to household history
    const notification = {
        id: Date.now(),
        wasteType: null,
        location: null,
        status: type,
        dateStr: new Date().toLocaleString(),
        isNotification: true,
        action: action
    };
    householdRequests.unshift(notification);
    renderHouseholdRequests();
}

function showCollectorNotification(message) {
    // Simulate push notification for collector
    console.log('Notification:', message);
    // Could show a toast in future enhancement
}

function addSampleData() {
    // Add some sample completed pickups for demo
    const samplePickups = [
        { id: 101, location: "Westlands, Nairobi", wasteType: "plastic", status: "completed", timestamp: new Date(Date.now() - 3600000), completedAt: new Date(Date.now() - 3500000).toLocaleString() },
        { id: 102, location: "Kilimani, Nairobi", wasteType: "paper", status: "completed", timestamp: new Date(Date.now() - 7200000), completedAt: new Date(Date.now() - 7100000).toLocaleString() },
        { id: 103, location: "CBD, Moi Avenue", wasteType: "metal", status: "completed", timestamp: new Date(Date.now() - 10800000), completedAt: new Date(Date.now() - 10700000).toLocaleString() }
    ];
    
    samplePickups.forEach(pickup => {
        completedPickups.push(pickup);
        wasteInventory[pickup.wasteType] += wasteWeights[pickup.wasteType];
        householdRequests.push(pickup);
    });
    
    // Add a sample pending request
    pickupRequests.push({
        id: 104,
        location: "Karen, Nairobi",
        wasteType: "organic",
        status: "pending",
        timestamp: new Date(),
        dateStr: new Date().toLocaleString()
    });
    
    householdRequests.unshift({
        id: 104,
        location: "Karen, Nairobi",
        wasteType: "organic",
        status: "pending",
        timestamp: new Date(),
        dateStr: new Date().toLocaleString()
    });
    
    // Update displays
    updateAllDisplays();
}

// Make confirmPickup available globally for onclick
window.confirmPickup = confirmPickup;