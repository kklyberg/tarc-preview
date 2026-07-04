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
// =========================================================================
// TARC SAFE MULTI-VARIABLE INTERCONNECTED FILTER INTERCEPT ENGINE (STEP 3)
// =========================================================================

// Independent memory registers to prevent data stream collision crashes
let safeActiveBrand = "All";
let safeActiveCategory = "All";

// --- HOOK A: ACTIVATE THE NEW BRAND PILL SELECTIONS ---
function selectBrandFilter(chosenBrand) {
    safeActiveBrand = chosenBrand;
    console.log(`TARC STEP 3: Brand parameter locked onto -> [${safeActiveBrand}]`);
    
    // Recalculate visual active highlights for manufacturer buttons safely
    const brandButtons = document.querySelectorAll(".brand-pill");
    brandButtons.forEach(btn => {
        if (btn.id === `btn-brand-${chosenBrand.toLowerCase()}`) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Execute the master dataset compiler loop
    executeSafeMultiFilter();
}

// --- HOOK B: SAFE BRIDGING INTERCEPT FOR ORIGINAL FILTER PILLS ---
// This safely intercepts your existing 'filterAccessory' click strings without replacing the original code
const originalFilterAccessory = window.filterAccessory;
window.filterAccessory = function(chosenCategory) {
    safeActiveCategory = chosenCategory;
    console.log(`TARC STEP 3: Category parameter locked onto -> [${safeActiveCategory}]`);
    
    // If the original core function remains globally bound, execute it alongside our tracker
    if (typeof originalFilterAccessory === "function") {
        // Run our master interconnected filter matrix instead to handle both states together
        executeSafeMultiFilter();
    } else {
        executeSafeMultiFilter();
    }
};

// --- HOOK C: THE UNIFIED DUAL-AXES CONNECTED MATRIX COMPILER ---
function executeSafeMultiFilter() {
    // If your working, reverted catalog arrays are not loaded yet, exit safely to prevent page freezes
    if (!globalSheetCatalog || globalSheetCatalog.length === 0) return;

    const siftedResultsMatrix = globalSheetCatalog.filter(radioItem => {
        const itemBrand = (radioItem.brand || "").toString().trim().toLowerCase();
        const itemType = (radioItem.type || "").toString().trim().toLowerCase();
        
        const targetBrand = safeActiveBrand.toLowerCase();
        const targetCategory = safeActiveCategory.toLowerCase();

        // 1. Evaluate Brand Criterion
        const passesBrandTest = (targetBrand === "all" || itemBrand.includes(targetBrand));

        // 2. Evaluate Category Criterion (Using loose fuzzy clipping to bypass spreadsheet plural typos)
        let passesCategoryTest = false;
        if (targetCategory === "all" || targetCategory === "all systems" || targetCategory === "all hardware") {
            passesCategoryTest = true;
        } else {
            const truncatedKeyword = targetCategory.substring(0, 4);
            passesCategoryTest = itemType.includes(truncatedKeyword);
        }

        return passesBrandTest && passesCategoryTest;
    });

    // Pipe the results safely back straight into your working, original card painter loop!
    if (typeof buildLiveProductCards === "function") {
        buildLiveProductCards(siftedResultsMatrix);
    }
}
// =========================================================================
// HIGH-SECURITY CART COMPILER & STATE MANAGEMENT LOGIC (PART 2 OF 2)
// =========================================================================

// --- LAYER G: SAFELY BIND "ADD TO CART" ACTIONS ON ITEM CARDS ---
// Paste this inside your card painter loop or append to activate handlers
function bindCartActionsForFleet() {
    const addToCartButtons = document.querySelectorAll(".add-to-fleet-btn");
    addToCartButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const modelToken = e.target.getAttribute("data-model");
            const brandToken = e.target.getAttribute("data-brand") || "Authorized Brand";
            const typeToken = e.target.getAttribute("data-type") || "Hardware";
            
            // Locate the original database record matching this specific model item
            const matchingItem = globalSheetCatalog.find(item => item.model === modelToken);
            if (!matchingItem) return;

            // Check if item is already stacked inside the local cart data array
            const structuralCartMatch = corporateFleetCart.find(cartItem => cartItem.model === modelToken);
            if (structuralCartMatch) {
                structuralCartMatch.qty += 1;
            } else {
                corporateFleetCart.push({
                    brand: brandToken,
                    model: modelToken,
                    type: typeToken,
                    price: parseFloat(matchingItem.price) || 0,
                    image: matchingItem.image || "images/radio-placeholder.png",
                    qty: 1
                });
            }

            console.log(`TARC CART MATRIX: Added ${modelToken}. Total stacked layers: ${corporateFleetCart.length}`);
            refreshSecureCartSummaryConsole();
        });
    });
}

