const productHeadersBase = [
  "Product ID",
  "Product Name",
  "Description",
  "Default Price",
  "Brand",
  "Category",
  "SKU",
  "Default Cost Price",
  "Ask For Quantity",
  "Default Quantity",
  "Quantity Units",
  "Ask For Price",
  "VAT Enabled",
  "Variant Price",
  "Variant Enabled",
  "Attribute 1",
  "Value 1",
  "Attribute 2",
  "Value 2",
  "Attribute 3",
  "Value 3",
  "Image URL",
  "Barcode",
  "Track Stock",
  "Modifier Group",
];

const inventoryHeadersBase = [
  "Item_Name",
  "SKU",
  "Item_Type",
  "Category",
  "Base_UOM",
  "Cost_Ex_VAT",
  "VAT_Enabled",
  "Barcode",
  "Yield_Percentage",
  "Batch_Yield",
  "Opening_Stock",
  "Low_Stock_Threshold",
  "Par_Level",
  "Notes",
  "UOM_1_Name",
  "UOM_1_Qty_In_Base",
  "UOM_1_Barcode",
  "UOM_2_Name",
  "UOM_2_Qty_In_Base",
  "UOM_2_Barcode",
  "UOM_3_Name",
  "UOM_3_Qty_In_Base",
  "UOM_3_Barcode",
];

const modifierHeaders = ["Modifier Group Name", "Type", "Option Name", "UOM", "Quantity"];

const productPreviewHeaders = [
  "Product PLU",
  "Product Name",
  "UOM",
  "Menu Category",
  "Product SKU",
  "Inventory Type",
  "Selling Price",
  "Cost Price",
  "Site Name",
  "Modifier Group",
];

function buildInventoryPreviewHeaders(maxUomCount) {
  const uomHeaders = [];

  for (let index = 1; index <= maxUomCount; index += 1) {
    uomHeaders.push(`Custom UOM ${index}`, `Unit Size ${index}`);
  }

  return [
    "Product PLU",
    "Inventory Item Name",
    ...uomHeaders,
    "UOM",
    "Menu Category",
    "Product SKU",
    "Inventory Type",
    "Batch Qty",
    "Selling Price",
    "Cost Price",
  ];
}

const recipeHeaders = [
  "Master Product PLU",
  "Product Type",
  "Master Product Name",
  "Recipe Product PLU",
  "Recipe Product Name",
  "Unit of Measure",
  "Quantity",
];

const recipeExportHeaders = ["Product Name", "Ingredient Name", "UOM", "Quantity Needed"];

const productsFile = document.querySelector("#products-file");
const siteSettingsFile = document.querySelector("#site-settings-file");
const modifiersFile = document.querySelector("#modifiers-file");
const uomFile = document.querySelector("#uom-file");
const recipeFile = document.querySelector("#recipe-file");
const productsFileName = document.querySelector("#products-file-name");
const siteSettingsFileName = document.querySelector("#site-settings-file-name");
const modifiersFileName = document.querySelector("#modifiers-file-name");
const uomFileName = document.querySelector("#uom-file-name");
const recipeFileName = document.querySelector("#recipe-file-name");
const clearAllButton = document.querySelector("#clear-all");
const themeToggleButton = document.querySelector("#theme-toggle");
const statusText = document.querySelector("#status-text");
const convertButton = document.querySelector("#convert-button");
const downloadInventoryButton = document.querySelector("#download-inventory-button");
const downloadRecipeButton = document.querySelector("#download-recipe-button");
const downloadYocoExportButton = document.querySelector("#download-yoco-export-button");
const productsPreviewHead = document.querySelector("#products-preview-table thead");
const productsPreviewBody = document.querySelector("#products-preview-table tbody");
const inventoryPreviewHead = document.querySelector("#inventory-preview-table thead");
const inventoryPreviewBody = document.querySelector("#inventory-preview-table tbody");
const modifiersPreviewHead = document.querySelector("#modifiers-preview-table thead");
const modifiersPreviewBody = document.querySelector("#modifiers-preview-table tbody");
const recipePreviewHead = document.querySelector("#recipe-preview-table thead");
const recipePreviewBody = document.querySelector("#recipe-preview-table tbody");
const previewDescription = document.querySelector("#preview-description");
const showProductsButton = document.querySelector("#show-products-button");
const showInventoryButton = document.querySelector("#show-inventory-button");
const showModifiersButton = document.querySelector("#show-modifiers-button");
const showRecipeButton = document.querySelector("#show-recipe-button");
const productsPreview = document.querySelector("#products-preview");
const inventoryPreview = document.querySelector("#inventory-preview");
const modifiersPreview = document.querySelector("#modifiers-preview");
const recipePreview = document.querySelector("#recipe-preview");
const loadSampleButton = document.querySelector("#load-sample");
const rowsPerPageSelect = document.querySelector("#rows-per-page");
const prevPageButton = document.querySelector("#prev-page-button");
const nextPageButton = document.querySelector("#next-page-button");
const paginationIndicator = document.querySelector("#pagination-indicator");

