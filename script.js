// =========================================================================
// GOOGLE SHEETS LIVE INVENTORY FEeD PIPELINE (PART 1)
// =========================================================================

// Your live deployed Google script micro-service database feed anchor link
const GOOGLE_INVENTORY_FEED_URL = "https://script.google.com/macros/s/AKfycbwtDT1vwn9bql-1bnnou-ACaYvUCwQb5tzPp_mT3rzmNVSCM6FpKIrHVAiS0a1KudS0/exec";

// --- 1. FIXED POPUP MODAL & CART DRAWER CONTROLLERS ---
const modalBox = document.getElementById("quoteModal");
const closeModalTrigger = document.querySelector(".close-btn");
const contactForm = document.getElementById("quoteForm");

// FIXED: Global close button hook for the Shopping Cart side panel drawer
const drawerPanel = document.getElementById("fleetCartDrawer");
const closeCartBtn = document.getElementById("closeCartBtn");

if (closeCartBtn) {
    closeCartBtn.addEventListener("click", () => {
        if (drawerPanel) drawerPanel.style.right = "-360px";
    });
}

if (closeModalTrigger) {
    closeModalTrigger.addEventListener("click", () => { if (modalBox) modalBox.style.display = "none"; });
}
window.addEventListener("click", (e) => {
    if (e.target === modalBox) { if (modalBox) modalBox.style.display = "none"; }
});


if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputName = document.getElementById("name") ? document.getElementById("name").value : "Client";
        alert(`Thank you, ${inputName}! Your fleet requirements have been logged. The TARC engineering dispatch team will check spreadsheet stock thresholds and contact you shortly.`);
        contactForm.reset();
        if (modalBox) modalBox.style.display = "none";
    });
}

// --- 2. LIVE NETWORK ASYNC STORAGE DATA LOADER ---
let globalSheetCatalog = []; // Central localized memory matrix array caching spreadsheet row cells

async function fetchGoogleInventoryFeed() {
    const feedGridContainer = document.getElementById("api-product-feed");
    if (!feedGridContainer) return;
    
    // Inject clean dynamic visual tracking text block while stream compiling data rows
    feedGridContainer.innerHTML = `<div style="grid-column: 1/-1; color: var(--primary-blue); font-weight: bold; font-size: 1.1rem; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> SYNCING WITH TARC LIVE SPREADSHEET INVENTORY...</div>`;
    
    try {
        const response = await fetch(GOOGLE_INVENTORY_FEED_URL);
        if (!response.ok) throw new Error("Spreadsheet network pipeline response unverified");
        
        // Cache rows fields securely into global runtime memory
        globalSheetCatalog = await response.json();
         // INSERT THIS CODE LINE DIRECTLY BENEATH IT TO RUN THE REPORT:
        runTarcImageLinkValidator(globalSheetCatalog);
        // Forward data fields straight to our compilation and layout engine
        buildLiveProductCards(globalSheetCatalog);
        initializeLiveSearchFilter();
        
    } catch (error) {
        console.error("Critical database fetch failure: ", error);
        feedGridContainer.innerHTML = `<div style="grid-column: 1/-1; color: #FF3333; font-weight: bold; text-align: center;"><i class="fa-solid fa-triangle-exclamation"></i> CRITICAL LINK ERROR: Could not sync with Google Sheet column arrays. Verify Web App permission states are set to Anyone.</div>`;
    }
}
// =========================================================================
// STANDARDIZED SHOPPING CART DRAWERS & CARD INJECTION ENGINE (PART 2)
// =========================================================================

let fleetCartDataArray = []; // Persistent active storage tracking cart cache