// --- LAYER H: RE-CALCULATE AND RENDER HIGH-SECURITY DRAWER LOGS ---
function refreshSecureCartSummaryConsole() {
    const listFeedContainer = document.getElementById("cartItemsList");
    const countBadgeNode = document.getElementById("cartCountBadge");
    const totalUnitsNode = document.getElementById("cartTotalItemsCount");
    const estimatedValueNode = document.getElementById("cartEstimatedTotalValue");

    if (!listFeedContainer) return;
    listFeedContainer.innerHTML = "";

    let totalUniqueItemRowsCount = 0;
    let combinedFinancialEstimateSum = 0;

    if (corporateFleetCart.length === 0) {
        listFeedContainer.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; flex:1; color:#5a6e72; padding:40px 0; text-align:center; font-size:0.85rem; font-weight:600;">
                <i class="fa-solid fa-basket-shopping" style="font-size:2rem; color:#cbd5e1; margin-bottom:12px;"></i>
                <span>Your fleet request manifest is empty. Add mission-critical hardware to proceed.</span>
            </div>`;
        
        if (countBadgeNode) countBadgeNode.style.display = "none";
        if (totalUnitsNode) totalUnitsNode.innerText = "0 Units";
        if (estimatedValueNode) estimatedValueNode.innerText = "$0.00";
        return;
    }

    // Process loop generating tactical high-contrast manifest columns entries
    corporateFleetCart.forEach((cartProduct, index) => {
        totalUniqueItemRowsCount += cartProduct.qty;
        combinedFinancialEstimateSum += (cartProduct.price * cartProduct.qty);

        const rowPriceSum = cartProduct.price * cartProduct.qty;
        const formattedPriceString = cartProduct.price > 0 ? `$${rowPriceSum.toFixed(2)}` : "Inquire / Quote";

        const cartItemCard = document.createElement("div");
        cartItemCard.style.cssText = "background:#ffffff; border:1px solid #e2e8f0; border-left:3px solid #0b5eb4; border-radius:4px; padding:12px; display:flex; gap:12px; align-items:center; position:relative; box-shadow:0 2px 6px rgba(0,0,0,0.02); box-sizing:border-box;";

        cartItemCard.innerHTML = `
            <div style="width:50px; height:50px; display:flex; align-items:center; justify-content:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; overflow:hidden; flex-shrink:0;">
                <img src="${cartProduct.image}" alt="${cartProduct.model}" style="max-height:90%; max-width:90%; object-fit:contain;">
            </div>
            
            <div style="display:flex; flex-direction:column; gap:2px; flex:1; text-align:left; overflow:hidden;">
                <span style="color:#0b5eb4; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.5px;">${cartProduct.brand} // ${cartProduct.type}</span>
                <h4 style="color:#0e1a24; font-size:0.9rem; font-weight:800; margin:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${cartProduct.model}</h4>
                <div style="color:#00b3b3; font-size:0.85rem; font-weight:800; margin-top:2px;">${formattedPriceString}</div>
            </div>
            
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; flex-shrink:0;">
                <div style="display:flex; align-items:center; border:1px solid #cbd5e1; border-radius:4px; overflow:hidden; background:#f8fafc; height:24px;">
                    <button onclick="modifyFleetItemQty(${index}, -1)" style="border:none; background:none; width:20px; height:100%; cursor:pointer; font-weight:900; font-size:0.75rem; color:#475569;">-</button>
                    <span style="font-size:0.82rem; font-weight:800; color:#0e1a24; width:24px; text-align:center; display:inline-block;">${cartProduct.qty}</span>
                    <button onclick="modifyFleetItemQty(${index}, 1)" style="border:none; background:none; width:20px; height:100%; cursor:pointer; font-weight:900; font-size:0.75rem; color:#475569;">+</button>
                </div>
                <span onclick="modifyFleetItemQty(${index}, -99)" style="color:#ef4444; font-size:0.65rem; font-weight:700; cursor:pointer; text-transform:uppercase; letter-spacing:0.3px;"><i class="fa-solid fa-trash-can"></i> Remove</span>
            </div>`;

        listFeedContainer.appendChild(cartItemCard);
    });

    // Update global navbar counting notification icons
    if (countBadgeNode) {
        countBadgeNode.innerText = totalUniqueItemRowsCount;
        countBadgeNode.style.display = totalUniqueItemRowsCount > 0 ? "block" : "none";
    }

    if (totalUnitsNode) totalUnitsNode.innerText = `${totalUniqueItemRowsCount} Unit${totalUniqueItemRowsCount !== 1 ? 's' : ''}`;
    if (estimatedValueNode) estimatedValueNode.innerText = combinedFinancialEstimateSum > 0 ? `$${combinedFinancialEstimateSum.toFixed(2)}` : "Price On Request";
}

// --- LAYER I: QUANTITY MODIFIERS AND ROW REMOVAL CHECKS ---
window.modifyFleetItemQty = function(itemIndex, quantityAdjustmentDelta) {
    if (!corporateFleetCart[itemIndex]) return;

    if (quantityAdjustmentDelta === -99) {
        corporateFleetCart.splice(itemIndex, 1);
    } else {
        corporateFleetCart[itemIndex].qty += quantityAdjustmentDelta;
        if (corporateFleetCart[itemIndex].qty <= 0) {
            corporateFleetCart.splice(itemIndex, 1);
        }
    }

    refreshSecureCartSummaryConsole();
};

// Make sure to add this call line inside your main buildLiveProductCards() function string,
// immediately right after your cards append loops finish execution:
// bindCartActionsForFleet();