let productRows = [];
let siteRows = [];
let modifierRows = [];
let uomRows = [];
let recipeRows = [];
let convertedProducts = [];
let productPreviewRows = [];
let convertedInventoryItems = [];
let inventoryPreviewRows = [];
let convertedModifiers = [];
let convertedRecipes = [];
let convertedRecipeExport = [];
let productOutputHeaders = [...productHeadersBase];
let inventoryOutputHeaders = [...inventoryHeadersBase];
let inventoryPreviewHeaders = buildInventoryPreviewHeaders(0);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

const PERSIST_STORAGE_KEY = "yoco-converter-uploads-v1";

function loadPersistedUploads() {
  try {
    const raw = localStorage.getItem(PERSIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function savePersistedFile(key, name, rows) {
  const state = loadPersistedUploads();
  state[key] = { name, rows };
  try {
    localStorage.setItem(PERSIST_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Ignore storage quota errors; the in-memory data still works for this session.
  }
}

function clearPersistedUploads() {
  try {
    localStorage.removeItem(PERSIST_STORAGE_KEY);
  } catch (error) {
    // Ignore.
  }
}

function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const cell = String(value ?? "");
          return /[",\n\r]/.test(cell) ? `"${cell.replaceAll('"', '""')}"` : cell;
        })
        .join(","),
    )
    .join("\n");
}

function normaliseHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ");
}