// --- 3. DYNAMIC INVENTORY CARD BUILDER LAYER ---
function buildLiveProductCards(itemsArray) {
    const feedGridContainer = document.getElementById("api-product-feed");
    if (!feedGridContainer) return;
    
    feedGridContainer.innerHTML = ""; 

    if (itemsArray.length === 0) {
        feedGridContainer.innerHTML = `<div style="grid-column: 1/-1; color: var(--steel-slate); font-weight: bold; text-align: center; padding: 40px 0;"><i class="fa-solid fa-folder-open"></i> NO MATCHING INVENTORY CHANNELS DETECTED.</div>`;
        return;
    }

    itemsArray.forEach((radioItem, index) => {
        const itemCard = document.createElement("div");
        itemCard.className = "card api-product-card";

        let productPriceDisplay = "Inquire for Quote";
        if (radioItem.price && !isNaN(radioItem.price) && Number(radioItem.price) > 0) {
            productPriceDisplay = `$${parseFloat(radioItem.price).toFixed(2)}`;
        } else if (radioItem.price) { productPriceDisplay = radioItem.price; }

        let featuresHTML = "";
        if (radioItem.features && Array.isArray(radioItem.features)) {
            featuresHTML = radioItem.features.map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('');
        }

        let computedProductImage = radioItem.image || "images/radio-placeholder.png";

                // FIXED: Checks for both lowercase and camelCase column headers from Google Sheet
        let specSheetButtonHTML = "";
        let rawSpecLink = radioItem.speclink || radioItem.specLink || "";
        
        if (rawSpecLink && rawSpecLink.trim() !== "") {
            specSheetButtonHTML = `
                <a href="${rawSpecLink.trim()}" target="_blank" class="btn-secondary" style="display:block; text-align:center; margin-top:8px; border-color:var(--primary-blue); color:var(--primary-blue); text-decoration:none; padding:8px; font-size:0.82rem; font-weight:bold; border-radius:4px;">
                    <i class="fa-solid fa-file-pdf"></i> Download Spec Sheet
                </a>`;
        }


        itemCard.innerHTML = `
            <div class="product-badge">${radioItem.brand || "Authorized Dealer"}</div>
            <div style="width:100%; height:150px; display:flex; align-items:center; justify-content:center; margin-bottom:15px; background:var(--white); border-radius:4px; overflow:hidden;">
                <img src="${computedProductImage}" alt="${radioItem.model || 'TARC Hardware'}" style="max-height:100%; max-width:100%; object-fit:contain; display:block;">
            </div>
            <h3 class="product-model">${radioItem.model || "Commercial Tier"}</h3>
            <span class="product-type-label">${radioItem.type || "Wireless Hardware"}</span>
            <div style="font-size:1.15rem; font-weight:800; color:var(--primary-blue); margin-bottom:12px;">${productPriceDisplay}</div>
            <p class="product-target"><strong>Target Deployments:</strong> ${radioItem.bestFor || "All Commercial Sectors"}</p>
            <ul class="product-spec-list">${featuresHTML}</ul>
            
            <!-- STABLE ACTIONS DECK -->
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: auto;">
                <button class="btn-primary direct-quote-btn" style="width:100%; padding: 10px; font-size: 0.88rem; font-weight: bold;">
                    Inquire for Pricing
                </button>
                <button class="btn-secondary add-to-fleet-btn" data-model="${radioItem.model}" data-brand="${radioItem.brand}" data-type="${radioItem.type}" style="width:100%; padding: 8px; font-size: 0.82rem; font-weight: bold; background: rgba(11, 94, 180, 0.04); border-color: var(--primary-blue); color: var(--primary-blue);">
                    <i class="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
                ${specSheetButtonHTML}
            </div>`;

        feedGridContainer.appendChild(itemCard);
    });

    bindActiveButtonInteractions();
}

// --- 4. CART SELECTION INTERACTIVE ENGINE CONTROLLERS ---
function bindActiveButtonInteractions() {
    // Form click hooks
    document.querySelectorAll(".direct-quote-btn").forEach(btn => {
        btn.addEventListener("click", (e) => { e.preventDefault(); if (modalBox) modalBox.style.display = "flex"; });
    });

    // Cart insertion hooks
    document.querySelectorAll(".add-to-fleet-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const pModel = btn.getAttribute("data-model");
            const pBrand = btn.getAttribute("data-brand");
            const pType = btn.getAttribute("data-type");
            
            const existingRow = fleetCartDataArray.find(item => item.model === pModel);
            if (existingRow) { existingRow.quantity += 1; } 
            else { fleetCartDataArray.push({ brand: pBrand, model: pModel, type: pType, quantity: 1 }); }
            
            recalculateCartDrawerUI();
            const drawerPanel = document.getElementById("fleetCartDrawer");
            if(drawerPanel) drawerPanel.style.right = "0px"; // Slides panel inside view frame
        });
    });
}