function normalisePlu(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normaliseInventoryType(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function rowsToObjects(rows) {
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => String(header || "").trim());
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

function getField(row, aliases) {
  const wanted = aliases.map(normaliseHeader);
  const matchingKey = Object.keys(row).find((key) => wanted.includes(normaliseHeader(key)));
  return matchingKey ? row[matchingKey] : "";
}

function rowHasHeaders(row, requiredHeaders) {
  const normalisedRow = row.map(normaliseHeader);
  return requiredHeaders.every((header) => normalisedRow.includes(normaliseHeader(header)));
}

function pickWorksheetRows(workbook, requiredHeaders) {
  const sheetRows = workbook.SheetNames.map((sheetName) =>
    XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" }),
  );

  if (!requiredHeaders.length) return sheetRows[0] || [];

  return sheetRows.find((rows) => rows[0] && rowHasHeaders(rows[0], requiredHeaders)) || sheetRows[0] || [];
}

function readTableFile(file, onLoad, requiredHeaders = []) {
  if (!file) return;

  const isWorkbook = /\.(xlsx|xls)$/i.test(file.name);
  const reader = new FileReader();

  reader.addEventListener("load", () => {
    try {
      if (isWorkbook) {
        if (!window.XLSX) {
          throw new Error("XLSX support is still loading. Check your connection and try again.");
        }

        const workbook = XLSX.read(reader.result, { type: "array" });
        onLoad(pickWorksheetRows(workbook, requiredHeaders));
        return;
      }

      onLoad(parseCsv(reader.result));
    } catch (error) {
      setStatus(error.message || "Could not read that file.", true);
    }
  });

  if (isWorkbook) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function loadProductsRows(rows) {
  productRows = rowsToObjects(rows);
  resetConvertedData();

  if (!productRows.length) {
    setStatus("Products - Update needs a header row and at least one product row.", true);
    return;
  }

  const hasPlu = productRows.some((row) => getField(row, ["Product PLU"]));
  const hasName = productRows.some((row) => getField(row, ["Name", "Product Name"]));

  if (!hasPlu || !hasName) {
    setStatus("Products - Update must include Product PLU and Name columns.", true);
    return;
  }

  updateReadyStatus();
}

function loadSiteSettingsRows(rows) {
  siteRows = rowsToObjects(rows);
  resetConvertedData();

  if (!siteRows.length) {
    setStatus("Site Settings needs a header row and at least one site row.", true);
    return;
  }

  const hasPlu = siteRows.some((row) => getField(row, ["Product PLU"]));
  const hasSite = siteRows.some((row) => getField(row, ["Site", "Site Name"]));

  if (!hasPlu || !hasSite) {
    setStatus("Site Settings must include Product PLU and Site columns.", true);
    return;
  }

  updateReadyStatus();
}

function loadModifierRows(rows) {
  modifierRows = rowsToObjects(rows);
  resetConvertedData();

  if (!modifierRows.length) {
    setStatus("Modifier Items needs a header row and at least one modifier row.", true);
    return;
  }

  const hasModifierName = modifierRows.some((row) => getField(row, ["Modifier Name"]));
  const hasType = modifierRows.some((row) => getField(row, ["Type (Products / Options)", "Type"]));
  const hasOption = modifierRows.some((row) => getField(row, ["Modifier Option Name", "Option Name"]));

  if (!hasModifierName || !hasType || !hasOption) {
    setStatus("Modifier Items must include Modifier Name, Type, and Modifier Option Name columns.", true);
    return;
  }

  updateReadyStatus();
}

function loadUomRows(rows) {
  uomRows = rowsToObjects(rows);
  resetConvertedData();

  if (!uomRows.length) {
    setStatus("Custom UOMs needs a header row and at least one UOM row.", true);
    return;
  }

  const hasPlu = uomRows.some((row) => getField(row, ["Product PLU"]));
  const hasTitle = uomRows.some((row) => getField(row, ["UOM Title", "Custom UOM"]));
  const hasUnitSize = uomRows.some((row) => getField(row, ["Unit Size"]));
  const hasBaseUom = uomRows.some((row) => getField(row, ["Base UOM"]));

  if (!hasPlu || !hasTitle || !hasUnitSize || !hasBaseUom) {
    uomRows = [];
    setStatus("Custom UOMs must include Product PLU, UOM Title, Unit Size, and Base UOM columns.", true);
    return;
  }

  updateReadyStatus();
}

function loadRecipeRows(rows) {
  recipeRows = rowsToObjects(rows);

  if (!recipeRows.length) {
    setStatus("Recipe needs a header row and at least one recipe row.", true);
    return;
  }

  const hasMasterName = recipeRows.some((row) => getField(row, ["Master Product Name"]));
  const hasRecipeName = recipeRows.some((row) => getField(row, ["Recipe Product Name"]));
  const hasUom = recipeRows.some((row) => getField(row, ["Unit of Measure"]));
  const hasQuantity = recipeRows.some((row) => getField(row, ["Quantity"]));

  if (!hasMasterName || !hasRecipeName || !hasUom || !hasQuantity) {
    recipeRows = [];
    setStatus("Recipe must include Master Product Name, Recipe Product Name, Unit of Measure, and Quantity columns.", true);
    return;
  }

  convertedRecipes = convertRecipeRows();
  convertedRecipeExport = convertRecipeExportRows();
  paginationPages.recipe = 1;
  renderPreviewTable("recipe");
  downloadRecipeButton.disabled = convertedRecipes.length === 0;
  downloadYocoExportButton.disabled =
    convertedProducts.length === 0 &&
    convertedModifiers.length === 0 &&
    convertedInventoryItems.length === 0 &&
    convertedRecipeExport.length === 0;
  setStatus(`${recipeRows.length} recipe row${recipeRows.length === 1 ? "" : "s"} loaded.`);
}

function formatMasterProductName(value) {
  const raw = String(value || "").trim();
  const separatorIndex = raw.indexOf(" - ");
  if (separatorIndex < 0) return raw;

  const name = raw.slice(0, separatorIndex).trim();
  const variantList = raw.slice(separatorIndex + 3);

  const values = variantList
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const colonIndex = part.indexOf(":");
      return colonIndex < 0 ? part : part.slice(colonIndex + 1).trim();
    })
    .filter(Boolean);

  if (!values.length) return raw;

  return `${name} - ${values.join(" / ")}`;
}

function convertRecipeRows() {
  return recipeRows
    .filter((row) => getField(row, ["Master Product Name"]) && getField(row, ["Recipe Product Name"]))
    .map((row) => [
      getField(row, ["Master Product PLU"]),
      getField(row, ["Product Type"]),
      formatMasterProductName(getField(row, ["Master Product Name"])),
      getField(row, ["Recipe Product PLU"]),
      getField(row, ["Recipe Product Name"]),
      getField(row, ["Unit of Measure"]),
      String(getField(row, ["Quantity"]) || "").trim(),
    ]);
}

function convertRecipeExportRows() {
  return recipeRows
    .filter((row) => getField(row, ["Master Product Name"]) && getField(row, ["Recipe Product Name"]))
    .map((row) => [
      getField(row, ["Master Product Name"]),
      getField(row, ["Recipe Product Name"]),
      getField(row, ["Unit of Measure"]),
      String(getField(row, ["Quantity"]) || "").trim(),
    ]);
}

function buildUomsByPlu() {
  return uomRows.reduce((lookup, row) => {
    const plu = normalisePlu(getField(row, ["Product PLU"]));
    const title = getField(row, ["UOM Title", "Custom UOM"]);
    if (!plu || !title) return lookup;
    if (!lookup.has(plu)) lookup.set(plu, []);
    lookup.get(plu).push({
      title,
      unitSize: cleanNumber(getField(row, ["Unit Size"])),
      baseUom: getField(row, ["Base UOM"]),
    });
    return lookup;
  }, new Map());
}

function updateReadyStatus() {
  const hasProducts = productRows.length > 0;
  const hasSiteSettings = siteRows.length > 0;
  const hasModifiers = modifierRows.length > 0;
  const hasUoms = uomRows.length > 0;

  if (hasProducts && hasSiteSettings && hasModifiers) {
    setStatus(
      `${productRows.length} product row${productRows.length === 1 ? "" : "s"}, ${siteRows.length} site row${siteRows.length === 1 ? "" : "s"}, ${modifierRows.length} modifier row${modifierRows.length === 1 ? "" : "s"}${hasUoms ? `, and ${uomRows.length} UOM row${uomRows.length === 1 ? "" : "s"}` : ""} loaded.`,
    );
    return;
  }

  if (hasProducts || hasSiteSettings || hasModifiers) {
    const missing = [];
    if (!hasProducts) missing.push("Products - Update");
    if (!hasSiteSettings) missing.push("Site Settings");
    if (!hasModifiers) missing.push("Modifier Items");
    setStatus(`Add ${missing.join(" and ")} before converting.`, true);
    return;
  }

  setStatus("Waiting for Products - Update, Site Settings, and Modifier Items.");
}

function resetConvertedData() {
  convertedProducts = [];
  convertedInventoryItems = [];
  convertedModifiers = [];
  productPreviewRows = [];
  productOutputHeaders = [...productHeadersBase];
  inventoryOutputHeaders = [...inventoryHeadersBase];
  inventoryPreviewHeaders = buildInventoryPreviewHeaders(0);
  inventoryPreviewRows = [];
  paginationPages.products = 1;
  paginationPages.inventory = 1;
  paginationPages.modifiers = 1;
  renderPreviewTable("products");
  renderPreviewTable("inventory");
  renderPreviewTable("modifiers");
  downloadInventoryButton.disabled = true;
  downloadYocoExportButton.disabled = true;
}

function parseVariantAttributes(value) {
  return String(value || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex < 0) return { attribute: part, variant: "" };

      return {
        attribute: part.slice(0, separatorIndex).trim(),
        variant: part.slice(separatorIndex + 1).trim(),
      };
    });
}