function setupStaticCartToggles() {
    const drawerPanel = document.getElementById("fleetCartDrawer");
    const toggleBtn = document.getElementById("cartToggleBtn");
    const closeBtn = document.getElementById("closeCartBtn");
    const checkoutBtn = document.getElementById("checkoutFleetBtn");
    const volumeLink = document.getElementById("cartVolumeLink");

    if (toggleBtn) toggleBtn.addEventListener("click", (e) => { e.preventDefault(); if(drawerPanel) drawerPanel.style.right = "0px"; });
    if (closeBtn) closeBtn.addEventListener("click", () => { if(drawerPanel) drawerPanel.style.right = "-360px"; });
    
    // Redirects both checkout and volume fallbacks seamlessly straight to contact module popup boxes
    const triggerCheckoutAction = (e) => {
        if(e) e.preventDefault();
        if(fleetCartDataArray.length === 0 && e.target.id === "checkoutFleetBtn") { alert("Your cart is currently empty."); return; }
        if(drawerPanel) drawerPanel.style.right = "-360px";
        if(modalBox) modalBox.style.display = "flex";
    };

    if (checkoutBtn) checkoutBtn.addEventListener("click", triggerCheckoutAction);
    if (volumeLink) volumeLink.addEventListener("click", triggerCheckoutAction);
}

function recalculateCartDrawerUI() {
    const containerBox = document.getElementById("cartItemsList");
    const countBadge = document.getElementById("cartCountBadge");
    if (!containerBox || !countBadge) return;

    containerBox.innerHTML = "";
    let totalItems = 0;

    fleetCartDataArray.forEach((item, index) => {
        totalItems += item.quantity;
        const row = document.createElement("div");
        row.className = "cart-row-item";
        row.innerHTML = `
            <div class="cart-row-title">${item.model}</div>
            <div class="cart-row-meta">${item.brand} | ${item.type}</div>
            <div class="cart-row-controls">
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="cart-qty-btn" onclick="alterQuantity(${index}, -1)">-</button>
                    <span style="font-weight:bold; font-size:0.9rem;">${item.quantity}</span>
                    <button class="cart-qty-btn" onclick="alterQuantity(${index}, 1)">+</button>
                </div>
                <span class="cart-remove-trash" onclick="removeCartItem(${index})"><i class="fa-solid fa-trash-can"></i> Remove</span>
            </div>`;
        containerBox.appendChild(row);
    });

    if (totalItems > 0) { countBadge.innerText = totalItems; countBadge.style.display = "block"; } 
    else { countBadge.style.display = "none"; containerBox.innerHTML = `<div style="color:#4A5A6A; font-size:0.82rem; text-align:center; margin-top:5px; font-style:italic;">Your shopping cart is currently empty.</div>`; }
}

window.alterQuantity = function(index, delta) {
    fleetCartDataArray[index].quantity += delta;
    if (fleetCartDataArray[index].quantity <= 0) { fleetCartDataArray.splice(index, 1); }
    recalculateCartDrawerUI();
};

window.removeCartItem = function(index) {
    fleetCartDataArray.splice(index, 1);
    recalculateCartDrawerUI();
};

// --- 5. SEARCH FILTER LAYER ---
function initializeLiveSearchFilter() {
    const searchField = document.getElementById("catalogSearch");
    if (!searchField) return;

    searchField.addEventListener("input", (e) => {
        const queryTerm = e.target.value.toLowerCase().trim();
        const filtered = globalSheetCatalog.filter(item => {
            return (item.brand || "").toLowerCase().includes(queryTerm) || 
                   (item.model || "").toLowerCase().includes(queryTerm) || 
                   (item.type || "").toLowerCase().includes(queryTerm) || 
                   (item.bestFor || "").toLowerCase().includes(queryTerm);
        });
        buildLiveProductCards(filtered);
    });
}

function filterAccessory(categoryLabel) {
    const searchField = document.getElementById("catalogSearch");
    if (!searchField) return;
    searchField.value = categoryLabel === 'All' ? "" : categoryLabel;
    searchField.dispatchEvent(new Event('input'));
}

// =========================================================================
// CROSS-PAGE INTERCEPT INTERACTIVE HARDWARE FILTER (HOMEPAGE CORE EXtension)
// =========================================================================