function mapItemType(inventoryType, productType) {
  const type = normaliseInventoryType(inventoryType);
  const variant = normaliseInventoryType(productType);

  if (type === "rawmaterial" && variant === "preparation") return "Manufactured";
  if (type === "rawmaterial" && variant === "single") return "Standard";
  if (type === "rawmaterial" && variant === "composite") return "Sub-Recipe";
  if (type === "nonstockitem" && (variant === "composite" || variant === "single")) return "Non Stock";
  return "Standard";
}

function buildUomExportCells(uoms) {
  const cells = [];

  for (let index = 0; index < 3; index += 1) {
    cells.push(uoms[index]?.title || "", uoms[index]?.unitSize || "", "");
  }

  return cells;
}

function convertRows() {
  if (!productRows.length) {
    setStatus("Upload Products - Update before converting.", true);
    return;
  }

  if (!siteRows.length) {
    setStatus("Upload Site Settings for all sites before converting.", true);
    return;
  }

  if (!modifierRows.length) {
    setStatus("Upload Modifier Items before converting.", true);
    return;
  }

  const sitesByPlu = siteRows.reduce((lookup, row) => {
    const plu = normalisePlu(getField(row, ["Product PLU"]));
    if (!plu) return lookup;
    if (!lookup.has(plu)) lookup.set(plu, []);
    lookup.get(plu).push(row);
    return lookup;
  }, new Map());

  const preparedProducts = productRows
    .map((row) => {
      const plu = getField(row, ["Product PLU"]);
      return {
        row,
        plu,
        sites: sitesByPlu.get(normalisePlu(plu)) || [],
        attributes: parseVariantAttributes(getField(row, ["Variants", "Variant"])),
      };
    })
    .filter((product) => product.plu && product.sites.length);

  if (!preparedProducts.length) {
    setStatus("No matching Product PLUs were found between the two files.", true);
    return;
  }

  productOutputHeaders = [...productHeadersBase];
  inventoryOutputHeaders = [...inventoryHeadersBase];
  const uomsByPlu = buildUomsByPlu();
  const maxUomCount = Math.max(0, ...Array.from(uomsByPlu.values(), (uoms) => uoms.length));
  inventoryPreviewHeaders = buildInventoryPreviewHeaders(maxUomCount);
  convertedProducts = [];
  productPreviewRows = [];
  convertedInventoryItems = [];
  inventoryPreviewRows = [];
  convertedModifiers = convertModifierRows();

  preparedProducts.forEach((product) => {
    const productName = getField(product.row, ["Name", "Product Name"]);
    const productSku = getField(product.row, ["Product SKU", "SKU"]) || product.plu;
    const inventoryType = getField(product.row, ["Inventory Type"]);
    const isFinishedGood = normaliseInventoryType(inventoryType) === "finishedgood";
    const batchQty = getField(product.row, ["Batch Qty", "Batch Quantity"]);

    if (isFinishedGood) {
      const site = product.sites[0];
      const uom = getField(site, ["Selling UOM", "UOM"]) || getField(product.row, ["Selling UOM", "UOM"]);
      const menuCategory =
        getField(site, ["Menu Category", "Menu Categories"]) || getField(product.row, ["Menu Categories", "Menu Category"]);
      const sellingPrice = cleanNumber(getField(site, ["Selling Price"]));
      const costPrice = cleanNumber(getField(site, ["Cost Price"]));
      const siteName = getField(site, ["Site", "Site Name"]);
      const barcode = getField(product.row, ["Barcode"]);
      const modifierGroup = getField(product.row, ["Modifier Group", "Modifier Groups"]);
      const attributeCells = [];

      for (let index = 0; index < 3; index += 1) {
        attributeCells.push(product.attributes[index]?.attribute || "", product.attributes[index]?.variant || "");
      }

      convertedProducts.push([
        product.plu,
        productName,
        "",
        sellingPrice,
        "",
        menuCategory,
        productSku,
        costPrice,
        "No",
        "1",
        uom,
        "No",
        "Yes",
        sellingPrice,
        product.attributes.length ? "yes" : "",
        ...attributeCells,
        "",
        barcode,
        "No",
        modifierGroup,
      ]);

      productPreviewRows.push([
        product.plu,
        productName,
        uom,
        menuCategory,
        productSku,
        inventoryType,
        sellingPrice,
        costPrice,
        siteName,
        modifierGroup,
      ]);
      return;
    }

    const site = product.sites[0];
    const uom = getField(site, ["Selling UOM", "UOM"]) || getField(product.row, ["Selling UOM", "UOM"]);
    const menuCategory =
      getField(site, ["Menu Category", "Menu Categories"]) || getField(product.row, ["Menu Categories", "Menu Category"]);
    const sellingPrice = cleanNumber(getField(site, ["Selling Price"]));
    const costPrice = cleanNumber(getField(site, ["Cost Price"]));
    const productType = getField(product.row, ["Product Type"]);
    const itemType = mapItemType(inventoryType, productType);
    const barcode = getField(product.row, ["Barcode"]);
    const productUoms = uomsByPlu.get(normalisePlu(product.plu)) || [];

    convertedInventoryItems.push([
      productName,
      productSku,
      itemType,
      menuCategory,
      uom,
      costPrice,
      "Yes",
      barcode,
      "",
      batchQty,
      "0",
      "0",
      "0",
      "",
      ...buildUomExportCells(productUoms),
    ]);

    inventoryPreviewRows.push([
      product.plu,
      productName,
      ...buildUomCells(productUoms, maxUomCount),
      uom,
      menuCategory,
      productSku,
      inventoryType,
      batchQty,
      sellingPrice,
      costPrice,
    ]);
  });

  paginationPages.products = 1;
  paginationPages.inventory = 1;
  paginationPages.modifiers = 1;
  renderPreviewTable("products");
  renderPreviewTable("inventory");
  renderPreviewTable("modifiers");
  downloadInventoryButton.disabled = convertedInventoryItems.length === 0;
  downloadYocoExportButton.disabled =
    convertedProducts.length === 0 && convertedModifiers.length === 0 && convertedInventoryItems.length === 0;
  setStatus(
    `${convertedProducts.length} product row${convertedProducts.length === 1 ? "" : "s"}, ${convertedInventoryItems.length} inventory item row${convertedInventoryItems.length === 1 ? "" : "s"}, and ${convertedModifiers.length} modifier row${convertedModifiers.length === 1 ? "" : "s"} converted.`,
  );
}

function buildUomCells(uoms, maxUomCount) {
  const cells = [];

  for (let index = 0; index < maxUomCount; index += 1) {
    cells.push(uoms[index]?.title || "", uoms[index]?.unitSize || "");
  }

  return cells;
}

function convertModifierRows() {
  return modifierRows
    .filter((row) => getField(row, ["Modifier Name"]) && getField(row, ["Modifier Option Name", "Option Name"]))
    .map((row) => {
      const type = getField(row, ["Type (Products / Options)", "Type"]);
      const isProduct = String(type || "").trim().toLowerCase() === "products" || String(type || "").trim().toLowerCase() === "product";

      return [
        getField(row, ["Modifier Name"]),
        type,
        getField(row, ["Modifier Option Name", "Option Name"]),
        isProduct ? getField(row, ["UOM (Product Modifier)", "UOM(Product Modifier)", "UOM"]) : "",
        isProduct ? cleanNumber(getField(row, ["Quantity (Product Modifier)", "Quantity(Product Modifier)", "Quantity"])) : "",
      ];
    });
}

function cleanNumber(value) {
  const numeric = String(value || "").replace(/[^\d.-]/g, "");
  if (!numeric) return "";
  return Number(numeric).toFixed(2);
}

function renderTable(headElement, bodyElement, headers, rows, emptyMessage) {
  headElement.innerHTML = "";
  bodyElement.innerHTML = "";

  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    headerRow.appendChild(th);
  });
  headElement.appendChild(headerRow);

  if (!rows.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = headers.length;
    emptyCell.textContent = emptyMessage;
    emptyRow.appendChild(emptyCell);
    bodyElement.appendChild(emptyRow);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    bodyElement.appendChild(tr);
  });
}

let currentPreviewType = "products";
let rowsPerPage = 20;
const paginationPages = { products: 1, inventory: 1, modifiers: 1, recipe: 1 };

function getPreviewDataset(type) {
  switch (type) {
    case "products":
      return {
        head: productsPreviewHead,
        body: productsPreviewBody,
        headers: productPreviewHeaders,
        rows: productPreviewRows,
        emptyMessage: "No converted products yet.",
      };
    case "inventory":
      return {
        head: inventoryPreviewHead,
        body: inventoryPreviewBody,
        headers: inventoryPreviewHeaders,
        rows: inventoryPreviewRows,
        emptyMessage: "No converted inventory items yet.",
      };
    case "modifiers":
      return {
        head: modifiersPreviewHead,
        body: modifiersPreviewBody,
        headers: modifierHeaders,
        rows: convertedModifiers,
        emptyMessage: "No converted modifiers yet.",
      };
    case "recipe":
      return {
        head: recipePreviewHead,
        body: recipePreviewBody,
        headers: recipeHeaders,
        rows: convertedRecipes,
        emptyMessage: "No converted recipe rows yet.",
      };
    default:
      return null;
  }
}