// Enhanced central document compiler listener thread managing page loads
document.addEventListener("DOMContentLoaded", async () => {
    // 1. First, wait cleanly for your live Google Sheet database columns payload to download completely
    await fetchGoogleInventoryFeed();

    // 2. Scan the browser's hidden persistent memory tracking box for cross-page query redirects
    const crossPageSearchToken = localStorage.getItem("tarcAutoSearchQuery");
    
    if (crossPageSearchToken && crossPageSearchToken.trim() !== "") {
        const homepageSearchInputField = document.getElementById("catalogSearch");
        
        if (homepageSearchInputField) {
            // Programmatically inject the saved industry filter keyword directly into the visible input layout box
            homepageSearchInputField.value = crossPageSearchToken.trim();
            
            // Programmatically fire a simulated input event to force the catalog grid to recalculate cards instantly
            homepageSearchInputField.dispatchEvent(new Event('input'));
            
            console.log(`TARC SECURITY SIGNAL: Successfully intercepted cross-page routing context. Catalog auto-filtered for: '${crossPageSearchToken}'`);
            
            // Smoothly auto-scroll the client's display screen directly down to the catalog grid rows layout
            setTimeout(() => {
                const catalogSectionLayoutNode = document.getElementById("catalog");
                if (catalogSectionLayoutNode) {
                    catalogSectionLayoutNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 600); // 600ms cushion ensures images parse safely before scrolling position computes
        }
        
        // CRITICAL CONTEXT CLEANUP: Wipe memory block clean so future page refreshes start standard and fresh
        localStorage.removeItem("tarcAutoSearchQuery");
    }
});
// =========================================================================
// TARC PRODUCTION IMAGE LINK VALIDATOR & RECONNAISSANCE ENGINE
// =========================================================================
function runTarcImageLinkValidator(catalogItems) {
    console.log("%c📡 TARC IMAGE VALIDATOR ACTIVATED. SCANNING PIPELINES...", "color: #00FFFF; font-weight: bold; font-size: 1.1rem;");
    
    if (!catalogItems || catalogItems.length === 0) {
        console.error("❌ VALIDATOR CRITICAL: Database payload is empty or unreadable.");
        return;
    }

    // Capture the exact location parameters of your active web browser window
    const currentHost = window.location.hostname;
    const currentPath = window.location.pathname;
    
    catalogItems.forEach((item, index) => {
        const rowNum = index + 2; // Rows start at 2 because row 1 holds headers
        const modelLabel = item.model || `Row ${rowNum}`;
        const rawPath = item.image ? item.image.trim() : "";
        
        console.log(`%cChecking Row ${rowNum} [${modelLabel}]...`, "color: #cbd5e1;");

        // DIAGNOSTIC CHECK 1: Missing or Blank Cell
        if (rawPath === "") {
            console.error(`  ↳ ❌ ERROR (Row ${rowNum}): The image cell is completely blank inside your spreadsheet.`);
            return;
        }

        // DIAGNOSTIC CHECK 2: Absolute vs Relative Link Matrix
        if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
            console.log(`  ↳ %c✓ VALID ONLINE LINK: Pulling down asset from absolute web cloud URL structure.`, "color: #00FF66;");
            return;
        }

        // DIAGNOSTIC CHECK 3: Dot-Slash Prefix Warning Sliders
        if (rawPath.startsWith(".") || rawPath.startsWith("/")) {
            console.error(`  ↳ ❌ CRITICAL TRAFFIC ERROR (Row ${rowNum}): Your path contains dots or leading slashes ('${rawPath}'). GitHub Pages strictly requires starting directly with the folder name (e.g., 'Kenwood/images/...').`);
            return;
        }

        // DIAGNOSTIC CHECK 4: Backslash Collision Warning
        if (rawPath.includes("\\")) {
            console.error(`  ↳ ❌ ERROR (Row ${rowNum}): Your path uses Windows backslashes ('\\'). Web servers require standard web forward slashes ('/').`);
            return;
        }

        // DIAGNOSTIC CHECK 5: Compute the Computed Deployment Target URL Route
        let targetRepoFolder = "/";
        if (currentHost.includes("github.io")) {
            // Extracts your exact repository folder name out of the active URL string path
            const pathSegments = currentPath.split('/').filter(s => s.trim() !== "");
            if (pathSegments.length > 0) {
                targetRepoFolder = `/${pathSegments[0]}/`;
            }
        }

        const calculatedAbsoluteUrl = `${window.location.origin}${targetRepoFolder}${rawPath}`;
        
        // DIAGNOSTIC CHECK 6: Live Network Ping Request Check
        fetch(calculatedAbsoluteUrl, { method: 'HEAD' })
            .then(res => {
                if (res.ok) {
                    console.log(`  ↳ %c✓ LIVE SERVER VERIFIED: GitHub located the folder asset at -> ${calculatedAbsoluteUrl}`, "color: #00FF66;");
                } else if (res.status === 404) {
                    console.error(`  ↳ ❌ SERVER 404 MISMATCH (Row ${rowNum}): GitHub cannot locate this file. Either:\n     1. You didn't drag/upload the '${rawPath.split('/')[0]}' folder into your online GitHub repository browser tab.\n     2. Case-Sensitivity Clash: Your cell spells it '${rawPath}' but your physical file or folder names use capital/lowercase letters that don't match identically.`);
                }
            })
            .catch(err => {
                console.error(`  ↳ ⚠️ NETWORK INTERCEPT COLLISION: Unable to ping asset route safely.`, err);
            });
    });
}