function renderPreviewTable(type) {
  const dataset = getPreviewDataset(type);
  if (!dataset) return;

  const total = dataset.rows.length;
  const perPage = Number.isFinite(rowsPerPage) ? rowsPerPage : Math.max(total, 1);
  const totalPages = total ? Math.ceil(total / perPage) : 1;
  const page = Math.min(Math.max(paginationPages[type] || 1, 1), totalPages);
  paginationPages[type] = page;

  const start = (page - 1) * perPage;
  const pageRows = total ? dataset.rows.slice(start, start + perPage) : [];

  renderTable(dataset.head, dataset.body, dataset.headers, pageRows, dataset.emptyMessage);

  if (type === currentPreviewType) {
    paginationIndicator.textContent = total ? `Page ${page} of ${totalPages}` : "No rows";
    prevPageButton.disabled = page <= 1;
    nextPageButton.disabled = page >= totalPages;
  }
}

function renderAllPreviewTables() {
  ["products", "inventory", "modifiers", "recipe"].forEach(renderPreviewTable);
}

function downloadCsv(headers, rows, filename) {
  const csv = toCsv([headers, ...rows]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadYocoExport() {
  if (!window.XLSX) {
    setStatus("XLSX support is still loading. Check your connection and try again.", true);
    return;
  }

  const workbook = XLSX.utils.book_new();
  const productsSheet = XLSX.utils.aoa_to_sheet([productOutputHeaders, ...convertedProducts]);
  const modifierGroupsSheet = XLSX.utils.aoa_to_sheet([modifierHeaders, ...convertedModifiers]);
  const stockImportSheet = XLSX.utils.aoa_to_sheet([inventoryOutputHeaders, ...convertedInventoryItems]);
  const recipeBuilderSheet = XLSX.utils.aoa_to_sheet([recipeExportHeaders, ...convertedRecipeExport]);

  XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
  XLSX.utils.book_append_sheet(workbook, modifierGroupsSheet, "Modifier_Groups");
  XLSX.utils.book_append_sheet(workbook, stockImportSheet, "Stock_Import");
  XLSX.utils.book_append_sheet(workbook, recipeBuilderSheet, "Recipe Builder");
  XLSX.writeFile(workbook, "yoco-pos-export.xlsx");
}

function showPreview(type) {
  currentPreviewType = type;
  renderPreviewTable(type);

  const showingProducts = type === "products";
  const showingInventory = type === "inventory";
  const showingModifiers = type === "modifiers";
  const showingRecipe = type === "recipe";

  productsPreview.hidden = !showingProducts;
  inventoryPreview.hidden = !showingInventory;
  modifiersPreview.hidden = !showingModifiers;
  recipePreview.hidden = !showingRecipe;
  productsPreview.classList.toggle("active", showingProducts);
  inventoryPreview.classList.toggle("active", showingInventory);
  modifiersPreview.classList.toggle("active", showingModifiers);
  recipePreview.classList.toggle("active", showingRecipe);
  showProductsButton.classList.toggle("active", showingProducts);
  showInventoryButton.classList.toggle("active", showingInventory);
  showModifiersButton.classList.toggle("active", showingModifiers);
  showRecipeButton.classList.toggle("active", showingRecipe);
  showProductsButton.setAttribute("aria-selected", String(showingProducts));
  showInventoryButton.setAttribute("aria-selected", String(showingInventory));
  showModifiersButton.setAttribute("aria-selected", String(showingModifiers));
  showRecipeButton.setAttribute("aria-selected", String(showingRecipe));

  if (showingProducts) {
    previewDescription.textContent = "Finished goods only.";
  } else if (showingInventory) {
    previewDescription.textContent = "All other inventory types, including Batch Qty and optional custom UOMs.";
  } else if (showingModifiers) {
    previewDescription.textContent = "Modifier groups, option names, and product-backed quantities.";
  } else {
    previewDescription.textContent = "Recipe lines with the master product's variant formatted as Name - Value / Value.";
  }
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

productsFile.addEventListener("change", () => {
  const file = productsFile.files[0];
  if (!file) return;

  productsFileName.textContent = file.name;
  readTableFile(
    file,
    (rows) => {
      savePersistedFile("products", file.name, rows);
      loadProductsRows(rows);
    },
    ["Product PLU", "Name"],
  );
});

siteSettingsFile.addEventListener("change", () => {
  const file = siteSettingsFile.files[0];
  if (!file) return;

  siteSettingsFileName.textContent = file.name;
  readTableFile(
    file,
    (rows) => {
      savePersistedFile("siteSettings", file.name, rows);
      loadSiteSettingsRows(rows);
    },
    ["Product PLU", "Site"],
  );
});

modifiersFile.addEventListener("change", () => {
  const file = modifiersFile.files[0];
  if (!file) return;

  modifiersFileName.textContent = file.name;
  readTableFile(
    file,
    (rows) => {
      savePersistedFile("modifiers", file.name, rows);
      loadModifierRows(rows);
    },
    ["Modifier Name", "Type (Products / Options)", "Modifier Option Name"],
  );
});

uomFile.addEventListener("change", () => {
  const file = uomFile.files[0];
  if (!file) return;

  uomFileName.textContent = file.name;
  readTableFile(
    file,
    (rows) => {
      savePersistedFile("uom", file.name, rows);
      loadUomRows(rows);
    },
    ["Product PLU", "Base UOM", "UOM Title", "Unit Size"],
  );
});

recipeFile.addEventListener("change", () => {
  const file = recipeFile.files[0];
  if (!file) return;

  recipeFileName.textContent = file.name;
  readTableFile(
    file,
    (rows) => {
      savePersistedFile("recipe", file.name, rows);
      loadRecipeRows(rows);
    },
    ["Master Product Name", "Recipe Product Name", "Unit of Measure", "Quantity"],
  );
});

convertButton.addEventListener("click", convertRows);
showProductsButton.addEventListener("click", () => showPreview("products"));
showInventoryButton.addEventListener("click", () => showPreview("inventory"));
showModifiersButton.addEventListener("click", () => showPreview("modifiers"));
showRecipeButton.addEventListener("click", () => showPreview("recipe"));
downloadInventoryButton.addEventListener("click", () => {
  downloadCsv(inventoryOutputHeaders, convertedInventoryItems, "yoco-pos-inventory-items.csv");
});
downloadRecipeButton.addEventListener("click", () => {
  downloadCsv(recipeExportHeaders, convertedRecipeExport, "yoco-pos-recipe.csv");
});
downloadYocoExportButton.addEventListener("click", downloadYocoExport);

loadSampleButton.addEventListener("click", () => {
  const sampleProducts = [
    [
      "Product PLU",
      "Name",
      "Variants",
      "Menu Categories",
      "Inventory Type",
      "Product Type",
      "Batch Qty",
      "Selling UOM",
      "Product SKU",
      "Barcode",
      "Modifier Group",
    ],
    ["PLU-1001", "Flat white", "1.Order Type: Sit Down; 2. Milk: Yes", "Coffee", "finishedGood", "", "", "ea", "COF-FW", "6001001001001", "Milk Type"],
    ["PLU-1002", "Chicken wrap", "1.Order Type: Take Away; 2. Side: Chips", "Lunch", "finishedGood", "", "", "ea", "LUN-CW", "6001001001002", ""],
    ["PLU-1003", "Basil pesto", "", "Prep", "rawMaterial", "preparation", "0.7", "l", "PREP-BP", "", ""],
  ];

  const sampleSiteSettings = [
    ["Product PLU", "Site", "Selling UOM", "Menu Category", "Cost Price", "Selling Price"],
    ["PLU-1001", "Cape Town", "ea", "Coffee", "14.50", "34.00"],
    ["PLU-1001", "Johannesburg", "ea", "Coffee", "14.50", "35.00"],
    ["PLU-1002", "Cape Town", "ea", "Lunch", "41.20", "89.50"],
    ["PLU-1003", "Cape Town", "l", "Prep", "235.32", "0"],
  ];

  const sampleModifiers = [
    ["Modifier Name", "Type (Products / Options)", "Modifier Option Name", "Modifier Product Name", "Quantity (Product Modifier)", "UOM (Product Modifier)"],
    ["Milk Type", "products", "(RAW) Milk", "(RAW) Milk", "0.05", "l"],
    ["Milk Type", "products", "(RAW) Oat Milk", "(RAW) Oat Milk", "0.05", "l"],
    ["Egg Type", "options", "Soft Egg", "", "1", ""],
  ];

  const sampleUoms = [
    ["Product PLU", "Base UOM", "UOM Title", "Unit Size"],
    ["PLU-1003", "l", "5L", "5"],
    ["PLU-1003", "l", "500ml Bottle", "0.5"],
  ];

  const sampleRecipe = [
    ["Master Product PLU", "Product Type", "Master Product Name", "Recipe Product PLU", "Recipe Product Name", "Unit of Measure", "Quantity"],
    ["rlssdmbhff", "Composite", "AMERICANO - 1.Order Type: Take Away, 2. Milk: Yes", "PLU-RAW-1040", "(RAW) Rock n Rolla Coffee", "kg", "0.018"],
    ["wdbksbcnkq", "Composite", "AMERICANO - 1.Order Type: Sit Down, 2. Milk: Yes", "PLU-RAW-1040", "(RAW) Rock n Rolla Coffee", "kg", "0.018"],
  ];

  productsFileName.textContent = "Sample Products - Update";
  siteSettingsFileName.textContent = "Sample Site Settings";
  modifiersFileName.textContent = "Sample Modifier Items";
  uomFileName.textContent = "Sample Custom UOMs";
  recipeFileName.textContent = "Sample Recipe";
  loadProductsRows(sampleProducts);
  loadSiteSettingsRows(sampleSiteSettings);
  loadModifierRows(sampleModifiers);
  loadUomRows(sampleUoms);
  loadRecipeRows(sampleRecipe);
});

function clearAll() {
  productRows = [];
  siteRows = [];
  modifierRows = [];
  uomRows = [];
  recipeRows = [];
  convertedRecipes = [];
  convertedRecipeExport = [];

  productsFile.value = "";
  siteSettingsFile.value = "";
  modifiersFile.value = "";
  uomFile.value = "";
  recipeFile.value = "";
  productsFileName.textContent = "Required product workbook";
  siteSettingsFileName.textContent = "Required workbook for all sites";
  modifiersFileName.textContent = "Required modifier workbook";
  uomFileName.textContent = "Optional inventory workbook";
  recipeFileName.textContent = "Optional recipe workbook";

  downloadRecipeButton.disabled = true;
  paginationPages.recipe = 1;
  renderPreviewTable("recipe");
  resetConvertedData();
  clearPersistedUploads();
  setStatus("Waiting for Products - Update, Site Settings, and Modifier Items.");
}

function applyTheme(theme) {
  if (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  }
}

function isDarkTheme() {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit) return explicit === "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

clearAllButton.addEventListener("click", clearAll);
themeToggleButton.addEventListener("click", () => {
  applyTheme(isDarkTheme() ? "light" : "dark");
});

function driveEmbedUrl(fileId, autoplay) {
  return `https://drive.google.com/file/d/${fileId}/preview${autoplay ? "?autoplay=1" : ""}`;
}

const videoPopover = document.querySelector("#video-popover");
const videoPopoverFrame = document.querySelector("#video-popover-frame");
const videoModal = document.querySelector("#video-modal");
const videoModalFrame = document.querySelector("#video-modal-frame");
const videoModalClose = document.querySelector("#video-modal-close");
const videoModalBackdrop = document.querySelector("#video-modal-backdrop");

function hideVideoPopover() {
  videoPopover.hidden = true;
  videoPopoverFrame.src = "";
}

function showVideoPopover(trigger, fileId) {
  const rect = trigger.getBoundingClientRect();
  const width = 320;
  const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
  const top = rect.bottom + 8;

  videoPopoverFrame.src = driveEmbedUrl(fileId, true);
  videoPopover.style.left = `${left}px`;
  videoPopover.style.top = `${top}px`;
  videoPopover.hidden = false;
}

function openVideoModal(fileId) {
  hideVideoPopover();
  videoModalFrame.src = driveEmbedUrl(fileId, true);
  videoModal.hidden = false;
}

function closeVideoModal() {
  videoModal.hidden = true;
  videoModalFrame.src = "";
}

document.querySelectorAll(".video-trigger").forEach((trigger) => {
  const fileId = trigger.dataset.videoId;

  trigger.addEventListener("mouseenter", () => showVideoPopover(trigger, fileId));
  trigger.addEventListener("focus", () => showVideoPopover(trigger, fileId));
  trigger.addEventListener("mouseleave", hideVideoPopover);
  trigger.addEventListener("blur", hideVideoPopover);
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openVideoModal(fileId);
  });
});

videoModalClose.addEventListener("click", closeVideoModal);
videoModalBackdrop.addEventListener("click", closeVideoModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !videoModal.hidden) closeVideoModal();
});

rowsPerPageSelect.addEventListener("change", () => {
  rowsPerPage = rowsPerPageSelect.value === "all" ? Infinity : Number(rowsPerPageSelect.value);
  paginationPages.products = 1;
  paginationPages.inventory = 1;
  paginationPages.modifiers = 1;
  paginationPages.recipe = 1;
  renderPreviewTable(currentPreviewType);
});

prevPageButton.addEventListener("click", () => {
  paginationPages[currentPreviewType] = Math.max(1, (paginationPages[currentPreviewType] || 1) - 1);
  renderPreviewTable(currentPreviewType);
});

nextPageButton.addEventListener("click", () => {
  paginationPages[currentPreviewType] = (paginationPages[currentPreviewType] || 1) + 1;
  renderPreviewTable(currentPreviewType);
});

resetConvertedData();
renderPreviewTable("recipe");
showPreview("products");

(function restorePersistedUploads() {
  const persisted = loadPersistedUploads();

  if (persisted.products) {
    productsFileName.textContent = persisted.products.name;
    loadProductsRows(persisted.products.rows);
  }
  if (persisted.siteSettings) {
    siteSettingsFileName.textContent = persisted.siteSettings.name;
    loadSiteSettingsRows(persisted.siteSettings.rows);
  }
  if (persisted.modifiers) {
    modifiersFileName.textContent = persisted.modifiers.name;
    loadModifierRows(persisted.modifiers.rows);
  }
  if (persisted.uom) {
    uomFileName.textContent = persisted.uom.name;
    loadUomRows(persisted.uom.rows);
  }
  if (persisted.recipe) {
    recipeFileName.textContent = persisted.recipe.name;
    loadRecipeRows(persisted.recipe.rows);
  }

  if (productRows.length && siteRows.length && modifierRows.length) {
    convertRows();
  }
})();
